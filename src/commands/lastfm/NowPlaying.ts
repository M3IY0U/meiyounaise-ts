import { GuildHandlers } from "../../handlers/GuildHandlers.js";
import {
  getUserAvatar,
  getUserColor,
  maskedUrl,
  respond,
} from "../../util/general.js";
import { LastCommand } from "./last-util/LastCommand.js";
import { UnknownAlbumArt } from "./last-util/LastUtil.js";
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
    await this.nowPlaying(user?.id ?? interaction.user.id, interaction);
  }

  // simple handler
  @SimpleCommand({ name: "fm", aliases: ["np"] })
  async simpleNowPlaying(
    @SimpleCommandOption({
    name: "user",
    description: "Optional user to check",
    type: SimpleCommandOptionType.User
  }) user: User,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.nowPlaying(
      user?.id ?? command.message.author.id,
      command.message,
    );
  }
  //#endregion

  //#region Logic
  async nowPlaying(userId: string, interaction: CommandInteraction | Message) {
    const lastfm = await this.tryGetLast(userId);

    const res = await this.lastClient.getRecentScrobbles(lastfm, 1);

    if (!res.tracks.length || res.total === 0)
      throw new Error(`No tracks found for user '${res.user}'`);

    const embed = this.makeEmbed(
      lastfm,
      res.tracks[0],
      res.total,
      getUserAvatar(interaction),
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
    name: string,
    track: RecentTrack,
    total: number,
    avatar: string,
  ) {
    return new EmbedBuilder()
      .setAuthor({
        name: `${name} - ${track.nowplaying ? "Now Playing" : "Last Track"}`,
        iconURL: avatar,
        url: `https://www.last.fm/user/${name}`,
      })
      .setThumbnail(track.image || UnknownAlbumArt)
      .setDescription(
        `**${maskedUrl(track.name, encodeURI(track.url))}**\nScrobbled <t:${
          track.date
        }:R>`,
      )
      .addFields([
        {
          name: "Artist",
          value: maskedUrl(
            `**${track.artist.name}**`,
            encodeURI(track.artist.url),
          ),
          inline: true,
        },
        {
          name: "Album",
          value: track.album
            ? maskedUrl(
                `**${track.album}**`,
                encodeURI(`${track.artist.url}/${track.album}`),
              )
            : "Unknown",
          inline: true,
        },
      ])
      .setFooter({
        text: `${total} total Scrobbles on last.fm`,
      });
  }
  //#endregion
}
