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
import { Client, MetadataStorage } from "discordx";

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

  if (
    MetadataStorage.instance.simpleCommandsByName.find(
      (c) => c.name === command || c.name === `${command} ${args[0]}`,
    ) === undefined
  ) {
    subLogger.silly(
      `Ignoring unknown command '${command}' with args '${JSON.stringify(
        args,
      )}'`,
    );
    stats.commandStats.simpleCommands.inc({ command: "unknown" });
    await message.react("❓");
    return;
  }

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
    stats.commandStats.simpleCommands.inc({ command });
  } catch (e) {
    await handleError(message, e);
    stats.commandStats.simpleCommandErrors.inc({ command });
  } finally {
    timer();
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

  let command = interaction.toString();

  if (interaction.isCommand() || interaction.isContextMenuCommand()) {
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

    command = name;
  } else {
    command = "other interaction";
    subLogger.info(
      `Executing interaction: ${
        interaction.isModalSubmit() ? interaction.customId : interaction.id
      }`,
      {
        guildName: interaction.guild?.name,
        guildId: interaction.guildId ?? undefined,
        channelName: interaction.inGuild() ? interaction.channel?.name : "DM",
        channelId: interaction.channelId ?? undefined,
        authorId: interaction.user.id,
        authorName: interaction.user.username,
      } satisfies LogContext,
    );
  }

  const timer = stats.commandStats.slashCommandsHistogram.startTimer();
  try {
    await bot.executeInteraction(interaction);
    stats.commandStats.slashCommands.inc({ command });
  } catch (e) {
    await handleError(interaction, e);
    stats.commandStats.slashCommandErrors.inc({ command });
  } finally {
    timer();
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
