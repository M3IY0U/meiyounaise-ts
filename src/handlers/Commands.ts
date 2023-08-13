import { Stats } from "../metrics/Stats.js";
import { Logger } from "../util/Logger.js";
import { handleError } from "./Errors.js";
import {
  ApplicationCommandType,
  CacheType,
  Interaction,
  Message,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { Client } from "discordx";

export const executeSimpleCommand = async (
  message: Message,
  bot: Client,
  stats: Stats,
) => {
  const [name, ...args] = message.content.split(" ");

  const command = name.substring(1);
  const subLogger = Logger.getSubLogger({
    name: "SimpleCommandLogger",
    hideLogPositionForProduction: true,
  });

  subLogger.info(
    `Executing command '${command}' with args '${JSON.stringify(args)}'`,
    {
      guildName: message.guild?.name,
      guildId: message.guildId ?? undefined,
      channelName: message.inGuild() ? message.channel.name : "DM",
      channelId: message.channelId,
      authorId: message.author.id,
      authorName: message.author.username,
    } satisfies LogContext,
  );
  const timer = stats.commandStats.simpleCommandsHistogram.startTimer();
  try {
    await bot.executeCommand(message);
    timer({ command, success: "true" });
    stats.commandStats.simpleCommands.inc({ command });
  } catch (e) {
    await handleError(message, e);
    timer({ command, success: "false" });
    stats.commandStats.simpleCommandErrors.inc({ command });
  }
};

export const executeSlashCommand = async (
  interaction:
    | Interaction<CacheType>
    | MessageContextMenuCommandInteraction<CacheType>,
  bot: Client,
  stats: Stats,
) => {
  const subLogger = Logger.getSubLogger({
    name: "InteractionLogger",
    hideLogPositionForProduction: true,
  });

  if (interaction.isCommand() || interaction.isChatInputCommand()) {
    let name = interaction.commandName;
    let args = interaction.options.data.map(
      (option) => `${option.name}: ${option.value}`,
    );

    if (interaction.type === 2) {
      interaction.options.data.forEach((option) => {
        if (option.type === 1) {
          name += ` ${option.name}`;
          args =
            option.options?.map(
              (option) => `${option.name}: ${option.value}`,
            ) ?? [];
        }
      });
    }

    let type: string;
    switch (interaction.commandType) {
      case ApplicationCommandType.ChatInput:
        type = "slash command";
        break;
      case ApplicationCommandType.Message:
        type = "message context menu";
        break;
      case ApplicationCommandType.User:
        type = "user context menu";
        break;
      default:
        type = "unknown command";
        break;
    }

    subLogger.info(
      `Executing ${type}: ${name}${
        args.length > 0 ? ` with args '${JSON.stringify(args)}'` : ""
      }`,
      {
        guildName: interaction.guild?.name,
        guildId: interaction.guildId ?? undefined,
        channelName: interaction.inGuild() ? interaction.channel?.name : "DM",
        channelId: interaction.channelId,
        authorId: interaction.user.id,
        authorName: interaction.user.username,
      } satisfies LogContext,
    );
  } else {
    subLogger.info(`Executing interaction: ${interaction}`, {
      guildName: interaction.guild?.name,
      guildId: interaction.guildId ?? undefined,
      channelName: interaction.inGuild() ? interaction.channel?.name : "DM",
      channelId: interaction.channelId ?? undefined,
      authorId: interaction.user.id,
      authorName: interaction.user.username,
    } satisfies LogContext);
  }

  const command = interaction.toString();
  const timer = stats.commandStats.slashCommandsHistogram.startTimer();
  try {
    await bot.executeInteraction(interaction);
    timer({ command, success: "true" });
    stats.commandStats.slashCommands.inc({ command });
  } catch (e) {
    await handleError(interaction, e);
    timer({ command, success: "false" });
    stats.commandStats.slashCommandErrors.inc({ command });
  }
};

type LogContext = {
  guildName?: string;
  guildId?: string;
  channelName?: string;
  channelId?: string;
  authorName: string;
  authorId: string;
};
