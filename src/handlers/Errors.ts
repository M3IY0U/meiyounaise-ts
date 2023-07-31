import { CommandError, ResponseType, responseEmbed } from "../util/general.js";
import {
  AutocompleteInteraction,
  CommandInteraction,
  Message,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { Logger, ILogObj } from "tslog";

const logger = new Logger<ILogObj>();

export async function handleError(
  interaction:
    | CommandInteraction
    | Message
    | MessageComponentInteraction
    | AutocompleteInteraction
    | ModalSubmitInteraction,
  e: unknown,
) {
  if (e instanceof CommandError) {
    logger.warn(e.message);
  } else if (e instanceof Error) {
    logger.error(e.stack);
    logger.error(e.message);
  } else {
    logger.error(e);
  }

  if (interaction instanceof AutocompleteInteraction) return;

  if (interaction instanceof Message) {
    // do nothing
  } else if (interaction.replied || interaction.deferred)
    try {
      await interaction.deleteReply();
    } catch (e) {
      logger.error(e);
    }

  await interaction.channel?.send({
    embeds: responseEmbed(
      ResponseType.Error,
      `\`\`\`${e instanceof Error ? e.message : e}\`\`\``,
    ),
  });
}
