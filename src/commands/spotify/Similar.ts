import {
  ResponseType,
  maskedUrl,
  paginateStrings,
  remainingArgs,
  respond,
  responseEmbed,
} from "../../util/general.js";
import { SpotifyClient } from "./SpotifyClient.js";
import { Pagination, PaginationType } from "@discordx/pagination";
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
import { Inject } from "typedi";

@Discord()
@SlashGroup("spotify")
export class SpotifySimilar {
  @Inject("sc")
  private sc!: SpotifyClient;

  //#region Command Handlers
  @Slash({
    name: "related",
    description: "Get related artists",
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
    aliases: ["sprel", "spsimilar", "spsim"],
    description: "Get related artists",
    argSplitter: remainingArgs,
  })
  async simpleRelatedArtists(
    @SimpleCommandOption({
    name: "artist",
    description: "Get related artists",
    type: SimpleCommandOptionType.String
  }) artist: string,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.relatedArtists(artist, command.message);
  }
  //#endregion

  async relatedArtists(
    artist: string,
    interaction: CommandInteraction | Message,
  ) {
    const res = await this.sc.getRelatedArtists(artist);

    if (res.related.length === 0)
      return await respond(
        {
          embeds: responseEmbed(
            ResponseType.Info,
            `Spotify didn't return any related artists for \`${artist}\``,
          ),
        },
        interaction,
      );

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
