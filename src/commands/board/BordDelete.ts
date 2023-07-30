import BoardRepo from "../../db/BoardRepo.js";
import { ResponseType, respond, responseEmbed } from "../../util/general.js";
import { PermissionGuard } from "@discordx/utilities";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  MessageActionRowComponentBuilder,
} from "discord.js";
import { ButtonComponent, Discord, Guard, Slash, SlashGroup } from "discordx";
import { Inject } from "typedi";

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
export class BoardDelete {
  @Inject("boardRepo")
  protected repo!: BoardRepo;

  @Slash({
    name: "delete",
    description: "Delete an existing emoji board",
  })
  async deleteSlash(interaction: CommandInteraction) {
    await interaction.deferReply();

    const board = await this.repo.getBoard(interaction.guildId || "");
    if (!board) throw new Error("There is no board in this server");

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

    await respond(
      {
        embeds: responseEmbed(
          ResponseType.Info,
          `Are you sure you want to delete the board in <#${board.channel_id}>?`,
        ),
        components: [btnRow],
      },
      interaction,
    );
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
