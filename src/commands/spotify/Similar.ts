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
import { SpotifyClient } from "./SpotifyClient.js";
import { Inject } from "typedi";
import { Pagination, PaginationType } from "@discordx/pagination";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  EmbedBuilder,
  Message,
} from "discord.js";
import { maskedUrl, paginateStrings, respond } from "../../util/general.js";

@Discord()
@SlashGroup("spotify")
export class SpotifySimilar {
  @Inject("sc")
  private sc!: SpotifyClient;

  @Slash({
    name: "related",
    description: "Get related artists.",
  })
  async slashRelatedArtists(
    @SlashOption({
    name: "artist",
    description: "Artist to search for",
    type: ApplicationCommandOptionType.String
  }) artist: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    await this.relatedArtists(artist, interaction);
  }

  @SimpleCommand({
    name: "sprelated",
    description: "Get related artists",
    argSplitter: /^\b$/,
  })
  async simpleRelatedArtists(
    @SimpleCommandOption({
    name: "artist",
    description: "Get related artists.",
    type: SimpleCommandOptionType.String
  }) artist: string,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();

    await this.relatedArtists(artist, command.message);
  }

  async relatedArtists(
    artist: string,
    interaction: CommandInteraction | Message,
  ) {
    const res = await this.sc.getRelatedArtists(artist);

    const chunks = paginateStrings(
      res.related.map(
        (a, i) =>
          `${i + 1}. ${maskedUrl(a.name, a.url)}${
            a.genres.length > 0 ? ` | ${a.genres?.join(", ")}` : ""
          }`,
      ),
      "\n",
      1024,
    );

    const pages = chunks.map((artist) => {
      return {
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: `Artists similar to ${res.artist.name}`,
              url: res.artist.url,
              iconURL: res.artist.image,
            })
            .setDescription(artist),
        ],
      };
    });

    const pagination = new Pagination(interaction, pages, {
      type: PaginationType.Button,
    });

    await pagination.send();
  }
}
