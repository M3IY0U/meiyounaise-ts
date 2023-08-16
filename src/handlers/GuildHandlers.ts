import GuildRepo from "../db/GuildRepo.js";
import { Stats } from "../metrics/Stats.js";
import { searchAnilist } from "../util/AnilistQueries.js";
import { Logger } from "../util/Logger.js";
import { respond } from "../util/general.js";
import { EmbedBuilder, Message } from "discord.js";
import { ArgsOf } from "discordx";
import * as spotify from "spotify-info";
import { Container } from "typedi";
import { request } from "undici";

export class GuildHandlers {
  private static messages: {
    [id: string]: [msg: Message, count: number];
  } = {};

  static fmLog: {
    [channel: string]: string;
  } = {};

  static updateSongInChannel(channel: string, song: string) {
    Logger.info(`Updating song in channel ${channel} to '${song}'`);
    this.fmLog[channel] = song;
  }

  static async onMemberAdd([event]: ArgsOf<"guildMemberAdd">, stats: Stats) {
    const repo: GuildRepo = Container.get("guildRepo");
    const guild = await repo.guildById(event.guild.id);
    if (!guild || !guild.join_chn || !guild.join_msg) return;

    const channel = await event.guild.channels.fetch(guild.join_chn);
    if (!channel || !channel.isTextBased()) return;

    await channel.send(
      guild.join_msg.replaceAll("[user]", `<@${event.user.id}>`),
    );

    stats.eventStats.events.inc({ event_name: "guildMemberAdd" });
  }

  static async onMemberRemove(
    [event]: ArgsOf<"guildMemberRemove">,
    stats: Stats,
  ) {
    const repo: GuildRepo = Container.get("guildRepo");
    const guild = await repo.guildById(event.guild.id);
    if (!guild || !guild.leave_chn || !guild.leave_msg) return;

    const channel = await event.guild.channels.fetch(guild.leave_chn);
    if (!channel || !channel.isTextBased()) return;

    await channel.send(
      guild.leave_msg.replaceAll("[user]", `@${event.user.username}`),
    );

    stats.eventStats.events.inc({ event_name: "guildMemberRemove" });
  }

  static async repeatMessage([msg]: ArgsOf<"messageCreate">) {
    if (msg.author.bot) return;

    const repo: GuildRepo = Container.get("guildRepo");
    const guild = await repo.guildById(msg.guildId || "");
    if (!guild || guild.repeat_msg === 0) return;

    // init entry if it doesn't exist
    if (!this.messages[msg.channelId]) {
      this.messages[msg.channelId] = [msg, 1];
      return;
    }

    // increment/update if the content is the same and the author is different
    if (
      this.messages[msg.channelId][0].content === msg.content &&
      this.messages[msg.channelId][0].author !== msg.author
    ) {
      const count = this.messages[msg.channelId][1];
      this.messages[msg.channelId] = [msg, count + 1];
    } else {
      this.messages[msg.channelId] = [msg, 1];
    }

    // send the message if the count is reached
    if (this.messages[msg.channelId][1] >= guild.repeat_msg) {
      await msg.channel.send(msg.content);
      this.messages[msg.channelId] = [msg, 0];
    }
  }

  static async spotifyPreview([msg]: ArgsOf<"messageCreate">, stats: Stats) {
    const match = msg.content.match(
      /<?https?:\/\/open.spotify.com\/track\/[a-zA-Z0-9]+>?/,
    );

    if (!match) return;

    if (match[0].startsWith("<") && match[0].endsWith(">")) return;
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET)
      return;

    Logger.info(
      `Spotify preview triggered by ${msg.author.username} in ${msg.guild?.name} (${msg.guildId}) with '${match[0]}'`,
    );
    const repo: GuildRepo = Container.get("guildRepo");
    const guild = await repo.guildById(msg.guildId || "");
    if (!guild || !guild.embed_spotify) return;

    spotify.setApiCredentials(
      process.env.SPOTIFY_CLIENT_ID,
      process.env.SPOTIFY_CLIENT_SECRET,
    );

    const { previewUrl } = await spotify.getTrack(match[0]);
    if (!previewUrl) return;

    const res = await request(previewUrl).then((stream) =>
      stream.body.arrayBuffer(),
    );

    await respond(
      {
        files: [
          {
            name: "preview.mp3",
            attachment: Buffer.from(res),
          },
        ],
      },
      msg,
    );

    stats.eventStats.events.inc({ event_name: "spotifyPreview" });
  }

  static async anilistEmbed([msg]: ArgsOf<"messageCreate">, stats: Stats) {
    if (!msg.content || msg.author.bot) return;

    const mangaRegex = /{{(.*?)}}/g;
    const animeRegex = /\[\[(.*?)\]\](?!\()/g;

    const mangaMatch = msg.content.match(mangaRegex);
    const animeMatch = msg.content
      .match(animeRegex)
      ?.filter((x) => !x.includes("http"));

    if (
      (!mangaMatch || mangaMatch.length === 0) &&
      (!animeMatch || animeMatch.length === 0)
    )
      return;

    Logger.info(
      `AniList embed triggered by ${msg.author.username} in ${msg.guild?.name} (${msg.guildId}) with '${msg.content}'`,
    );

    const repo: GuildRepo = Container.get("guildRepo");
    const guild = await repo.guildById(msg.guildId || "");
    if (!guild || !guild.embed_anilist) return;

    const embeds = [];
    try {
      for (const match of animeMatch ?? []) {
        const embed = await this.createAnilistEmbed(
          match.replaceAll(/<|>/g, ""),
          false,
        );
        embeds.push(embed);
      }

      for (const match of mangaMatch ?? []) {
        const embed = await this.createAnilistEmbed(
          match.replaceAll(/{|}/g, ""),
          true,
        );
        embeds.push(embed);
      }
    } catch (e) {
      Logger.warn(`AniList embed failed: ${e}`);
      if (e instanceof Error && e.message.toLowerCase().includes("not found")) {
        return await msg.react("📭");
      }
    }
    if (!embeds.length) return await msg.react("❌");

    await respond({ embeds: embeds.slice(0, 5) }, msg);

    stats.eventStats.events.inc({ event_name: "anilistEmbed" });
  }

  private static async createAnilistEmbed(title: string, isManga: boolean) {
    const media = await searchAnilist(title, isManga);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: media.title.english || media.title.romaji,
        url: media.siteUrl,
      })
      .setImage(`https://img.anili.st/media/${media.id}`)
      .setColor(media.coverImage.color ?? "#2F3136")
      .setFooter({
        text: `${isManga ? "Manga" : "Anime"} | ${media.status} | ${
          media.startDate.year
        }`,
        iconURL: "https://anilist.co/img/logo_al.png",
      });

    let description = media.description
      ?.replace(/<br>/g, "\n")
      .replace(/<i>|<\/i>/g, "*");
    if (description?.length && description.length > 300)
      description = `${description.substr(
        0,
        description.lastIndexOf(" ", 300),
      )} [...]`;

    embed.setDescription(description);
    return embed;
  }
}
