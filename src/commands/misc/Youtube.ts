import { GuildHandlers } from "../../handlers/GuildHandlers.js";
import { silently, stripText } from "../../util/general.js";
import { LastCommand } from "../lastfm/last-util/LastCommand.js";
import { Pagination, PaginationType } from "@discordx/pagination";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  CommandInteraction,
  Message,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import {
  ContextMenu,
  Discord,
  SimpleCommand,
  SimpleCommandMessage,
  SimpleCommandOption,
  SimpleCommandOptionType,
  Slash,
  SlashGroup,
  SlashOption,
} from "discordx";
import * as yts from "usetube";

@Discord()
class YouTube extends LastCommand {
  // slash handler
  @Slash({ name: "yt", description: "Test Command" })
  async slashSearch(
    @SlashOption({
      name: "query",
      description: "Search Query",
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    query: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    if (!query && !GuildHandlers.fmLog[interaction.channelId])
      throw new Error(
        "No query provided and no previous now playing commands found.",
      );

    this.ytSearch(
      query || GuildHandlers.fmLog[interaction.channelId],
      interaction,
    );
  }

  // simple handler
  @SimpleCommand({ name: "yt" })
  async simpleSearch(
    @SimpleCommandOption({
      name: "query",
      type: SimpleCommandOptionType.String,
    })
    query: string,
    command: SimpleCommandMessage,
  ) {
    if (!query && !GuildHandlers.fmLog[command.message.channelId])
      throw new Error(
        "No query provided and no previous now playing commands found.",
      );
    await this.ytSearch(
      query || GuildHandlers.fmLog[command.message.channelId],
      command.message,
    );
  }

  @Slash({
    name: "yt",
    description: "Get the YouTube video for the current song.",
  })
  @SlashGroup("fm")
  async slashNowPlayingYoutube(interaction: CommandInteraction) {
    await interaction.deferReply();

    await this.nowPlayingYoutube(interaction.user.id, interaction);
  }

  @SimpleCommand({
    name: "np yt",
    aliases: ["fm yt"],
    description: "Get the YouTube video for the current song.",
  })
  async simpleNowPlayingYoutube(command: SimpleCommandMessage) {
    await command.message.channel.sendTyping();

    await this.nowPlayingYoutube(command.message.author.id, command.message);
  }

  async nowPlayingYoutube(
    userId: string,
    interaction: CommandInteraction | Message,
  ) {
    const last = await this.tryGetLast(userId);

    const res = await this.lastClient.getRecentScrobbles(last, 1);
    if (!res.tracks.length || res.total === 0)
      throw new Error(`No tracks found for user '${res.user}'`);

    await this.ytSearch(
      `${res.tracks[0].artist.name} ${res.tracks[0].name}`,
      interaction,
    );
  }

  @ContextMenu({
    type: ApplicationCommandType.Message,
    name: "YouTube Search",
  })
  async ytContext(interaction: MessageContextMenuCommandInteraction) {
    await interaction.deferReply();

    // handle now playing embeds
    const query = this.buildQuery(interaction.targetMessage);

    await this.ytSearch(query, interaction);
  }

  // command logic
  async ytSearch(query: string, interaction: CommandInteraction | Message) {
    const res = await silently(yts.searchVideo(query));
    if (!res || res.videos.length === 0) {
      interaction.reply("No videos found!");
      return;
    }

    const pages = res.videos.map((v) => {
      return {
        pageText: v.original_title,
        content: `Query: \`${query}\`\nhttps://www.youtube.com/watch?v=${v.id}`,
      };
    });

    const pagination = new Pagination(interaction, pages, {
      type: PaginationType.SelectMenu,
      placeholder: "More Results",
      pageText: pages.map((p) => p.pageText),
      showStartEnd: false,
      dispose: true,
    });

    await pagination.send();
  }

  private buildQuery(msg: Message) {
    if (msg.author.id !== msg.client.user.id || msg.embeds.length !== 1)
      return msg.content;

    const [title, artist] = [
      msg.embeds[0].description?.split("\n")[0].match(/\[(.+)\]/),
      msg.embeds[0].fields[0].value.match(/\[(.+)\]/),
    ];

    if (!title || !artist) return msg.content;

    return `${stripText(artist[0])} - ${stripText(title[0])}`;
  }
}
