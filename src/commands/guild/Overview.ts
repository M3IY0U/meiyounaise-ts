import GuildRepo from "../../db/GuildRepo.js";
import { ResponseType, responseEmbed } from "../../util/general.js";
import { PermissionGuard } from "@discordx/utilities";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Discord, Guard, Slash, SlashGroup } from "discordx";
import { Inject } from "typedi";

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
export class Overview {
  @Inject("guildRepo")
  private repo!: GuildRepo;

  @Slash({
    name: "overview",
    description: "Show all current guild settings.",
  })
  @SlashGroup("guild")
  async overview(interaction: CommandInteraction) {
    await interaction.deferReply();

    const guild = await this.repo.guildById(interaction.guildId || "");
    if (!guild) throw new Error("Guild not found");

    const embed = new EmbedBuilder()
      .setTitle("Guild Settings")
      .setColor("Blue")
      .addFields([
        {
          name: "Join Channel",
          value: !guild.join_chn ? "Not set" : `<#${guild.join_chn}>`,
        },
        {
          name: "Join Message",
          value: guild.join_msg
            ? guild.join_msg.length > 1024
              ? `\`${guild.join_msg.slice(0, 1021)}...\``
              : `\`${guild.join_msg}\``
            : "Not set",
        },
        {
          name: "Leave Channel",
          value: !guild.leave_chn ? "Not set" : `<#${guild.leave_chn}>`,
        },
        {
          name: "Leave Message",
          value: guild.leave_msg
            ? guild.leave_msg.length > 1024
              ? `\`${guild.leave_msg.slice(0, 1021)}...\``
              : `\`${guild.leave_msg}\``
            : "Not set",
        },
        {
          name: "Repeat Messages",
          value:
            guild.repeat_msg === 0
              ? "Not set"
              : `Reposting after ${guild.repeat_msg} same messages`,
        },
      ]);

    await interaction.editReply({ embeds: [embed] });
  }
}
