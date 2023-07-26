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

import { ResponseType, respond, responseEmbed } from "../../util/general.js";
import { getLastArtistImage } from "../lastfm/last-util/LastUtil.js";
import { ArtistInfoScraper } from "./scraper/ArtistInfoScraper.js";
import { getOpenGraphImage } from "../../util/general.js";

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
    const res = await ArtistInfoScraper.getArtistInfo(artist);

    if (!res)
      return await respond(
        { embeds: responseEmbed(ResponseType.Error, "Artist not found") },
        interaction,
      );

    const embed = new EmbedBuilder()
      .setAuthor({
        name: res.artist.name,
        url: res.artist.url,
      })
      .setThumbnail(
        (await getOpenGraphImage(res.artist.url)) ??
          (await getLastArtistImage(res.artist.name)),
      )
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
      ]);

    if (res.tags.length > 0) {
      embed.addFields([
        {
          name: "Tags",
          value: res.tags.join(", "),
          inline: false,
        },
      ]);
    }

    if (res.details)
      embed.addFields(
        res.details.map((d) => ({
          name: d.title,
          value: d.content,
          inline: (embed.data.fields?.length ?? 3) > 2,
        })),
      );

    await respond(
      {
        embeds: [embed],
      },
      interaction,
    );
  }
}
