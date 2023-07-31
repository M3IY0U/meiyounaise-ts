import GuildRepo from "../../db/GuildRepo.js";
import { ResponseType, respond, responseEmbed } from "../../util/general.js";
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
  Guard,
  ModalComponent,
  Slash,
  SlashGroup,
  SlashOption,
} from "discordx";
import { Inject } from "typedi";
import { GuildOnly } from "../../util/GuildOnly.js";

@Discord()
@SlashGroup("guild")
@Guard(
  PermissionGuard(["ManageGuild"], {
    embeds: responseEmbed(
      ResponseType.Permission,
      "You need the `ManageGuild` permission to execute this command",
    ),
  }),
)
export class JoinMessage {
  @Inject("guildRepo")
  private repo!: GuildRepo;

  @Slash({
    name: "joinchannel",
    description: "Set the channel the bot posts join messages in",
  })
  @Guard(GuildOnly)
  async joinChannel(
    @SlashOption({
      name: "channel",
      description: "The channel to post join messages in",
      type: ApplicationCommandOptionType.Channel,
      required: false,
    }) channel: Channel | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const guild = await this.repo.guildById(interaction.guildId || "");
    if (!guild) throw new Error("Guild not found");

    if (!channel) {
      await interaction.editReply({
        embeds: responseEmbed(
          ResponseType.Info,
          `Currently posting join messages in <#${guild?.join_msg}>`,
        ),
      });
    } else {
      await this.repo.setJoinChannel(interaction.guildId || "", channel.id);
      await respond(
        {
          embeds: responseEmbed(
            ResponseType.Success,
            `Set the channel to post join messages in to <#${channel.id}>`,
          ),
        },
        interaction,
      );
    }
  }

  @Slash({
    name: "joinmsg",
    description: "Set the message the bot posts when a user joins",
  })
  @Guard(GuildOnly)
  async joinMsg(interaction: CommandInteraction) {
    const guild = await this.repo.guildById(interaction.guildId || "");
    if (!guild) throw new Error("Guild not found");

    const modal = new ModalBuilder()
      .setTitle("Join Message")
      .setCustomId("joinmsg");

    const messageInput = new TextInputBuilder()
      .setValue(guild.join_msg || "")
      .setCustomId("joinmsg_text")
      .setLabel("Message")
      .setPlaceholder(
        "Enter join message. [user] will be replaced by a mention of the user",
      )
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput),
    );
    await interaction.showModal(modal);
  }

  @ModalComponent({
    id: "joinmsg",
  })
  async joinMsgModal(interaction: ModalSubmitInteraction) {
    const message = interaction.fields.getTextInputValue("joinmsg_text");

    const guild = await this.repo.guildById(interaction.guildId || "");

    if (!message) {
      await interaction.reply({
        embeds: responseEmbed(
          ResponseType.Info,
          `Current join message: \`${guild?.join_msg}\``,
        ),
      });
    } else {
      await this.repo.setJoinMsg(interaction.guildId || "", message);
      await interaction.reply({
        embeds: responseEmbed(
          ResponseType.Success,
          `Set the join message to \`${message}\``,
        ),
      });
    }
  }
}
