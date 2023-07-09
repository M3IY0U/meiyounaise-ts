import { IntentsBitField, Message, Partials } from "discord.js";
import { Client } from "discordx";
import { handleError } from "./commands/util.js";
import { BoardHandlers } from "./handlers/BoardHandlers.js";

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
  try {
    await Meiyounaise.executeInteraction(interaction);
  } catch (e) {
    await handleError(interaction, e);
  }
});

Meiyounaise.on("messageCreate", async (message: Message) => {
  try {
    await Meiyounaise.executeCommand(message);
  } catch (e) {
    await handleError(message, e);
  }
});

Meiyounaise.on("messageReactionAdd", (reaction, user) => {
  BoardHandlers.onReactionAdd([reaction, user]);
});

Meiyounaise.on("messageReactionRemove", (reaction, user) => {
  BoardHandlers.onReactionRm([reaction, user]);
});
