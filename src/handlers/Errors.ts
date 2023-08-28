import { Logger } from "../util/Logger.js";
import {
  CommandError,
  ResponseType,
  responseEmbed,
  toHastebin,
} from "../util/general.js";
import {
  AutocompleteInteraction,
  CommandInteraction,
  Message,
  MessageComponentInteraction,
  ModalSubmitInteraction,
} from "discord.js";

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
    Logger.warn(e.message);
  } else if (e instanceof Error) {
    Logger.error(e.stack);
    Logger.error(e.message);
  } else {
    Logger.error(e);
  }

  if (interaction instanceof AutocompleteInteraction) return;

  if (interaction instanceof Message) {
    // do nothing
  } else if (interaction.replied || interaction.deferred)
    try {
      await interaction.editReply(
        "Something went wrong while executing this command",
      );
    } catch (e) {
      Logger.error(e);
    }

  let error = `\`\`\`${
    e instanceof Error ? e.message : JSON.stringify(e)
  }\`\`\``;

  if (error.length > 2000) {
    error = await toHastebin(error.replaceAll(/^`{3}|`{3}$/g, ""));
  }

  await interaction.channel?.send({
    embeds: responseEmbed(ResponseType.Error, error),
  });
}

export function handleEventError(event: string, args: any, e: unknown) {
  Logger.warn(
    `Error executing event ${event} with args ${JSON.stringify(args)}`,
  );
  if (e instanceof Error) {
    Logger.error(e.stack);
    Logger.error(e.message);
  }
}
