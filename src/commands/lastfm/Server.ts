import { Discord, SimpleCommand, SimpleCommandMessage, Slash } from "discordx";
import { LastCommand } from "./last-util/LastCommand.js";
import {
  InfoError,
  getGuildIcon,
  maskedUrl,
  respond,
  silently,
} from "../../util/general.js";
import {
  APIEmbed,
  CommandInteraction,
  EmbedBuilder,
  Message,
} from "discord.js";

@Discord()
class Server extends LastCommand {
  // slash handler
  @Slash({
    name: "server",
    description: "Get what people are listening to in this server.",
  })
  async slashServer(interaction: CommandInteraction) {
    await interaction.deferReply();
    await this.server(interaction);
  }

  // simple handler
  @SimpleCommand({
    name: "server",
    description: "Get what people are listening to in this server.",
  })
  async simpleServer(command: SimpleCommandMessage) {
    await command.message.channel.sendTyping();

    await this.server(command.message);
  }

  // command logic
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
      throw new InfoError("Nobody is listening to anything right now.");

    const embeds: APIEmbed[] = [];

    let toAdd = "";

    for (let i = 0; i < texts.length; i++) {
      toAdd += texts[i];
      if (i + 1 !== texts.length) toAdd += "\n⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤⏤\n";

      if (toAdd.length <= 1800 && texts.length > i + 1) continue;
      embeds.push(
        new EmbedBuilder()
          .setAuthor({
            name: `Currently scrobbling in ${interaction.guild?.name}`,
            iconURL: getGuildIcon(interaction),
          })
          .setColor("Random")
          .setDescription(toAdd)
          .toJSON(),
      );
      toAdd = "";
    }

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
}
