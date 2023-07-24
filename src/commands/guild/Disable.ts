import GuildRepo from "../../db/GuildRepo.js";
import { ResponseType, responseEmbed } from "../../util/general.js";
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
@SlashGroup({ name: "guild", description: "Manage guild related things." })
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

  @Slash({
    name: "disable",
    description: "Disable a feature.",
  })
  @SlashGroup("guild")
  async disable(
    @SlashChoice(...EnumChoice(Feature))
    @SlashOption({
      name: "feature",
      description: "The feature to disable.",
      type: ApplicationCommandOptionType.String,
      required: true,
    }) feature: Feature,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    await this.repo.disableFeature(interaction.guildId || "", feature);

    await interaction.editReply({
      embeds: responseEmbed(
        ResponseType.Success,
        `Disabled feature \`${feature}\`.`,
      ),
    });
  }
}
