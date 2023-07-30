import { GuildHandlers } from "../../handlers/GuildHandlers.js";
import { remainingArgs, stripText } from "../../util/general.js";
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
import Youtube from "youtube-sr";

@Discord()
export class YouTube extends LastCommand {
  //#region Command Handlers

  // slash handler - default
  @Slash({ name: "yt", description: "Search YouTube" })
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
    if (!query && !GuildHandlers.fmLog[interaction.channelId])
      throw new Error(
        "No query provided and no previous now playing commands found",
      );

    await interaction.deferReply();
    await this.ytSearch(
      query || GuildHandlers.fmLog[interaction.channelId],
      interaction,
    );
  }

  // slash handler - alias
  @Slash({ name: "youtube", description: "Search YouTube" })
  async slashAliasSearch(
    @SlashOption({
      name: "query",
      description: "Search Query",
      required: false,
      type: ApplicationCommandOptionType.String,
    })
    query: string,
    interaction: CommandInteraction,
  ) {
    if (!query && !GuildHandlers.fmLog[interaction.channelId])
      throw new Error(
        "No query provided and no previous now playing commands found",
      );

    await interaction.deferReply();
    await this.ytSearch(
      query || GuildHandlers.fmLog[interaction.channelId],
      interaction,
    );
  }

  // simple handler - default
  @SimpleCommand({
    name: "yt",
    description: "Search YouTube",
    aliases: ["youtube"],
    argSplitter: remainingArgs,
  })
  async simpleSearch(
    @SimpleCommandOption({
      name: "query",
      type: SimpleCommandOptionType.String,
      description: "Search Query",
    })
    query: string,
    command: SimpleCommandMessage,
  ) {
    if (!query && !GuildHandlers.fmLog[command.message.channelId])
      throw new Error(
        "No query provided and no previous now playing commands found",
      );

    await command.message.channel.sendTyping();
    await this.ytSearch(
      query || GuildHandlers.fmLog[command.message.channelId],
      command.message,
    );
  }

  // slash handler - current lastfm search
  @Slash({
    name: "yt",
    description: "Get the YouTube video for the current song",
  })
  @SlashGroup("fm")
  async slashNowPlayingYoutube(interaction: CommandInteraction) {
    await interaction.deferReply();
    await this.nowPlayingYoutube(interaction.user.id, interaction);
  }

  // simple handler - current lastfm search
  @SimpleCommand({
    name: "fm yt",
    aliases: ["np yt"],
    description: "Get the YouTube video for the current song",
  })
  async simpleNowPlayingYoutube(command: SimpleCommandMessage) {
    await command.message.channel.sendTyping();
    await this.nowPlayingYoutube(command.message.author.id, command.message);
  }

  // context menu handler
  @ContextMenu({
    type: ApplicationCommandType.Message,
    name: "YouTube Search",
  })
  async ytContext(interaction: MessageContextMenuCommandInteraction) {
    await interaction.deferReply();
    await this.ytSearch(
      this.buildQuery(interaction.targetMessage),
      interaction,
    );
  }
  //#endregion

  //#region Logic
  private async nowPlayingYoutube(
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

  private async ytSearch(
    query: string,
    interaction: CommandInteraction | Message,
  ) {
    const res = await Youtube.search(query);
    if (!res || res.length === 0) {
      throw new Error("No videos found!");
    }

    const pages = res
      .filter((i) => i.type === "video")
      .map((v) => {
        return {
          pageText: v.title ?? "No Title",
          content: `Query: \`${query}\`\n${v.url}`,
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
  //#endregion
}
