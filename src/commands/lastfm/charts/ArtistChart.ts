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
import { TimeSpan } from "./last-util/types/general.js";
import { EnumChoice } from "@discordx/utilities";
import { LastCommand } from "./last-util/LastCommand.js";
import { respond } from "../../util/general.js";
import { ArtistChartService } from "./charts/ArtistChartService.js";
import { parseTimeSpan } from "./last-util/LastUtil.js";

@Discord()
@SlashGroup("fm")
class ArtistChart extends LastCommand {
  @Slash({
    name: "artistchart",
    description: "Get your last.fm artist chart.",
  })
  async slashArtistChart(
    @SlashChoice(...EnumChoice(TimeSpan))
  @SlashOption({
    name: "timespan",
    description: "The timespan to get the artist chart for.",
    type: ApplicationCommandOptionType.String
  }) timespan: TimeSpan,
    @SlashOption({
    name: "user",
    description: "The user to get the artist chart for.",
    required: false,
    type: ApplicationCommandOptionType.User,
  }) user: User,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    await this.artistChart(
      user?.id ?? interaction.user.id,
      timespan,
      interaction,
    );
  }

  @SimpleCommand({
    name: "artistchart",
    description: "Get your last.fm artist chart.",
  })
  async simpleArtistChart(
    @SimpleCommandOption({
    name: "timespan",
    description: "The timespan to get the artist chart for.",
    type: SimpleCommandOptionType.String,
  }) timespan: string | undefined,
    @SimpleCommandOption({name: "user", type: SimpleCommandOptionType.User}) user:
      | User
      | undefined,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();

    await this.artistChart(
      user?.id ?? command.message.author.id,
      parseTimeSpan(timespan),
      command.message,
    );
  }

  async artistChart(
    userId: string,
    timespan: TimeSpan,
    interaction: CommandInteraction | Message,
  ) {
    const user = await this.tryGetLast(userId);

    const res = await this.lastClient.getTopArtists(user, timespan);

    await respond(
      {
        files: [await ArtistChartService.renderChart(res.artists)],
      },
      interaction,
    );
  }
}
