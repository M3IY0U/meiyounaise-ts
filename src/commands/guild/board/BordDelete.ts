import { ButtonComponent, Discord, Guard, Slash, SlashGroup } from "discordx";
import { PermissionGuard } from "@discordx/utilities";
import { Inject } from "typedi";
import { BoardRepo } from "../../../db/BoardRepo.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from "discord.js";
import { ResponseType, responseEmbed } from "../../util.js";

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
export class BoardDelete {
  @Inject("boardrepo")
  protected repo!: BoardRepo;

  @Slash({
    name: "delete",
    description: "Delete an existing emoji board.",
  })
  @SlashGroup("board")
  async deleteSlash(interaction: CommandInteraction) {
    await interaction.deferReply();

    const board = await this.repo.getBoard(interaction.guildId || "");
    if (!board) throw new Error("There is no board in this server.");

    const btnRow =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId("board_delete")
          .setLabel("Delete")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("board_cancel")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Secondary),
      ]);

    interaction.editReply({
      embeds: responseEmbed(
        ResponseType.Info,
        `Are you sure you want to delete the board in <#${board.channel_id}>?`,
      ),
      components: [btnRow],
    });
  }

  @ButtonComponent({ id: "board_delete" })
  async deleteButton(interaction: ButtonInteraction) {
    await this.repo.deleteBoard(interaction.guildId || "");

    interaction.update({
      embeds: responseEmbed(
        ResponseType.Success,
        "Board has been deleted successfully",
      ),
      components: [],
    });
  }

  @ButtonComponent({ id: "board_cancel" })
  async cancelButton(interaction: ButtonInteraction) {
    interaction.update({
      embeds: responseEmbed(ResponseType.Info, "Cancelled, no changes made"),
      components: [],
    });
  }
}
