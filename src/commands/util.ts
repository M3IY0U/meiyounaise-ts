import {
  AutocompleteInteraction,
  CommandInteraction,
  EmbedBuilder,
  Message,
  MessageComponentInteraction,
  MessageReplyOptions,
  ModalSubmitInteraction,
} from "discord.js";

export async function polyReply(
  toSend: MessageReplyOptions,
  interaction:
    | CommandInteraction
    | Message
    | MessageComponentInteraction
    | ModalSubmitInteraction,
) {
  if (interaction instanceof Message) {
    await interaction.reply(toSend);
  } else {
    if (!interaction.replied)
      await interaction.followUp({
        content: toSend.content,
        embeds: toSend.embeds,
      });
    else
      await interaction.reply({
        content: toSend.content,
        embeds: toSend.embeds,
      });
  }
}

export async function polyEdit(
  toSend: MessageReplyOptions,
  interaction:
    | CommandInteraction
    | Message
    | MessageComponentInteraction
    | ModalSubmitInteraction,
) {
  if (interaction instanceof Message) {
    await interaction.reply(toSend);
  } else {
    await interaction.editReply(toSend);
  }
}

export const maskedUrl = (text: string, url: string, alt?: string) =>
  `[${text}](${url}${alt ? ` "${alt}"` : ""})`;

export async function handleError(
  interaction:
    | CommandInteraction
    | Message
    | MessageComponentInteraction
    | AutocompleteInteraction
    | ModalSubmitInteraction,
  e: unknown,
) {
  if (e instanceof Error) {
    console.error(e.message);
  } else {
    console.error(e);
  }

  if (interaction instanceof AutocompleteInteraction) return;

  await polyReply(
    {
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ Something went wrong using this command")
          .setDescription(`\`\`\`${e}\`\`\``)
          .setColor("Red")
          .toJSON(),
      ],
    },
    interaction,
  );
}
