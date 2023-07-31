import { Container } from "typedi";
import { BoardHandlers } from "./handlers/BoardHandlers.js";
import { handleError } from "./handlers/Errors.js";
import { GuildHandlers } from "./handlers/GuildHandlers.js";
import { IntentsBitField, Message, Partials } from "discord.js";
import { Client } from "discordx";
import { Logger, ILogObj } from "tslog";

export const Meiyounaise = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.MessageContent,
  ],
  silent: false,
  simpleCommand: {
    prefix: "%",
    responses: {
      notFound: "Command not found",
    },
  },
  allowedMentions: {
    repliedUser: false,
  },
  botGuilds: ["328353999508209678"],
  partials: [Partials.Reaction, Partials.Message, Partials.Channel],
});

const logger = new Logger<undefined>();

Meiyounaise.once("ready", async () => {
  logger.info("Clearing commands...");
  //await Meiyounaise.clearApplicationCommands("328353999508209678");
  logger.info("Registering commands...");
  //await Meiyounaise.initApplicationCommands();
  logger.info(
    `Logged in as ${Meiyounaise.user?.username} (${Meiyounaise.user?.id})`,
  );
});

Meiyounaise.on("interactionCreate", async (interaction) => {
  // do not execute interaction, if it's pagination (avoid warning: select-menu/button interaction not found)
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith("discordx@pagination@")) {
      return;
    }
  }
  try {
    logger.info(`Executing interaction: ${interaction}`);
    await Meiyounaise.executeInteraction(interaction);
  } catch (e) {
    logger.error(`Error executing interaction: ${interaction}`);
    await handleError(interaction, e);
  }
});

Meiyounaise.on("messageCreate", async (message: Message) => {
  if (message.author.bot) return;
  try {
    await Meiyounaise.executeCommand(message);
  } catch (e) {
    await handleError(message, e);
  }
});

Meiyounaise.on("messageCreate", async (message: Message) => {
  try {
    await GuildHandlers.spotifyEmbed([message]);
  } catch (e) {
    logger.warn(`Error executing spotifyEmbed: ${e}`);
  }
});

Meiyounaise.on("messageCreate", async (message: Message) => {
  try {
    await GuildHandlers.repeatMessage([message]);
  } catch (e) {
    logger.warn(`Error executing repeatMessage: ${e}`);
  }
});

Meiyounaise.on("messageCreate", async (message: Message) => {
  try {
    await GuildHandlers.anilistEmbed([message]);
  } catch (e) {
    logger.warn(`Error executing anilistEmbed: ${e}`);
  }
});

Meiyounaise.on("messageReactionAdd", async (reaction, user) => {
  try {
    await BoardHandlers.onReactionAdd([reaction, user]);
  } catch (e) {
    logger.warn(`Error executing onReactionAdd: ${e}`);
  }
});

Meiyounaise.on("messageReactionRemove", async (reaction, user) => {
  try {
    await BoardHandlers.onReactionRm([reaction, user]);
  } catch (e) {
    logger.warn(`Error executing onReactionRm: ${e}`);
  }
});

Meiyounaise.on("guildMemberAdd", async (member) => {
  try {
    await GuildHandlers.onMemberAdd([member]);
  } catch (e) {
    logger.warn(`Error executing onMemberAdd: ${e}`);
  }
});

Meiyounaise.on("guildMemberRemove", async (member) => {
  try {
    await GuildHandlers.onMemberRemove([member]);
  } catch (e) {
    logger.warn(`Error executing onMemberRemove: ${e}`);
  }
});
