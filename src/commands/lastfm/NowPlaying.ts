import { GuildHandlers } from "../../handlers/GuildHandlers.js";
import {
  UnknownAvatar,
  getUserColor,
  maskedUrl,
  respond,
} from "../../util/general.js";
import { LastCommand } from "./last-util/LastCommand.js";
import { UnknownAlbumArt, cleanLastUrl } from "./last-util/LastUtil.js";
import { RecentTrack } from "./last-util/types/RecentResponse.js";
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
  SlashGroup,
  SlashOption,
} from "discordx";

@Discord()
@SlashGroup("fm")
export class NowPlaying extends LastCommand {
  //#region Command Handlers
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
    await this.nowPlaying(user ?? interaction.user, interaction);
  }

  // simple handler
  @SimpleCommand({
    name: "fm",
    aliases: ["np"],
    description: "Show what you're listening to",
  })
  async simpleNowPlaying(
    @SimpleCommandOption({
    name: "user",
    description: "Optional user to check",
    type: SimpleCommandOptionType.User
  }) user: User | undefined,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.nowPlaying(user ?? command.message.author, command.message);
  }
  //#endregion

  //#region Logic
  async nowPlaying(user: User, interaction: CommandInteraction | Message) {
    const lastfm = await this.tryGetLast(user.id);

    const res = await this.lastClient.getRecentScrobbles(lastfm, 1);

    if (!res.tracks.length || res.total === 0)
      throw new Error(`No tracks found for user '${res.user}'`);

    const embed = this.makeEmbed(
      lastfm,
      res.tracks[0],
      res.total,
      user.displayAvatarURL() ?? UnknownAvatar,
    );

    await respond(
      { embeds: [embed.setColor(getUserColor(interaction))] },
      interaction,
    );

    GuildHandlers.updateSongInChannel(
      interaction.channelId,
      `${res.tracks[0].artist.name} ${res.tracks[0].name}`,
    );
  }

  private makeEmbed(
    last: string,
    track: RecentTrack,
    total: number,
    avatar: string,
  ) {
    const artistField = {
      name: "Artist",
      value: maskedUrl(
        `**${track.artist.name}**`,
        cleanLastUrl(track.artist.url),
      ),
      inline: true,
    };

    const albumField = {
      name: "Album",
      value: track.album
        ? maskedUrl(
            `**${track.album}**`,
            cleanLastUrl(`${track.artist.url}/${track.album}`),
          )
        : "Unknown",
      inline: true,
    };

    if (albumField.value.length > 1024) albumField.value = `**${track.album}**`;
    if (artistField.value.length > 1024)
      artistField.value = `**${track.artist.name}**`;

    return new EmbedBuilder()
      .setAuthor({
        name: `${last} - ${track.nowplaying ? "Now Playing" : "Last Track"}`,
        iconURL: avatar,
        url: `https://www.last.fm/user/${last}`,
      })
      .setThumbnail(track.image || UnknownAlbumArt)
      .setDescription(
        `**${maskedUrl(track.name, cleanLastUrl(track.url))}**${
          track.nowplaying ? "" : `\nScrobbled <t:${track.date}:R>`
        }`,
      )
      .addFields([artistField, albumField])
      .setFooter({
        text: `${total} total Scrobbles on last.fm`,
      });
  }
  //#endregion
}
