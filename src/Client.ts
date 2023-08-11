import { Container } from "typedi";
import MeiyounaiseDB from "./db/MeiyounaiseDB.js";
import { BoardHandlers } from "./handlers/BoardHandlers.js";
import { GuildHandlers } from "./handlers/GuildHandlers.js";
import { executeSimpleCommand, executeSlashCommand } from "./util/Commands.js";
import { Logger } from "./util/Logger.js";
import {
  EmbedBuilder,
  IntentsBitField,
  Message,
  Partials,
  WebhookClient,
} from "discord.js";
import { Client } from "discordx";
import { dirname, importx } from "@discordx/importer";
import { readFileSync } from "fs";
import { UnknownAvatar } from "./util/general.js";

export class Meiyounaise {
  public Bot: Client;
  private isProd: boolean;

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
        prefix: "%",
        responses: {
          notFound: "Command not found",
        },
      },
      allowedMentions: {
        repliedUser: false,
      },
      botGuilds: this.isProd ? undefined : ["328353999508209678"],
      partials: [Partials.Reaction, Partials.Message, Partials.Channel],
    });
  }

  private async initCommands() {
    if (this.isProd) await this.Bot.initGlobalApplicationCommands();
    else await this.Bot.initApplicationCommands();
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

  public async start() {
    this.Bot.once("ready", async () => {
      Logger.info("Initializing slash commands");
      this.initCommands();
      Logger.info(
        `Logged in as ${this.Bot.user?.username} (${this.Bot.user?.id})`,
      );
      await this.announceRestart();
    });

    this.Bot.on("interactionCreate", async (interaction) => {
      // do not execute interaction, if it's pagination (avoid warning: select-menu/button interaction not found)
      if (interaction.isButton() || interaction.isStringSelectMenu()) {
        if (interaction.customId.startsWith("discordx@pagination@")) {
          return;
        }
      }

      await executeSlashCommand(interaction, this.Bot);
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

      await executeSimpleCommand(message, this.Bot);
    });

    this.Bot.on("messageCreate", async (message: Message) => {
      try {
        await GuildHandlers.spotifyEmbed([message]);
      } catch (e) {
        Logger.warn(`Error executing spotifyEmbed: ${e}`);
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
      try {
        await GuildHandlers.anilistEmbed([message]);
      } catch (e) {
        Logger.warn(`Error executing anilistEmbed: ${e}`);
      }
    });

    this.Bot.on("messageReactionAdd", async (reaction, user) => {
      try {
        await BoardHandlers.onReactionAdd([reaction, user]);
      } catch (e) {
        Logger.warn(`Error executing onReactionAdd: ${e}`);
      }
    });

    this.Bot.on("messageReactionRemove", async (reaction, user) => {
      try {
        await BoardHandlers.onReactionRm([reaction, user]);
      } catch (e) {
        Logger.warn(`Error executing onReactionRm: ${e}`);
      }
    });

    this.Bot.on("guildMemberAdd", async (member) => {
      try {
        await GuildHandlers.onMemberAdd([member]);
      } catch (e) {
        Logger.warn(`Error executing onMemberAdd: ${e}`);
      }
    });

    this.Bot.on("guildMemberRemove", async (member) => {
      try {
        await GuildHandlers.onMemberRemove([member]);
      } catch (e) {
        Logger.warn(`Error executing onMemberRemove: ${e}`);
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
