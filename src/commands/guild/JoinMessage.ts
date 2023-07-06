import { PermissionGuard } from "@discordx/utilities";
import {
  ApplicationCommandOptionType,
  Channel,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { Discord, SlashGroup, Guard, SlashOption, Slash } from "discordx";
import { Inject } from "typedi";
import { GuildRepo } from "../../db/GuildRepo.js";
import { ResponseType, responseEmbed } from "../util.js";

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
export class GuildConfig {
  @Inject("guildRepo")
  private repo!: GuildRepo;

  @Slash({
    name: "joinchannel",
    description: "Set the channel the bot posts join messages in.",
  })
  @SlashGroup("guild")
  async joinChannel(
    @SlashOption({
      name: "channel",
      description: "The channel to post join messages in.",
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
          `Currently posting join messages in <#${guild?.join_msg}>.`,
        ),
      });
    } else {
      await this.repo.setJoinChannel(interaction.guildId || "", channel.id);
      await interaction.editReply({
        embeds: responseEmbed(
          ResponseType.Success,
          `Set the channel to post join messages in to <#${channel.id}>.`,
        ),
      });
    }
  }

  @Slash({
    name: "joinmsg",
    description: "Set the message the bot posts when a user joins.",
  })
  @SlashGroup("guild")
  async joinMsg(
    @SlashOption({
      name: "message",
      description: "The message to post when a user joins.",
      type: ApplicationCommandOptionType.String
    }) message: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const guild = await this.repo.guildById(interaction.guildId || "");
    if (!guild) throw new Error("Guild not found");

    if (!message) {
      await interaction.editReply({
        embeds: responseEmbed(
          ResponseType.Info,
          `Currently posting join message: \`${guild?.join_msg}\`.`,
        ),
      });
    } else {
      await this.repo.setJoinMsg(interaction.guildId || "", message);
      await interaction.editReply({
        embeds: responseEmbed(
          ResponseType.Success,
          `Set the message to post when a user joins to \`${message}\`.`,
        ),
      });
    }
  }
}
