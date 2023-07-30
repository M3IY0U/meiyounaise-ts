import {
  InfoError,
  getUserAvatar,
  getUserColor,
  getUserName,
  maskedUrl,
  respond,
} from "../../util/general.js";
import { LastCommand } from "./last-util/LastCommand.js";
import { UnknownAlbumArt, getLastArtistImage } from "./last-util/LastUtil.js";
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
export class Streak extends LastCommand {
  //#region Command Handlers
  @Slash({
    name: "streak",
    description: "Get your current last.fm streak",
  })
  async slashStreak(
    @SlashOption({
      name: "user", 
      description: "Whose streaks to check", 
      type: ApplicationCommandOptionType.User,
      required: false
    }) user: User,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    await this.streak(user?.id ?? interaction.user.id, interaction);
  }

  // simple handler
  @SimpleCommand({
    name: "fm streak",
    description: "Get your current last.fm streak",
  })
  async simpleStreak(
    @SimpleCommandOption({
      name: "user", 
      description: "Whose streaks to check" ,
      type: SimpleCommandOptionType.User}) user: User | undefined,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.streak(user?.id ?? command.message.author.id, command.message);
  }
  //#endregion

  //#region Logic
  async streak(userId: string, interaction: CommandInteraction | Message) {
    const last = await this.tryGetLast(userId);
    const streaks = await this.getStreaks(last);

    if (!streaks) throw new InfoError(`No streak found for <@${userId}>`);

    await respond(
      {
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: `Current listening streak for ${getUserName(interaction)}`,
              url: encodeURI(`https://www.last.fm/user/${last}`),
              iconURL: getUserAvatar(interaction),
            })
            .setDescription(streaks.description)
            .setThumbnail(streaks.image)
            .setColor(getUserColor(interaction))
            .toJSON(),
        ],
      },
      interaction,
    );
  }

  private async getStreaks(last: string) {
    // rome-ignore lint/style/useSingleVarDeclarator: <explanation>
    let cTrack = true,
      cAlbum = true,
      cArtist = true,
      trackCount = 1,
      albumCount = 1,
      artistCount = 1;

    const { tracks } = await this.lastClient.getRecentScrobbles(last, 1000);

    const first = tracks[0];
    let current = first;

    for (const track of tracks.slice(1)) {
      if (track.name === current.name && cTrack) trackCount++;
      else cTrack = false;

      if (track.artist.name === current.artist.name && cArtist) artistCount++;
      else cArtist = false;

      if (track.album === current.album && cAlbum) albumCount++;
      else cAlbum = false;

      if (!cAlbum && !cArtist && !cTrack) break;

      current = track;
    }

    if (cTrack) trackCount = -1;
    if (cArtist) artistCount = -1;
    if (cAlbum) albumCount = -1;

    if (trackCount === 1 && albumCount === 1 && artistCount === 1) return null;

    const content = `${
      trackCount === -1 || albumCount === -1 || artistCount === -1
        ? `Stopped calculating the streak at <t:${current.date}:f>`
        : `Streak started <t:${current.date}:R>`
    }\n${
      trackCount !== 1
        ? `**Track**: ${maskedUrl(first.name, encodeURI(first.url))} - ${
            trackCount === -1 ? "1000+" : trackCount
          } Plays\n`
        : ""
    }${
      albumCount !== 1
        ? `**Album**: ${maskedUrl(
            first.album,
            encodeURI(`${first.artist.url}/${first.album}`),
          )} - ${albumCount === -1 ? "1000+" : albumCount} Plays\n`
        : ""
    }${
      artistCount !== 1
        ? `**Artist**: ${maskedUrl(
            first.artist.name,
            encodeURI(first.artist.url),
          )} - ${artistCount === -1 ? "1000+" : artistCount} Plays`
        : ""
    }`;

    const image =
      artistCount > albumCount && artistCount > trackCount
        ? await getLastArtistImage(first.artist.name)
        : first.image ?? UnknownAlbumArt;
    return {
      description: content,
      image: image,
    };
  }
  //#endregion
}
