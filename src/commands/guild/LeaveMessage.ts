import { PermissionGuard } from "@discordx/utilities";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  Channel,
  CommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import {
  Discord,
  SlashGroup,
  Guard,
  SlashOption,
  Slash,
  ModalComponent,
} from "discordx";
import { Inject } from "typedi";
import { GuildRepo } from "../../db/GuildRepo.js";
import { ResponseType, responseEmbed } from "../../util/general.js";

@Discord()
@SlashGroup({ name: "guild", description: "Manage guild related things." })
@Guard(
  PermissionGuard(["ManageGuild"], {
    embeds: responseEmbed(
      ResponseType.Permission,
      "You need the `ManageGuild` permission to execute this command",
    ),
  }),
)
export class LeaveMessage {
  @Inject("guildRepo")
  private repo!: GuildRepo;

  @Slash({
    name: "leavechannel",
    description: "Set the channel the bot posts leave messages in.",
  })
  @SlashGroup("guild")
  async leaveChannel(
    @SlashOption({
      name: "channel",
      description: "The channel to post leave messages in.",
      type: ApplicationCommandOptionType.Channel
    })
    channel: Channel,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const guild = await this.repo.guildById(interaction.guildId || "");
    if (!guild) throw new Error("Guild not found");

    if (!channel) {
      await interaction.editReply({
        embeds: responseEmbed(
          ResponseType.Info,
          `Currently posting leave messages in <#${guild?.leave_msg}>.`,
        ),
      });
    } else {
      await this.repo.setLeaveChannel(interaction.guildId || "", channel.id);
      await interaction.editReply({
        embeds: responseEmbed(
          ResponseType.Success,
          `Set the channel to post leave messages in to <#${channel.id}>.`,
        ),
      });
    }
  }

  @Slash({
    name: "leavemsg",
    description: "Set the message the bot posts when a user leaves.",
  })
  @SlashGroup("guild")
  async leaveMsg(interaction: CommandInteraction) {
    const guild = await this.repo.guildById(interaction.guildId || "");
    if (!guild) throw new Error("Guild not found");

    const modal = new ModalBuilder()
      .setTitle("Leave Message")
      .setCustomId("leavemsg");

    const messageInput = new TextInputBuilder()
      .setValue(guild.leave_msg || "")
      .setCustomId("leavemsg_text")
      .setLabel("Message")
      .setPlaceholder(
        "Enter leave message. [user] will be replaced by a mention of the user.",
      )
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput),
    );
    interaction.showModal(modal);
  }

  @ModalComponent({
    id: "leavemsg",
  })
  async leaveMsgModal(interaction: ModalSubmitInteraction) {
    const message = interaction.fields.getTextInputValue("leavemsg_text");

    const guild = await this.repo.guildById(interaction.guildId || "");

    if (!message) {
      await interaction.reply({
        embeds: responseEmbed(
          ResponseType.Info,
          `Current leave message: \`${guild?.leave_msg}\``,
        ),
      });
    } else {
      await this.repo.setLeaveMsg(interaction.guildId || "", message);
      await interaction.reply({
        embeds: responseEmbed(
          ResponseType.Success,
          `Set the leave message to \`${message}\``,
        ),
      });
    }
  }
}
