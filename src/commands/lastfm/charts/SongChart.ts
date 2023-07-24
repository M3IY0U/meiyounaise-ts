import { respond } from "../../../util/general.js";
import { SongChartService } from "../charts/image-generation/SongChartService.js";
import { LastCommand } from "../last-util/LastCommand.js";
import { parseTimeSpan } from "../last-util/LastUtil.js";
import { TimeSpan } from "../last-util/types/general.js";
import { EnumChoice } from "@discordx/utilities";
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
  SimpleCommandOption,
  SimpleCommandOptionType,
  Slash,
  SlashChoice,
  SlashGroup,
  SlashOption,
} from "discordx";

@Discord()
@SlashGroup("fm")
class SongChart extends LastCommand {
  @Slash({
    name: "songchart",
    description: "Get your last.fm song chart.",
  })
  async slashSongChart(
    @SlashChoice(...EnumChoice(TimeSpan))
    @SlashOption({
    name: "timespan",
    description: "The timespan to get the song chart for.",
    type: ApplicationCommandOptionType.String,
    required: false,
  }) timespan: TimeSpan | undefined,
    @SlashOption({
    name: "user",
    description: "The user to get the song chart for.",
    required: false,
    type: ApplicationCommandOptionType.User,
  })user: User | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    await this.songChart(
      user?.id ?? interaction.user.id,
      parseTimeSpan(timespan),
      interaction,
    );
  }

  @SimpleCommand({
    name: "songchart",
    description: "Get your last.fm song chart.",
  })
  async simpleSongChart(
    @SimpleCommandOption({
    name: "timespan",
    description: "The timespan to get the song chart for.",
    type: SimpleCommandOptionType.String,
  }) timespan: TimeSpan | undefined,
    @SimpleCommandOption({
    name: "user",
    description: "The user to get the song chart for.",
    type: SimpleCommandOptionType.User,
  }) user: User | undefined,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();

    await this.songChart(
      user?.id ?? command.message.author.id,
      parseTimeSpan(timespan),
      command.message,
    );
  }

  async songChart(
    userId: string,
    timespan: TimeSpan,
    interaction: CommandInteraction | Message,
  ) {
    const user = await this.tryGetLast(userId);

    const res = await this.lastClient.getTopTracks(user, timespan);

    await respond(
      {
        files: [await SongChartService.renderChart(res.tracks.slice(0, 25))],
      },
      interaction,
    );
  }
}
