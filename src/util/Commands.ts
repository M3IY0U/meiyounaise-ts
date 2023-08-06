import {
  CacheType,
  Interaction,
  Message,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { Logger } from "./Logger.js";
import { Meiyounaise } from "../Client.js";
import { handleError } from "../handlers/Errors.js";

export const executeSimpleCommand = async (command: Message) => {
  const [name, ...args] = command.content.split(" ");

  const subLogger = Logger.getSubLogger({
    name: "SimpleCommandLogger",
    hideLogPositionForProduction: true,
  });

  subLogger.info(
    `Executing command '${name.substring(1)}' with args '${args}'`,
    {
      guildName: command.guild?.name,
      guildId: command.guildId ?? undefined,
      channelName: command.inGuild() ? command.channel.name : "DM",
      channelId: command.channelId,
      authorId: command.author.id,
      authorName: command.author.username,
    } satisfies LogContext,
  );
  try {
    await Meiyounaise.executeCommand(command);
  } catch (e) {
    await handleError(command, e);
  }
};

export const executeSlashCommand = async (
  interaction:
    | Interaction<CacheType>
    | MessageContextMenuCommandInteraction<CacheType>,
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

    subLogger.info(
      `Executing slash command: ${name}${
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

  try {
    await Meiyounaise.executeInteraction(interaction);
  } catch (e) {
    await handleError(interaction, e);
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
