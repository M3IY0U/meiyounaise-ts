import {
  ApplicationCommandOptionType,
  CommandInteraction,
  EmbedBuilder,
  Message,
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
import { AotyScraper } from "./util/AotyScraper.js";
import { getArtistImage } from "../lastfm/last-util/LastUtil.js";
import { maskedUrl, paginateStrings } from "../../util/general.js";
import { Pagination, PaginationType } from "@discordx/pagination";

@Discord()
class AotyArtist {
  @Slash({
    name: "aotyartist",
    description: "Get Info about an artist on AOTY.",
  })
  async slashAotyArtist(
    @SlashOption({
    name: "artist",
    description: "The artist to get info about.",
    type: ApplicationCommandOptionType.String,
    required: true
  }) artist: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    await this.getAotyArtist(artist, interaction);
  }

  @SimpleCommand({
    name: "aotyartist",
    description: "Get Info about an artist on AOTY.",
    argSplitter: /^\b$/,
  })
  async simpleAotyArtist(
    @SimpleCommandOption({
    name: "artist",
    description: "The artist to get info about.",
    type: SimpleCommandOptionType.String
  }) artist: string,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.getAotyArtist(artist, command.message);
  }

  async getAotyArtist(
    artist: string,
    interaction: CommandInteraction | Message,
  ) {
    const res = await AotyScraper.getAotyArtist(artist);

    const albumsByType = res.albums.reduce((acc, album) => {
      if (!acc[album.type]) acc[album.type] = [];
      acc[album.type].push(album);
      return acc;
    }, {} as Record<string, typeof res.albums>);

    const pages = Object.entries(albumsByType)
      .filter(([type]) => !type.includes("Single"))
      .sort(([a], [_]) => (a.includes("LP") ? -1 : 1))
      .map(([type, albums]) => {
        return `**${type}**\n${albums
          .map(
            (album) =>
              `${type.includes("LP") ? "💿" : "💽"} ${maskedUrl(
                album.albumName,
                album.albumUrl,
              )} (${album.albumYear})
          ${
            album.albumRating.map((r) => `　 ${r}`).join("\n") ||
            "　❔ No ratings"
          }`,
          )
          .join("\n")}`;
      });

    const ePages = await Promise.all(
      paginateStrings(pages, "\n\n", 2048).map(async (s) => {
        return {
          embeds: [
            new EmbedBuilder()
              .setAuthor({
                name: `${res.artist.name} on AOTY`,
                url: res.artist.url,
              })
              .setThumbnail(await getArtistImage(res.artist.name))
              .setDescription(s)
              .setFooter({ text: res.artist.scores || "Artist has no scores" }),
          ],
        };
      }),
    );

    const pagination = new Pagination(interaction, ePages, {
      type: PaginationType.Button,
      dispose: true,
    });

    await pagination.send();
  }
}
