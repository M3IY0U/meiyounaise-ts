import { respond } from "../../../util/general.js";
import { LastCommand } from "../last-util/LastCommand.js";
import { parseTimeSpan } from "../last-util/LastUtil.js";
import { TimeSpan } from "../last-util/types/general.js";
import { AlbumChartService } from "./image-generation/AlbumChartService.js";
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
export class AlbumChart extends LastCommand {
  //#region Command Handlers
  @Slash({
    name: "albumchart",
    description: "Get your last.fm album chart",
  })
  async slashAlbumChart(
    @SlashChoice(...EnumChoice(TimeSpan))
    @SlashOption({
      name: "timespan",
      description: "The timespan to get the album chart for",
      type: ApplicationCommandOptionType.String,
      required: false,
    }) timespan: TimeSpan | undefined,
    @SlashOption({
      name: "user",
      description: "The user to get the album chart for",
      required: false,
      type: ApplicationCommandOptionType.User,
    }) user: User,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    await this.albumChart(
      user?.id ?? interaction.user.id,
      parseTimeSpan(timespan),
      interaction,
    );
  }

  @SimpleCommand({
    name: "fm albumchart",
    description: "Get your last.fm album chart",
  })
  async simpleAlbumChart(
    @SimpleCommandOption({
      name: "timespan",
      description: "The timespan to get the album chart for",
      type: SimpleCommandOptionType.String,
    }) timespan: string | undefined,
    @SimpleCommandOption({
      name: "user", 
      type: SimpleCommandOptionType.User
    }) user: User | undefined,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.albumChart(
      user?.id ?? command.message.author.id,
      parseTimeSpan(timespan),
      command.message,
    );
  }
  //#endregion

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
