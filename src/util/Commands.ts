import { handleError } from "../handlers/Errors.js";
import { Logger } from "./Logger.js";
import client from "prom-client";
import {
  CacheType,
  Interaction,
  Message,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { Client } from "discordx";

const simpleCounter = new client.Counter({
  name: "simple_commands_executed",
  help: "Number of simple commands executed",
});

const slashCounter = new client.Counter({
  name: "slash_commands_executed",
  help: "Number of slash commands executed",
});

const simpleFailedCounter = new client.Counter({
  name: "simple_commands_failed",
  help: "Number of simple commands failed",
});

const slashFailedCounter = new client.Counter({
  name: "slash_commands_failed",
  help: "Number of slash commands failed",
});

export const executeSimpleCommand = async (command: Message, bot: Client) => {
  const [name, ...args] = command.content.split(" ");

  const subLogger = Logger.getSubLogger({
    name: "SimpleCommandLogger",
    hideLogPositionForProduction: true,
  });

  subLogger.info(
    `Executing command '${name.substring(1)}' with args '${JSON.stringify(
      args,
    )}'`,
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
    await bot.executeCommand(command);
    simpleCounter.inc();
  } catch (e) {
    await handleError(command, e);
    simpleFailedCounter.inc();
  }
};

export const executeSlashCommand = async (
  interaction:
    | Interaction<CacheType>
    | MessageContextMenuCommandInteraction<CacheType>, bot: Client
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
    await bot.executeInteraction(interaction);
    slashCounter.inc();
  } catch (e) {
    await handleError(interaction, e);
    slashFailedCounter.inc();
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
