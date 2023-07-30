import {
  InfoError,
  getGuildIcon,
  getUserColor,
  maskedUrl,
  paginateStrings,
  respond,
  silently,
} from "../../util/general.js";
import { LastCommand } from "./last-util/LastCommand.js";
import { CommandInteraction, EmbedBuilder, Message } from "discord.js";
import {
  Discord,
  SimpleCommand,
  SimpleCommandMessage,
  Slash,
  SlashGroup,
} from "discordx";

@Discord()
@SlashGroup("fm")
export class Server extends LastCommand {
  //#region Command Handlers
  @Slash({
    name: "server",
    description: "Get what people are listening to in this server",
  })
  async slashServer(interaction: CommandInteraction) {
    await interaction.deferReply();
    await this.server(interaction);
  }

  // simple handler
  @SimpleCommand({
    name: "fm server",
    description: "Get what people are listening to in this server",
  })
  async simpleServer(command: SimpleCommandMessage) {
    await command.message.channel.sendTyping();
    await this.server(command.message);
  }
  //#endregion

  //#region Logic
  async server(interaction: CommandInteraction | Message) {
    const members = await interaction.guild?.members.fetch();
    const users = await this.repo.getLastUsersInGuild(
      members?.map((m) => m.id) || [],
    );

    const nowPlaying = await Promise.all(
      users.map(async ([id, last]) => await this.getNowPlaying(id, last)),
    );

    const texts: string[] = [];
    nowPlaying.forEach((np) => {
      if (!np) return;

      texts.push(
        `<@${np.id}> ${maskedUrl(
          "🔊",
          `https://last.fm/user/${np.last}`,
        )} ${maskedUrl(
          np.track.artist.name,
          encodeURI(np.track.artist.url),
        )} - ${maskedUrl(np.track.name, encodeURI(np.track.url))}`,
      );
    });

    if (texts.length === 0)
      throw new InfoError("Nobody is listening to anything right now");

    const embeds = paginateStrings(texts, "\n⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤\n", 1800).map(
      (p: string) => {
        return new EmbedBuilder()
          .setAuthor({
            name: `Currently scrobbling in ${interaction.guild?.name}`,
            iconURL: getGuildIcon(interaction),
          })
          .setColor(getUserColor(interaction))
          .setDescription(p)
          .toJSON();
      },
    );

    await respond({ embeds: embeds }, interaction);
  }

  private async getNowPlaying(id: string, last: string) {
    const res = await silently(this.lastClient.getRecentScrobbles(last, 1));

    if (!res || res.tracks.length === 0 || !res.tracks[0].nowplaying)
      return null;

    return {
      id: id,
      last: last,
      track: res.tracks[0],
    };
  }
  //#endregion
}
