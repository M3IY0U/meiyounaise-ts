import { CommandError } from "../general.js";
import { CommandInteraction, ModalSubmitInteraction } from "discord.js";
import { ArgsOf, GuardFunction, SimpleCommandMessage } from "discordx";

export const OwnerOnly: GuardFunction<
  ArgsOf<"interactionCreate"> | ArgsOf<"messageCreate">
> = async (interaction, _, next) => {
  const int = interaction as unknown as
    | CommandInteraction
    | SimpleCommandMessage
    | ModalSubmitInteraction;

  if (
    int instanceof CommandInteraction ||
    int instanceof ModalSubmitInteraction
  ) {
    const app = await int.client.application.fetch();
    if (int.user.id === app.owner?.id) {
      await next();
    } else {
      await int.deferReply();
      throw new CommandError("This command can only be ran by the bot owner");
    }
  } else if (int instanceof SimpleCommandMessage) {
    const app = await int.message.client.application.fetch();
    if (int.message.author.id === app.owner?.id) {
      await next();
    } else {
      throw new CommandError("This command can only be ran by the bot owner");
    }
  } else {
    throw new CommandError("Unknown interaction type");
  }
};
