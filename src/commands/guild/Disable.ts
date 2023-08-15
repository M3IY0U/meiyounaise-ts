import GuildRepo from "../../db/GuildRepo.js";
import { ResponseType, respond, responseEmbed } from "../../util/general.js";
import { GuildOnly } from "../../util/guards/GuildOnly.js";
import { Feature } from "./Feature.js";
import { EnumChoice, PermissionGuard } from "@discordx/utilities";
import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import {
  Discord,
  Guard,
  Slash,
  SlashChoice,
  SlashGroup,
  SlashOption,
} from "discordx";
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
export class Disable {
  @Inject("guildRepo")
  private repo!: GuildRepo;

  @Slash({ name: "disable", description: "Disable a feature" })
  @Guard(GuildOnly)
  async disable(
    @SlashChoice(...EnumChoice(Feature))
    @SlashOption({
      name: "feature",
      description: "The feature to disable",
      type: ApplicationCommandOptionType.String,
      required: true,
    }) feature: Feature,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    await this.repo.disableFeature(interaction.guildId || "", feature);

    await respond(
      {
        embeds: responseEmbed(
          ResponseType.Success,
          `Disabled feature \`${feature}\``,
        ),
      },
      interaction,
    );
  }
}
