import { ContextMenu, Discord } from "discordx";
import { LastCommand } from "./last-util/LastCommand.js";
import {
  ApplicationCommandType,
  ContextMenuCommandInteraction,
} from "discord.js";
import {
  ResponseType,
  maskedUrl,
  respond,
  responseEmbed,
} from "../../util/general.js";

@Discord()
export class GetProfile extends LastCommand {
  @ContextMenu({
    type: ApplicationCommandType.User,
    name: "Get last.fm Profile",
  })
  async getProfile(interaction: ContextMenuCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const last = await this.tryGetLast(interaction.targetId);
      await respond(
        {
          embeds: responseEmbed(
            ResponseType.Info,
            `<@${interaction.targetId}>'s last.fm username is ${maskedUrl(
              last,
              `https://last.fm/user/${last}`,
            )}`,
          ),
        },
        interaction,
      );
    } catch (e) {
      await respond(
        {
          embeds: responseEmbed(
            ResponseType.Error,
            `<@${interaction.targetId}> doesn't have a last.fm username set`,
          ),
        },
        interaction,
      );
    }
  }
}
