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

import { ArtistInfo } from "./scraper/ArtistInfo.js";
import { getArtistImage } from "../lastfm/last-util/LastUtil.js";
import { respond } from "../../util/general.js";

@Discord()
@SlashGroup("aoty")
class Info {
  @Slash({
    name: "info",
    description: "Get an artist's info from AOTY.",
  })
  async slashAotyInfo(
    @SlashOption({
    name: "artist",
    description: "The artist to get info about.",
    type: ApplicationCommandOptionType.String,
    required: true
  }) artist: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    await this.getAotyInfo(artist, interaction);
  }

  @SimpleCommand({
    name: "info",
    description: "Get an artist's info from AOTY.",
    argSplitter: /^\b$/,
  })
  async simpleAotyInfo(
    @SimpleCommandOption({
    name: "artist",
    description: "The artist to get info about.",
    type: SimpleCommandOptionType.String
  }) artist: string,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.getAotyInfo(artist, command.message);
  }

  async getAotyInfo(artist: string, interaction: CommandInteraction | Message) {
    const res = await ArtistInfo.getArtistInfo(artist);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: res.artist.name,
        url: res.artist.url,
      })
      .setThumbnail(await getArtistImage(res.artist.name))
      .setFooter({
        text: `${res.artist.name} has ${res.followers} followers on AOTY`,
      })
      .addFields([
        {
          name: "Critic Score",
          value: `${res.artist.scores.critic.score} (${res.artist.scores.critic.ratings} ratings)`,
          inline: true,
        },
        {
          name: "User Score",
          value: `${res.artist.scores.user.score} (${res.artist.scores.user.ratings} ratings)`,
          inline: true,
        },
        {
          name: "Tags",
          value: res.tags?.join(", ") || "None provided",
          inline: false,
        },
      ]);

    if (res.details)
      embed.addFields([
        ...res.details.map((d) => ({
          name: d.title,
          value: d.content,
          inline: true,
        })),
      ]);

    await respond(
      {
        embeds: [embed],
      },
      interaction,
    );
  }
}
