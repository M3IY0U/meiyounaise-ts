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
  SlashGroup,
  SlashOption,
} from "discordx";

import {
  ResponseType,
  maskedUrl,
  respond,
  responseEmbed,
} from "../../util/general.js";
import { SimilarAlbumScraper } from "./scraper/SimilarAlbumScraper.js";
import { Pagination, PaginationType } from "@discordx/pagination";

@Discord()
@SlashGroup("aoty")
class SimilarAlbum {
  @Slash({
    name: "similaralbum",
    description: "Get similar albums.",
  })
  async slashAotyAlbumSimilar(
    @SlashOption({
    name: "album",
    description: "yes",
    type: ApplicationCommandOptionType.String,
    required: true
  }) album: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    await this.getAotyAlbumSimilar(album, interaction);
  }

  @SimpleCommand({
    name: "similaralbum",
    description: "Get similar albums",
    argSplitter: /^\b$/,
  })
  async simpleAotyAlbumSimilar(
    @SimpleCommandOption({
    name: "similaralbum",
    description: "Get similar albums.",
    type: SimpleCommandOptionType.String
  }) album: string,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.getAotyAlbumSimilar(album, command.message);
  }

  async getAotyAlbumSimilar(
    album: string,
    interaction: CommandInteraction | Message,
  ) {
    const res = await SimilarAlbumScraper.getSimilarAlbums(album);

    if (!res)
      return await respond(
        { embeds: responseEmbed(ResponseType.Error, "No results found.") },
        interaction,
      );

    if (res.similar.length === 0)
      return await respond(
        { embeds: responseEmbed(ResponseType.Error, "No results found.") },
        interaction,
      );

    const similar = res.similar;
    const pages = [];
    const i = 0;
    while (similar.length > 0) {
      pages.push(
        similar
          .splice(i, i + 3)
          .map(
            (s) =>
              `- ${maskedUrl(s.album.name, s.album.url)} (${
                s.date
              })\n　by ${maskedUrl(s.artist.name, s.artist.url)}`,
          )
          .join("\n\n"),
      );
    }

    const pagination = new Pagination(
      interaction,
      pages.map((p) => {
        return {
          embeds: [
            new EmbedBuilder()
              .setAuthor({
                name: `Similar albums to ${res.album.name}`,
                url: res.album.url,
              })
              .setThumbnail(res.album.cover)
              .setDescription(p),
          ],
        };
      }),
      { type: PaginationType.Button },
    );

    await pagination.send();
  }
}