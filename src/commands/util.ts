import { CommandInteraction, Message, MessageReplyOptions } from "discord.js";

export async function polyReply(
  toSend: MessageReplyOptions,
  interaction: CommandInteraction | Message,
) {
  // interaction means editing the slash command response (own message)
  if (interaction instanceof CommandInteraction) {
    await interaction.editReply(toSend);
  } else {
    // simple interaction are not own messages so reply to them
    await interaction.reply(toSend);
  }
}

export function maskedUrl(text: string, url: string, alt?: string) {
  return `[${text}](${url}${alt ? ` "${alt}"` : ""})`;
}
