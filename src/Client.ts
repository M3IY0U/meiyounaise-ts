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
  await Meiyounaise.clearApplicationCommands("328353999508209678");
  console.log("Registering commands...");
  await Meiyounaise.initApplicationCommands();

  console.log(
    `Logged in as ${Meiyounaise.user?.username} (${Meiyounaise.user?.id})`,
  );
});

Meiyounaise.on("messageCreate", (message) => {
  if (message.content.startsWith("echo")) {
    message.reply(message.content.split(" ").slice(1).join(" "));
  }
});

Meiyounaise.on("interactionCreate", (interaction) => {
  try{
    Meiyounaise.executeInteraction(interaction);
  }
  catch(e){
    interaction.channel?.send(`Something went wrong\n${e}`);
    console.error(e);
  }
});

Meiyounaise.on("messageCreate", (message: Message) => {
  Meiyounaise.executeCommand(message);
});

Meiyounaise.on("messageReactionAdd", (reaction, user) => {
  Meiyounaise.executeReaction(reaction, user);
});
