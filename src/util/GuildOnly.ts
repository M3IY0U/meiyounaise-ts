import { CommandError } from "./general.js";
import { CommandInteraction } from "discord.js";
import { ArgsOf, GuardFunction } from "discordx";

export const GuildOnly: GuardFunction<ArgsOf<"interactionCreate">> = async (
  interaction,
  _,
  next,
) => {
  const int = interaction as unknown as CommandInteraction;
  if (int.guild) {
    await next();
  } else {
    await int.deferReply();
    throw new CommandError("This command can only be used in a server");
  }
};
