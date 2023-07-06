import {
  AutocompleteInteraction,
  ColorResolvable,
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
      embeds: responseEmbed(ResponseType.Error, `\`\`\`${e}\`\`\``),
    },
    interaction,
  );
}

export enum ResponseType {
  Info = 0,
  Success = 1,
  Permission = 2,
  Error = 3,
}

export function responseEmbed(type: ResponseType, content: string) {
  let color: ColorResolvable;
  let title: string;
  switch (type) {
    case ResponseType.Info:
      title = "🔷 Info";
      color = "Blue";
      break;
    case ResponseType.Success:
      title = "✅ Success";
      color = "Green";
      break;
    case ResponseType.Permission:
      title = "⚠️ Insufficient Permissions";
      color = "Yellow";
      break;
    case ResponseType.Error:
      title = "❌ Error";
      color = "Red";
      break;
  }

  return [
    new EmbedBuilder()
      .setTitle(title)
      .setDescription(content)
      .setColor(color)
      .toJSON(),
  ];
}
