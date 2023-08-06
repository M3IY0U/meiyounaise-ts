import BoardRepo from "../../db/BoardRepo.js";
import { GuildOnly } from "../../util/GuildOnly.js";
import {
  CommandError,
  ResponseType,
  respond,
  responseEmbed,
} from "../../util/general.js";
import { EnumChoice, PermissionGuard } from "@discordx/utilities";
import {
  ApplicationCommandOptionType,
  Channel,
  CommandInteraction,
} from "discord.js";
import {
  Discord,
  Guard,
  Slash,
  SlashChoice,
  SlashGroup,
  SlashOption,
} from "discordx";
import { Inject } from "typedi";

enum Actions {
  add = "0",
  remove = "1",
  list = "2",
  clear = "3",
}

@Discord()
@SlashGroup("board")
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
    description: "Manage banned channels for the board",
  })
  @Guard(GuildOnly)
  async manageSlash(
    @SlashChoice(...EnumChoice(Actions))
    @SlashOption({
      name: "action",
      description: "Action to perform",
      type: ApplicationCommandOptionType.String,
      required: true
    })
    action: Actions,
    @SlashOption({
      name: "channel",
      description: "Channel to add/remove from the banlist",
      type: ApplicationCommandOptionType.Channel,
      required: false,
    }) channel: Channel | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const board = await this.repo.getBoard(interaction.guildId || "");
    if (!board) throw new CommandError("There is no board in this server");

    const currentList: string[] = JSON.parse(board.banned_channels || "[]");

    let res: [ResponseType, string];
    switch (action) {
      case Actions.add:
        if (!channel)
          throw new CommandError("You must provide a channel to add");

        this.repo.addBannedChannel(interaction.guildId || "", channel.id);
        res = [
          ResponseType.Success,
          `Added <#${channel.id}> to the banlist for the board`,
        ];
        break;
      case Actions.remove:
        if (!channel)
          throw new CommandError("You must provide a channel to remove");

        this.repo.removeBannedChannel(interaction.guildId || "", channel.id);
        res = [
          ResponseType.Success,
          `Removed <#${channel.id}> from the banlist for the board`,
        ];
        break;
      case Actions.list:
        res = [
          ResponseType.Info,
          currentList.length
            ? `Currently banned channels:\n${currentList
                .map((id) => `<#${id}>`)
                .join(", ")}`
            : "There are no banned channels for this board",
        ];
        break;
      case Actions.clear:
        this.repo.clearBannedChannels(interaction.guildId || "");
        res = [
          ResponseType.Success,
          "Cleared the banlist for the board. All channels are now allowed",
        ];
        break;
    }

    await respond({ embeds: responseEmbed(res[0], res[1]) }, interaction);
  }
}
