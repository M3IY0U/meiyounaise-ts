import { BoardHandlers } from "./handlers/BoardHandlers.js";
import { handleError } from "./handlers/Errors.js";
import { GuildHandlers } from "./handlers/GuildHandlers.js";
import { IntentsBitField, Message, Partials } from "discord.js";
import { Client } from "discordx";

export const Meiyounaise = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildVoiceStates,
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

Meiyounaise.once("ready", async () => {
  console.log("Clearing commands...");
  //await Meiyounaise.clearApplicationCommands("328353999508209678");
  console.log("Registering commands...");
  //await Meiyounaise.initApplicationCommands();

  console.log(
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
    await Meiyounaise.executeInteraction(interaction);
  } catch (e) {
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
  await GuildHandlers.spotifyEmbed([message]);
});

Meiyounaise.on("messageCreate", async (message: Message) => {
  await GuildHandlers.repeatMessage([message]);
});

Meiyounaise.on("messageCreate", async (message: Message) => {
  await GuildHandlers.anilistEmbed([message]);
});

Meiyounaise.on("messageReactionAdd", async (reaction, user) => {
  await BoardHandlers.onReactionAdd([reaction, user]);
});

Meiyounaise.on("messageReactionRemove", async (reaction, user) => {
  await BoardHandlers.onReactionRm([reaction, user]);
});

Meiyounaise.on("guildMemberAdd", async (member) => {
  await GuildHandlers.onMemberAdd([member]);
});

Meiyounaise.on("guildMemberRemove", async (member) => {
  await GuildHandlers.onMemberRemove([member]);
});
