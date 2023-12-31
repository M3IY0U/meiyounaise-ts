import MeiyounaiseDB from "./db/MeiyounaiseDB.js";
import { BoardHandlers } from "./handlers/BoardHandlers.js";
import {
  executeSimpleCommand,
  executeSlashCommand,
} from "./handlers/Commands.js";
import { handleEventError } from "./handlers/Errors.js";
import { GuildHandlers } from "./handlers/GuildHandlers.js";
import { Stats } from "./metrics/Stats.js";
import { Logger } from "./util/Logger.js";
import { UnknownAvatar } from "./util/general.js";
import { dirname, importx } from "@discordx/importer";
import { Mutex } from "async-mutex";
import {
  EmbedBuilder,
  IntentsBitField,
  Message,
  Partials,
  WebhookClient,
} from "discord.js";
import { Client, MetadataStorage } from "discordx";
import { readFileSync } from "fs";
import { Container } from "typedi";

export class Meiyounaise {
  public Bot: Client;
  private isProd: boolean;
  private devGuild = "328353999508209678";
  private stats = new Stats();
  private boardAddMutex = new Mutex();
  private boardRmMutex = new Mutex();

  constructor() {
    this.isProd = process.env.NODE_ENV !== "development";
    this.Bot = new Client({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.MessageContent,
      ],
      silent: this.isProd,
      simpleCommand: {
        prefix: process.env.PREFIX ?? "%",
      },
      allowedMentions: {
        repliedUser: false,
      },
      botGuilds: this.isProd ? undefined : [this.devGuild],
      partials: [Partials.Reaction, Partials.Message, Partials.Channel],
    });
  }

  private async initCommands() {
    if (this.isProd) await this.Bot.initGlobalApplicationCommands();
    else
      await this.Bot.initGuildApplicationCommands(this.devGuild, [
        ...MetadataStorage.instance.applicationCommandSlashes,
      ]);
  }

  private async announceRestart() {
    let content = "Couldn't read restart file";
    try {
      const file = readFileSync(process.env.RESTART_PATH as string, "utf-8");
      const ts = new Date(parseInt(file));
      const time = (new Date().getTime() - ts.getTime()) / 1000;
      content = `Started: <t:${Math.floor(
        ts.getTime() / 1000,
      )}:T>\nEnded: <t:${Math.floor(
        Date.now() / 1000,
      )}:T>\n(took ${time.toFixed(2)}s)`;
    } catch {}

    try {
      const webhook = new WebhookClient({
        url: process.env.WEBHOOK_URL ?? "",
      });

      await webhook.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`Bot ${this.Bot.user?.username} restarted`)
            .setDescription(content)
            .setColor("Blurple")
            .setThumbnail(this.Bot.user?.displayAvatarURL() ?? UnknownAvatar),
        ],
      });
    } catch (e) {
      Logger.warn(`Error sending restart webhook: ${e}`);
    }
  }

  private startsWithCommand = (message: Message) => {
    return [...MetadataStorage.instance.simpleCommandsByName.values()].some(
      (x) => message.content.substring(1).startsWith(x.name),
    );
  };

  public async start() {
    this.Bot.once("ready", async () => {
      Logger.info("Initializing slash commands");
      this.initCommands();
      Logger.info(
        `Logged in as ${this.Bot.user?.username} (${this.Bot.user?.id})`,
      );
      if (this.isProd) await this.announceRestart();

      await this.stats.initBotStats(this.Bot);
      this.stats.createMetricEventHandlers(this.Bot);
    });

    // commands
    this.Bot.on("interactionCreate", async (interaction) => {
      // do not execute interaction, if it's pagination (avoid warning: select-menu/button interaction not found)
      if (interaction.isButton() || interaction.isStringSelectMenu()) {
        if (interaction.customId.startsWith("discordx@pagination@")) {
          return;
        }
      }

      await executeSlashCommand(interaction, this.Bot, this.stats);
    });

    this.Bot.on("messageCreate", async (message: Message) => {
      if (
        message.author.bot ||
        !this.Bot.simpleCommandConfig?.prefix ||
        !message.content.startsWith(
          this.Bot.simpleCommandConfig.prefix as string,
        )
      )
        return;

      await executeSimpleCommand(message, this.Bot, this.stats);
    });

    // message events
    this.Bot.on("messageCreate", async (message: Message) => {
      if (message.author.bot || this.startsWithCommand(message)) return;

      const timer = this.stats.eventStats.eventHistogram.startTimer();
      try {
        await GuildHandlers.spotifyPreview([message], this.stats);
      } catch (e) {
        Logger.warn(`Error executing spotifyEmbed: ${e}`);
      } finally {
        timer();
      }
    });

    this.Bot.on("messageCreate", async (message: Message) => {
      try {
        await GuildHandlers.repeatMessage([message]);
      } catch (e) {
        Logger.warn(`Error executing repeatMessage: ${e}`);
      }
    });

    this.Bot.on("messageCreate", async (message: Message) => {
      if (message.author.bot || this.startsWithCommand(message)) return;

      const timer = this.stats.eventStats.eventHistogram.startTimer();
      try {
        await GuildHandlers.anilistEmbed([message], this.stats);
      } catch (e) {
        Logger.warn(`Error executing anilistEmbed: ${e}`);
      } finally {
        timer();
      }
    });

    // other events
    this.Bot.on("messageReactionAdd", async (reaction, user) => {
      const timer = this.stats.eventStats.eventHistogram.startTimer();
      try {
        await this.boardAddMutex.runExclusive(async () => {
          await BoardHandlers.onReactionAdd([reaction, user], this.stats);
        });
      } catch (e) {
        handleEventError(
          "messageReactionAdd",
          [reaction, reaction.message, user],
          e,
        );
      } finally {
        timer();
      }
    });

    this.Bot.on("messageReactionRemove", async (reaction, user) => {
      const timer = this.stats.eventStats.eventHistogram.startTimer();
      try {
        await this.boardRmMutex.runExclusive(async () => {
          await BoardHandlers.onReactionRm([reaction, user], this.stats);
        });
      } catch (e) {
        handleEventError(
          "messageReactionRemove",
          [reaction, reaction.message, user],
          e,
        );
      } finally {
        timer();
      }
    });

    this.Bot.on("guildMemberAdd", async (member) => {
      const timer = this.stats.eventStats.eventHistogram.startTimer();
      try {
        await GuildHandlers.onMemberAdd([member], this.stats);
      } catch (e) {
        handleEventError("guildMemberAdd", [member], e);
      } finally {
        timer();
      }
    });

    this.Bot.on("guildMemberRemove", async (member) => {
      const timer = this.stats.eventStats.eventHistogram.startTimer();

      try {
        await GuildHandlers.onMemberRemove([member], this.stats);
      } catch (e) {
        handleEventError("guildMemberRemove", [member], e);
      } finally {
        timer();
      }
    });

    // rome-ignore lint/style/noNonNullAssertion: can't be undefined
    Container.set("simpleCommandConfig", this.Bot.simpleCommandConfig!);

    await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);

    await this.Bot.login(process.env.BOT_TOKEN ?? "").catch(async (e) => {
      console.error(e);
      await Container.get(MeiyounaiseDB).disconnect();
      process.exit(1);
    });
  }
}
