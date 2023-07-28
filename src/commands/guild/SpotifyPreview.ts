import GuildRepo from "../../db/GuildRepo.js";
import { ResponseType, responseEmbed } from "../../util/general.js";
import { PermissionGuard } from "@discordx/utilities";
import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
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
export class SpotifyPreview {
  @Inject("guildRepo")
  private repo!: GuildRepo;

  @Slash({
    name: "spotifypreview",
    description:
      "Set whether the bot should send a preview mp3 for spotify links.",
  })
  @SlashGroup("guild")
  async spotifyPreview(
    @SlashOption({
      name: "amount",
      description: "The amount of messages that need to be repeated to be sent again.",
    type: ApplicationCommandOptionType.Boolean})
    enabled: boolean,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const guild = await this.repo.guildById(interaction.guildId || "");
    if (!guild) throw new Error("Guild not found");

    await this.repo.setSpotifyPreview(interaction.guildId || "", enabled);
  }
}
