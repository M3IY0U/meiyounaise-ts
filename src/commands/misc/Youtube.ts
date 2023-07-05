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
  SlashOption,
} from "discordx";
import * as yts from "usetube";
import { Pagination, PaginationType } from "@discordx/pagination";

@Discord()
export class YouTube {
  // slash handler
  @Slash({ name: "yt", description: "Test Command" })
  async slashSearch(
    @SlashOption({
      name: "query",
      description: "Search Query",
      required: true,
      type: ApplicationCommandOptionType.String,
    })
    query: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    this.ytSearch(query, interaction);
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
    await this.ytSearch(query, command.message);
  }

  @ContextMenu({
    type: ApplicationCommandType.Message,
    name: "YouTube Search",
  })
  async ytContext(interaction: MessageContextMenuCommandInteraction) {
    await interaction.deferReply();
    await this.ytSearch(interaction.targetMessage.content, interaction);
  }

  // command logic
  async ytSearch(query: string, interaction: CommandInteraction | Message) {
    const res = await yts.searchVideo(query);
    if (res.videos.length === 0) {
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
}
