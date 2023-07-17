import {
  ApplicationCommandOptionType,
  CommandInteraction,
  Message,
  User,
} from "discord.js";
import {
  Discord,
  SimpleCommand,
  SimpleCommandMessage,
  Slash,
  SlashChoice,
  SlashOption,
} from "discordx";
import { TimeSpan } from "./last-util/types/general.js";
import { EnumChoice } from "@discordx/utilities";
import { LastCommand } from "./last-util/LastCommand.js";
import { respond } from "../../util/general.js";
import { AlbumChartService } from "./charts/AlbumChartService.js";

@Discord()
class AlbumChart extends LastCommand {
  @Slash({
    name: "albumchart",
    description: "Get your last.fm album chart.",
  })
  async slashAlbumChart(
    @SlashOption({
    name: "user",
    description: "The user to get the album chart for.",
    required: false,
    type: ApplicationCommandOptionType.String,
  }) user: User,
    @SlashChoice(...EnumChoice(TimeSpan))
  @SlashOption({
    name: "timespan",
    description: "The timespan to get the album chart for.",
    type: ApplicationCommandOptionType.String
  }) timespan: TimeSpan,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    await this.albumChart(user.id, timespan, interaction);
  }

  @SimpleCommand({
    name: "albumchart",
    description: "Get your last.fm album chart.",
  })
  async simpleAlbumChart(command: SimpleCommandMessage) {
    await command.message.channel.sendTyping();
    await this.albumChart(
      command.message.author.id,
      TimeSpan.Week,
      command.message,
    );
  }

  async albumChart(
    userId: string,
    timespan: TimeSpan,
    interaction: CommandInteraction | Message,
  ) {
    const user = await this.tryGetLast(userId);

    const res = await this.lastClient.getTopAlbums(user, timespan);

    await respond(
      {
        files: [await AlbumChartService.renderChart(res.albums)],
      },
      interaction,
    );
  }
}
