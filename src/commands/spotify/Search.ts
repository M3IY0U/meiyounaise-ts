import {
  ApplicationCommandOptionType,
  CommandInteraction,
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
import * as spotify from "spotify-info";
import { GuildHandlers } from "../../handlers/GuildHandlers.js";
import { respond } from "../../util/general.js";
import { Pagination, PaginationType } from "@discordx/pagination";

@Discord()
export class SpotifySearch {
  @Slash({
    name: "spotify",
    description: "Get spotify info.",
  })
  async slashSpotify(
    @SlashOption({
    name: "query",
    description: "The query to search for.",
    required: false,type: ApplicationCommandOptionType.String
  }) query: string | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    await this.searchSpotify(query, interaction);
  }

  @SimpleCommand({
    name: "spotify",
    aliases: ["sp"],
    argSplitter: /^\b$/,
  })
  async simpleSpotify(
    @SimpleCommandOption({
      name: "spotify",
      type: SimpleCommandOptionType.String}) query: string | undefined,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.searchSpotify(query, command.message);
  }

  async searchSpotify(
    query: string | undefined,
    interaction: CommandInteraction | Message,
  ) {
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET)
      throw new Error("Spotify credentials not found.");

    spotify.setApiCredentials(
      process.env.SPOTIFY_CLIENT_ID,
      process.env.SPOTIFY_CLIENT_SECRET,
    );

    if (!query) {
      if (!GuildHandlers.fmLog[interaction.channelId]) {
        throw new Error(
          "No query provided and no previous now playing commands found.",
        );
      }

      const searchItems = await spotify.search(
        GuildHandlers.fmLog[interaction.channelId],
        { type: ["track"] },
      );

      if (!searchItems || searchItems.tracks.total === 0)
        throw new Error("No results found.");

      return await respond(
        {
          content: searchItems.tracks.items[0].url,
        },
        interaction,
      );
    }

    const search = await spotify.search(query, {});

    if (
      !search ||
      (search.tracks.total === 0 &&
        search.albums.total === 0 &&
        search.artists.total === 0)
    )
      throw new Error("No results found.");

    const msg = await interaction.channel?.send(
      `Found ${search.tracks.items.length} tracks, ${search.albums.items.length} albums, and ${search.artists.items.length} artists.\nPlease reaction with which one you want to view.`,
    );

    ["🎵", "💿", "👤"].forEach(async (emoji) => await msg?.react(emoji));

    const reaction = await msg?.awaitReactions({
      filter: (reaction, user) => {
        return (
          ["🎵", "💿", "👤"].includes(reaction.emoji.name ?? "🎵") &&
          user.id === interaction.member?.user.id
        );
      },
      max: 1,
      dispose: true,
    });

    await msg?.delete();
    let entries: (spotify.ApiArtist | spotify.SearchAlbum | spotify.ApiTrack)[];

    switch (reaction?.first()?.emoji.name) {
      case "🎵":
        entries = search.tracks.items;
        break;
      case "💿":
        entries = search.albums.items;
        break;
      case "👤":
        entries = search.artists.items;
        break;
      default:
        throw new Error("Invalid reaction.");
    }

    const pagination = new Pagination(
      interaction,
      entries.map((e) => {
        return { content: e.url };
      }),
      {
        type: PaginationType.Button,
      },
    );

    await pagination.send();
  }
}
