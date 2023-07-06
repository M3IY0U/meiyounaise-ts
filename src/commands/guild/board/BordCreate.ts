import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { PermissionGuard } from "@discordx/utilities";
import { Inject } from "typedi";
import { BoardRepo } from "../../../db/BoardRepo.js";
import {
  ApplicationCommandOptionType,
  Channel,
  ChannelType,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";

@Discord()
@SlashGroup({
  name: "board",
  description: "Manage emoji board related things.",
})
@Guard(
  PermissionGuard(["ManageChannels"], {
    embeds: [
      new EmbedBuilder()
        .setTitle("⚠️ Insufficient Permissions")
        .setDescription(
          "You need the `ManageChannels` permission to execute this command",
        )
        .setColor("Yellow")
        .toJSON(),
    ],
  }),
)
export class BoardCreate {
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
        embeds: [
          new EmbedBuilder()
            .setTitle("✅ Board Created")
            .setDescription(
              `The board was created in ${channel} with ${threshold} reactions`,
            )
            .setColor("Green")
            .toJSON(),
        ],
      });
    } else {
      interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("✅ Board updated")
            .setDescription(
              `The board in this server was updated to: ${channel} with ${threshold} reactions`,
            )
            .setColor("Green")
            .toJSON(),
        ],
      });
    }
  }
}
