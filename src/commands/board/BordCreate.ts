import BoardRepo from "../../db/BoardRepo.js";
import { GuildOnly } from "../../util/GuildOnly.js";
import {
  CommandError,
  ResponseType,
  respond,
  responseEmbed,
} from "../../util/general.js";
import { PermissionGuard } from "@discordx/utilities";
import {
  ApplicationCommandOptionType,
  Channel,
  ChannelType,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { Inject } from "typedi";

@Discord()
@SlashGroup({
  name: "board",
  description: "Manage emoji board related things",
})
@SlashGroup("board")
@Guard(
  PermissionGuard(["ManageChannels"], {
    embeds: responseEmbed(
      ResponseType.Permission,
      "You need the `ManageChannels` permission to execute this command",
    ),
  }),
)
export class BoardCreate {
  @Inject("boardRepo")
  protected repo!: BoardRepo;

  @Slash({
    name: "create",
    description: "Create a new emoji board",
  })
  @Guard(GuildOnly)
  async createSlash(
    @SlashOption({
      name: "channel", 
      description: "Channel to create the board in", 
      type: ApplicationCommandOptionType.Channel
    }) channel: Channel,
    @SlashOption({
      name: "threshold",
      description: "Amount of reactions needed to trigger the board",
      type: ApplicationCommandOptionType.Integer,
    }) threshold: number,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const chn = await channel.fetch();
    let err: [rip: boolean, msg: string] = [false, ""];

    if (interaction.channel?.isDMBased())
      err = [true, "Cannot create a board in a DM channel"];

    if (chn.type !== ChannelType.GuildText)
      err = [true, "Cannot create a board in a non-text channel"];

    if (threshold < 1) err = [true, "Threshold must be at least 1"];

    if (err[0]) throw new CommandError(err[1]);

    const created = await this.repo.upsertBoard(
      interaction.guildId || "",
      channel.id,
      threshold,
    );

    if (created) {
      await respond(
        {
          embeds: responseEmbed(
            ResponseType.Success,
            `The board was created in ${channel} with ${threshold} reactions`,
          ),
        },
        interaction,
      );
    } else {
      await respond(
        {
          embeds: responseEmbed(
            ResponseType.Success,
            `The board in this server was updated to: ${channel} with ${threshold} reactions`,
          ),
        },
        interaction,
      );
    }
  }
}
