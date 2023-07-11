import {
  Discord,
  Guard,
  Slash,
  SlashChoice,
  SlashGroup,
  SlashOption,
} from "discordx";
import { EnumChoice, PermissionGuard } from "@discordx/utilities";
import { Inject } from "typedi";
import BoardRepo from "../../db/BoardRepo.js";
import {
  ApplicationCommandOptionType,
  Channel,
  CommandInteraction,
} from "discord.js";
import { ResponseType, responseEmbed } from "../../util/general.js";

enum Actions {
  add = "0",
  remove = "1",
  list = "2",
  clear = "3",
}

@Discord()
@SlashGroup({
  name: "board",
  description: "Manage emoji board related things.",
})
@Guard(
  PermissionGuard(["ManageChannels"], {
    embeds: responseEmbed(
      ResponseType.Permission,
      "You need the `ManageChannels` permission to execute this command",
    ),
  }),
)
export class BoardChannels {
  @Inject("boardRepo")
  protected repo!: BoardRepo;

  @Slash({
    name: "banlist",
    description: "Manage banned channels for the board.",
  })
  @SlashGroup("board")
  async manageSlash(
    @SlashChoice(...EnumChoice(Actions))
    @SlashOption({
      name: "action",
      description: "Action to perform.",
      type: ApplicationCommandOptionType.String,
      required: true
    })
    action: Actions,
    @SlashOption({
      name: "channel",
      description: "Channel to add/remove from the banlist.",
      type: ApplicationCommandOptionType.Channel,
    })
    channel: Channel,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const board = await this.repo.getBoard(interaction.guildId || "");
    if (!board) throw new Error("There is no board in this server.");

    const currentList: string[] = JSON.parse(board.banned_channels || "[]");

    switch (action) {
      case Actions.add:
        if (!channel) throw new Error("You must provide a channel to add.");

        this.repo.addBannedChannel(interaction.guildId || "", channel.id);
        interaction.editReply({
          embeds: responseEmbed(
            ResponseType.Success,
            `Added <#${channel.id}> to the banlist for the board.`,
          ),
        });
        break;
      case Actions.remove:
        if (!channel) throw new Error("You must provide a channel to remove.");

        this.repo.removeBannedChannel(interaction.guildId || "", channel.id);
        interaction.editReply({
          embeds: responseEmbed(
            ResponseType.Success,
            `Removed <#${channel.id}> from the banlist for the board.`,
          ),
        });
        break;
      case Actions.list:
        interaction.editReply({
          embeds: responseEmbed(
            ResponseType.Info,
            currentList.length
              ? `Currently banned channels:\n${currentList
                  .map((id) => `<#${id}>`)
                  .join(", ")}`
              : "There are no banned channels for this board.",
          ),
        });
        break;
      case Actions.clear:
        this.repo.clearBannedChannels(interaction.guildId || "");
        interaction.editReply({
          embeds: responseEmbed(
            ResponseType.Success,
            "Cleared the banlist for the board. All channels are now allowed.",
          ),
        });
        break;
    }
  }
}
