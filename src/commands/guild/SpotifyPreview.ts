import GuildRepo from "../../db/GuildRepo.js";
import { ResponseType, respond, responseEmbed } from "../../util/general.js";
import { PermissionGuard } from "@discordx/utilities";
import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { Inject } from "typedi";
import { GuildOnly } from "../../util/GuildOnly.js";

@Discord()
@SlashGroup({ name: "guild", description: "Manage guild related things" })
@SlashGroup("guild")
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
      "Set whether the bot should send a preview mp3 for spotify links",
  })
  @Guard(GuildOnly)
  async spotifyPreview(
    @SlashOption({
      name: "enabled",
      description: "Whether to enable or disable the spotify preview",
      type: ApplicationCommandOptionType.Boolean
    })
    enabled: boolean,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const guild = await this.repo.guildById(interaction.guildId || "");
    if (!guild) throw new Error("Guild not found");

    await this.repo.setSpotifyPreview(interaction.guildId || "", enabled);

    await respond(
      {
        embeds: responseEmbed(
          ResponseType.Success,
          `Spotify preview is now ${enabled ? "enabled" : "disabled"}`,
        ),
      },
      interaction,
    );
  }
}
