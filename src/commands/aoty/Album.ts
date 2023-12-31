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
  remainingArgs,
  respond,
  responseEmbed,
} from "../../util/general.js";
import { getLastArtistImage } from "../lastfm/last-util/LastUtil.js";
import { AlbumInfoScraper } from "./scraper/AlbumInfoScraper.js";

@Discord()
@SlashGroup("aoty")
export class Album {
  //#region Command Handlers
  @Slash({
    name: "album",
    description: "Get an album's info from AOTY",
  })
  async slashAotyInfo(
    @SlashOption({
      name: "album",
      description: "The album to get info about",
      type: ApplicationCommandOptionType.String,
      required: true
    }) album: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    await this.getAotyInfo(album, interaction);
  }

  @SimpleCommand({
    name: "aoty album",
    description: "Get an album's info from AOTY",
    argSplitter: remainingArgs,
  })
  async simpleAotyInfo(
    @SimpleCommandOption({
      name: "album",
      description: "The album to get info about",
      type: SimpleCommandOptionType.String
    }) album: string,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.getAotyInfo(album, command.message);
  }
  //#endregion

  async getAotyInfo(album: string, interaction: CommandInteraction | Message) {
    const res = await AlbumInfoScraper.getAlbumInfo(album);

    if (!res) {
      return respond(
        { embeds: responseEmbed(ResponseType.Error, "No results found") },
        interaction,
      );
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${res.name}`,
        url: res.url,
      })
      .setThumbnail(res.cover)
      .setFooter({
        text: `Album by ${res.artist}`,
        iconURL: await getLastArtistImage(res.artist),
      })
      .setDescription(`${
        res.mustHear ? "[__**★ Must Hear Album ★**__]\n" : ""
      }**User Score**\n${res.scores.user.score} (${res.scores.user.ratings} ratings)
        **Critic Score**\n${res.scores.critic.score} (${
        res.scores.critic.ratings
      } ratings)`);

    if (res.tags.length > 0) {
      embed.addFields([
        {
          name: "Tags",
          value: res.tags.join(", "),
          inline: true,
        },
      ]);
    }

    if (res.details) {
      embed.addFields(
        res.details.map((d) => ({
          name: d.title,
          value: d.content,
          inline: true,
        })),
      );
    }

    if (res.tracks) {
      embed.addFields([
        {
          name: "Tracks",
          value: res.tracks.map((t, i) => `${i + 1}. ${t}`).join("\n"),
          inline: false,
        },
      ]);
    }

    await respond({ embeds: [embed] }, interaction);
  }
}
