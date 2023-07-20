import {
  CommandInteraction,
  Message,
  MessageComponentInteraction,
  AutocompleteInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import { responseEmbed, ResponseType, InfoError } from "../util/general.js";

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

  if (interaction instanceof Message) {
    // do nothing
  } else if (interaction.replied || interaction.deferred)
    try {
      await interaction.deleteReply();
    } catch (e) {
      console.error(e);
    }

  if (e instanceof InfoError) {
    await interaction.channel?.send({
      embeds: responseEmbed(ResponseType.Info, e.message),
    });
    return;
  }

  await interaction.channel?.send({
    embeds: responseEmbed(
      ResponseType.Error,
      `\`\`\`${e instanceof Error ? e.message : e}\`\`\``,
    ),
  });
}
