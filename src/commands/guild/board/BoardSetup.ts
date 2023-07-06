import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { PermissionGuard } from "@discordx/utilities";
import { Inject } from "typedi";
import { BoardRepo } from "../../../db/BoardRepo.js";
import {
  ApplicationCommandOptionType,
  Channel,
  ChannelType,
  CommandInteraction,
} from "discord.js";

@Discord()
@SlashGroup({
  name: "board",
  description: "Manage emoji board related things.",
})
@Guard(PermissionGuard(["ManageChannels"]))
export class BoardSetup {
  @Inject("boardrepo")
  protected repo!: BoardRepo;

  @Slash({
    name: "create",
    description: "Create a new emoji board.",
  })
  @SlashGroup("board")
  async createSlash(
    @SlashOption({
      name: "channel", 
      description: "Channel to create the board in.", 
      type: ApplicationCommandOptionType.Channel})
    channel: Channel,
    @SlashOption({
      name: "threshold",
      description: "Amount of reactions needed to trigger the board.",
      type: ApplicationCommandOptionType.Integer,
    }) threshold: number,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const chn = await channel.fetch();
    let err: [rip: boolean, msg: string] = [false, ""];

    if (interaction.channel?.isDMBased())
      err = [true, "Cannot create a board in a DM channel."];

    if (chn.type !== ChannelType.GuildText)
      err = [true, "Cannot create a board in a non-text channel."];

    if (threshold < 1) err = [true, "Threshold must be at least 1."];

    if (err[0]) throw new Error(err[1]);

    const created = await this.repo.upsertBoard(
      interaction.guildId || "",
      channel.id,
      threshold,
    );

    if (created) {
      interaction.editReply({
        content: `Created board in ${channel.toString()} with threshold ${threshold}`,
      });
    } else {
      interaction.editReply({
        content: `The board in this server was updated to: ${channel} with ${threshold} reactions`,
      });
    }
  }
}
