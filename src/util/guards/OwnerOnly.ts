import { CommandError } from "../general.js";
import { CommandInteraction } from "discord.js";
import { ArgsOf, GuardFunction } from "discordx";

export const OwnerOnly: GuardFunction<ArgsOf<"interactionCreate">> = async (
  interaction,
  _,
  next,
) => {
  const int = interaction as unknown as CommandInteraction;
  const app = await int.client.application.fetch();
  if (int.user.id === app.owner?.id) {
    await next();
  } else {
    await int.deferReply();
    throw new CommandError("This command can only be ran by the bot owner");
  }
};
