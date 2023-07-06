import {
  ButtonComponent,
  Discord,
  Guard,
  Slash,
  SlashGroup,
  SlashOption,
} from "discordx";
import { PermissionGuard } from "@discordx/utilities";
import { Inject } from "typedi";
import { BoardRepo } from "../../../db/BoardRepo.js";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Channel,
  ChannelType,
  CommandInteraction,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from "discord.js";
import { polyReply } from "../../util.js";

@Discord()
@SlashGroup({
  name: "board",
  description: "Manage emoji board related things.",
})
@Guard(PermissionGuard(["ManageChannels"]))
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
      embeds: [
        new EmbedBuilder()
          .setTitle("❓ Confirm Deletion")
          .setColor("Red")
          .setDescription(
            `Are you sure you want to delete the board in <#${board.channel_id}>?`,
          )
          .toJSON(),
      ],
      components: [btnRow],
    });
  }

  @ButtonComponent({ id: "board_delete" })
  async deleteButton(interaction: ButtonInteraction) {
    await this.repo.deleteBoard(interaction.guildId || "");

    interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle("🗑 Deleted")
          .setDescription("Board has been deleted successfully")
          .setColor("Green")
          .toJSON(),
      ],
      components: [],
    });
  }

  @ButtonComponent({ id: "board_cancel" })
  async cancelButton(interaction: ButtonInteraction) {
    interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔷 Cancelled")
          .setDescription("No changes made")
          .setColor("Blue")
          .toJSON(),
      ],
      components: [],
    });
  }
}
