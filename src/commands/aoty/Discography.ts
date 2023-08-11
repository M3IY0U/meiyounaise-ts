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
import { getLastArtistImage } from "../lastfm/last-util/LastUtil.js";
import { Scores } from "./scraper/AOTY.types.js";
import { ArtistDiscographyScraper } from "./scraper/ArtistDiscographyScraper.js";
import { Pagination, PaginationType } from "@discordx/pagination";

@Discord()
@SlashGroup("aoty")
export class Discography {
  //#region Command Handlers
  @Slash({
    name: "discography",
    description: "Get an artist's discography from AOTY",
  })
  async slashAotyDiscography(
    @SlashOption({
      name: "artist",
      description: "The artist to get info about",
      type: ApplicationCommandOptionType.String,
      required: true
    }) artist: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    await this.getAotyDiscography(artist, interaction);
  }

  @SimpleCommand({
    name: "aoty discography",
    description: "Get an artist's discography from AOTY",
    argSplitter: remainingArgs,
  })
  async simpleAotyDiscography(
    @SimpleCommandOption({
    name: "artist",
    description: "The artist to get info about",
    type: SimpleCommandOptionType.String
  }) artist: string,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.getAotyDiscography(artist, command.message);
  }
  //#endregion

  //#region Logic
  async getAotyDiscography(
    artist: string,
    interaction: CommandInteraction | Message,
  ) {
    const res = await ArtistDiscographyScraper.getDiscography(artist);

    if (!res)
      return await respond(
        { embeds: responseEmbed(ResponseType.Error, "Artist not found") },
        interaction,
      );

    const albumsByType = res.albums.reduce((acc, album) => {
      if (!acc[album.type]) acc[album.type] = [];
      acc[album.type].push(album);
      return acc;
    }, {} as Record<string, typeof res.albums>);

    const pages: string[] = [];

    for (const [type, entries] of Object.entries(albumsByType)
      .filter(([type]) => !type.includes("Single"))
      .sort(([a], _) => (a.includes("LP") ? -1 : 1))) {
      pages.push(`**${type}**`);
      for (const album of entries) {
        pages.push(
          `${type.includes("LP") ? "💿" : "💽"} ${maskedUrl(
            album.albumName,
            album.albumUrl,
          )} (${album.albumYear})\n${
            album.albumRating.map((r) => `　 ${r}`).join("\n") ||
            "　❔ No ratings"
          }${album === entries.at(-1) ? "\n" : ""}`,
        );
      }
    }

    const ePages = await Promise.all(
      paginateStrings(pages, "\n", 1000).map(async (s) => {
        return {
          embeds: [
            new EmbedBuilder()
              .setAuthor({
                name: `${res.artist.name} on AOTY`,
                url: res.artist.url,
              })
              .setThumbnail(await getLastArtistImage(res.artist.name))
              .setDescription(s)
              .setFooter({ text: this.scoresToText(res.artist.scores) }),
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

  private scoresToText = (scores: Scores) => {
    const texts = [];
    if (scores.critic.score !== "NR") {
      texts.push(
        `Critic Score: ${scores.critic.score} (${scores.critic.ratings} ratings)`,
      );
    }
    if (scores.user.score !== "NR") {
      texts.push(
        `User Score: ${scores.user.score} (${scores.user.ratings} ratings)`,
      );
    }
    return texts.join(" | ");
  };
  //#endregion
}
