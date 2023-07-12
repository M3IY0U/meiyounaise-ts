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
import { silently, stripText } from "../../util/general.js";

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

  buildQuery(msg: Message) {
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
