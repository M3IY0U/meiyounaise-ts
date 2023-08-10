import GuildRepo from "../../db/GuildRepo.js";
import { GuildOnly } from "../../util/GuildOnly.js";
import { ResponseType, respond, responseEmbed } from "../../util/general.js";
import { PermissionGuard } from "@discordx/utilities";
import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { Inject } from "typedi";

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
export class AniListEmbed {
  @Inject("guildRepo")
  private repo!: GuildRepo;

  @Slash({
    name: "anilistembed",
    description:
      "Set whether the bot should automatically search anilist for titles surrounded by <> or {}",
  })
  @Guard(GuildOnly)
  async anilistEmbed(
    @SlashOption({
      name: "enabled",
      description: "Whether to enable or disable the anilist embed",
      type: ApplicationCommandOptionType.Boolean
    })
    enabled: boolean,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const guild = await this.repo.guildById(interaction.guildId || "");
    if (!guild) throw new Error("Guild not found");

    await this.repo.setAnilistEmbed(interaction.guildId || "", enabled);

    await respond(
      {
        embeds: responseEmbed(
          ResponseType.Success,
          `AniList embeds are now ${enabled ? "enabled" : "disabled"}${
            enabled
              ? "\nSurround a title with [] (anime) or {} (manga) to search AniList"
              : ""
          }`,
        ),
      },
      interaction,
    );
  }
}
