import {
  ColorResolvable,
  CommandInteraction,
  EmbedBuilder,
  GuildMember,
  Message,
  MessageComponentInteraction,
  MessageReplyOptions,
  ModalSubmitInteraction,
} from "discord.js";

export const UnknownAvatar = "https://cdn.discordapp.com/embed/avatars/0.png";

export async function respond(
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

export const stripText = (text: string) =>
  text.replaceAll(
    /([`\*_~\[\]\(\)""\|]|<@\!?\d+>|<#\d+>|<@\&\d+>|<:[a-zA-Z0-9_\-]:\d+>)/g,
    "",
  );

export const maskedUrl = (text: string, url: string, alt?: string) =>
  `[${text}](${url}${alt ? ` "${alt}"` : ""})`;

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

export async function silently<T>(p?: Promise<T>) {
  try {
    return await p;
  } catch {}
}

export const getUserAvatar = (interaction: Message | CommandInteraction) =>
  interaction instanceof Message
    ? interaction.author.displayAvatarURL()
    : interaction.user.displayAvatarURL();

export const getUserName = (interaction: Message | CommandInteraction) =>
  interaction instanceof Message
    ? interaction.member?.nickname ??
      interaction.member?.displayName ??
      interaction.author.username
    : interaction.user.username;

export const getGuildIcon = (interaction: Message | CommandInteraction) =>
  interaction.guild?.iconURL() ?? UnknownAvatar;

export const getUserColor = (
  interaction: Message | CommandInteraction,
): ColorResolvable =>
  interaction instanceof Message
    ? interaction.member?.displayColor ?? "Random"
    : (interaction.member as GuildMember).displayColor ?? "Random";

export class InfoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InfoError";
  }
}

export function paginateStrings(
  texts: string[],
  separator: string,
  maxLength: number,
) {
  const pages = [];
  let toAdd = "";

  for (let i = 0; i < texts.length; i++) {
    toAdd += texts[i];
    if (i + 1 !== texts.length) toAdd += separator;

    if (toAdd.length <= maxLength && texts.length > i + 1) continue;
    pages.push(toAdd);
    toAdd = "";
  }

  return pages;
}
