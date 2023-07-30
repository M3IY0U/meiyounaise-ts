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
  paginateStrings,
  remainingArgs,
  respond,
  responseEmbed,
} from "../../util/general.js";
import { getOpenGraphImage } from "../../util/general.js";
import { getLastArtistImage } from "../lastfm/last-util/LastUtil.js";
import { SimilarArtistScraper } from "./scraper/SimilarArtistScraper.js";
import { Pagination, PaginationType } from "@discordx/pagination";

@Discord()
@SlashGroup("aoty")
export class SimilarArtist {
  //#region Command Handlers
  @Slash({
    name: "similarartist",
    description: "Get similar artists from AOTY",
  })
  async slashAotyArtistSimilar(
    @SlashOption({
      name: "artist",
      description: "The artist to get similar artists for",
      type: ApplicationCommandOptionType.String,
      required: true
    }) artist: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    await this.getAotyArtistSimilar(artist, interaction);
  }

  @SimpleCommand({
    name: "similar",
    description: "Get similar artists from AOTY",
    argSplitter: remainingArgs,
  })
  async simpleAotyArtistSimilar(
    @SimpleCommandOption({
      name: "similarartist",
      description: "The artist to get similar artists for",
      type: SimpleCommandOptionType.String
    }) artist: string,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.getAotyArtistSimilar(artist, command.message);
  }
  //#endregion

  async getAotyArtistSimilar(
    artist: string,
    interaction: CommandInteraction | Message,
  ) {
    const res = await SimilarArtistScraper.getSimilarArtists(artist);

    if (!res)
      return await respond(
        { embeds: responseEmbed(ResponseType.Error, "Artist not found") },
        interaction,
      );

    if (res.similarArtists.length === 0)
      return await respond(
        {
          embeds: responseEmbed(ResponseType.Error, "No similar artists found"),
        },
        interaction,
      );

    const artistImage =
      (await getOpenGraphImage(res.artist.url)) ??
      (await getLastArtistImage(res.artist.name));
    const pages = paginateStrings(
      res.similarArtists.map((a, i) => `${i + 1}. ${maskedUrl(a.name, a.url)}`),
      "\n",
      500,
    ).map((s) => {
      return {
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: `Artists similar to ${res.artist.name}`,
              url: res.artist.url,
            })
            .setThumbnail(artistImage)
            .setDescription(s),
        ],
      };
    });

    const pagination = new Pagination(interaction, pages, {
      type: PaginationType.Button,
      dispose: true,
    });

    await pagination.send();
  }
}
