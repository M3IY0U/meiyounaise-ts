import {
  ApplicationCommandOptionType,
  CommandInteraction,
  EmbedBuilder,
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
  SlashOption,
} from "discordx";
import { maskedUrl, respond } from "../../util/general.js";
import { LastTrack } from "./last-util/types/RecentResponse.js";
import { UnknownAlbumArt, cleanLastUrl } from "./last-util/LastUtil.js";
import { LastCommand } from "./last-util/LastCommand.js";

@Discord()
class NowPlaying extends LastCommand {
  // slash handler
  @Slash({ name: "np", description: "Show what you're listening to" })
  async slashNowPlaying(
    @SlashOption({
      name: "user",
      description: "Optional user to check",
      type: ApplicationCommandOptionType.User,
      required: false,
    }) user: User,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    await this.nowPlaying(user?.id ?? interaction.user.id, interaction);
  }
  // simple handler
  @SimpleCommand({ name: "np", aliases: ["fm"] })
  async simpleNowPlaying(
    @SimpleCommandOption({
    name: "user",
    description: "Optional user to check",
    type: SimpleCommandOptionType.User
  }) user: User,
    command: SimpleCommandMessage,
  ) {
    await this.nowPlaying(
      user?.id ?? command.message.author.id,
      command.message,
    );
  }
  // command logic
  async nowPlaying(userId: string, interaction: CommandInteraction | Message) {
    const lastfm = await this.tryGetLast(userId);

    const res = await this.lastClient.getRecentScrobbles(lastfm, 1);

    if (!res.tracks.length || res.total === 0)
      throw new Error(`No tracks found for user '${res.user}'`);

    const embed = makeEmbed(
      lastfm,
      res.tracks[0],
      res.total,
      interaction instanceof CommandInteraction
        ? interaction.user.displayAvatarURL()
        : interaction.author.displayAvatarURL(),
    );

    await respond({ embeds: [embed] }, interaction);
  }
}

function makeEmbed(
  name: string,
  track: LastTrack,
  total: number,
  avatar: string,
) {
  return new EmbedBuilder()
    .setAuthor({
      name: `${name} - ${track.nowplaying ? "Now Playing" : "Last Track"}`,
      iconURL: avatar,
      url: `https://www.last.fm/user/${name}`,
    })
    .setColor("Random")
    .setThumbnail(
      track.image.find((i) => i.size === "large")?.url ?? UnknownAlbumArt,
    )
    .setDescription(
      `**${maskedUrl(
        track.name,
        track.url,
      )}**\nScrobbled <t:${track.date.getTime()}:R>`,
    )
    .addFields([
      {
        name: "Artist",
        value: maskedUrl(
          `**${track.artist.name}**`,
          cleanLastUrl(track.artist.url),
        ),
        inline: true,
      },
      {
        name: "Album",
        value: maskedUrl(
          `**${track.album.name}**`,
          cleanLastUrl(`${track.artist.url}/${track.album.name}`),
        ),
        inline: true,
      },
    ])
    .setFooter({
      text: `${total} total Scrobbles on last.fm`,
    })
    .toJSON();
}
