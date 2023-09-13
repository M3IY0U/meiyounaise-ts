import BoardRepo from "../db/BoardRepo.js";
import { Stats } from "../metrics/Stats.js";
import { UnknownAvatar, maskedUrl } from "../util/general.js";
import {
  ChannelType,
  EmbedBuilder,
  Message,
  MessageReaction,
  TextBasedChannel,
} from "discord.js";
import { ArgsOf } from "discordx";
import { Container } from "typedi";

export class BoardHandlers {
  static async onReactionAdd(
    [reaction, user]: ArgsOf<"messageReactionAdd">,
    stats: Stats,
  ) {
    if (user.bot || reaction.message.guildId === null) return;

    const repo: BoardRepo = Container.get("boardRepo");
    const board = await repo.getBoard(reaction.message.guildId || "");

    // don't handle if board is not set up
    if (
      !board ||
      JSON.parse(board.banned_channels || "[]").includes(
        reaction.message.channelId,
      )
    )
      return;

    // fetch necessary data
    const dbMsg = await repo.findOrCreateMessage(reaction.message.id);
    const sourceMsg = await reaction.message.fetch();
    const reactions = await Promise.all(
      sourceMsg.reactions.cache.map(async (r) => await r.fetch()),
    );
    const boardChannel = (await sourceMsg.guild?.channels.fetch(
      board.channel_id,
    )) as TextBasedChannel;

    if (dbMsg.hasBeenSent) {
      // edit message in board
      const msgInBoard = await boardChannel.messages.fetch(dbMsg.idInBoard);
      const embed = await this.boardEmbed(
        sourceMsg,
        this.formatReactions(reactions, board.threshold),
      );
      await msgInBoard.edit({
        embeds: embed,
      });

      stats.eventStats.events.inc({ event_name: "board_update" });
    } else {
      // post new message to board
      if (reactions.filter((r) => r.count >= board.threshold).length < 1)
        return;
      const embed = await this.boardEmbed(
        sourceMsg,
        this.formatReactions(reactions, board.threshold),
      );

      const msgInBoard = await boardChannel.send({
        embeds: embed,
      });

      await repo.updateMessage(sourceMsg.id, msgInBoard.id, true);
      stats.eventStats.events.inc({ event_name: "board_new" });
    }
  }

  static async onReactionRm(
    [reaction, user]: ArgsOf<"messageReactionRemove">,
    stats: Stats,
  ) {
    if (user.bot || reaction.message.guildId === null) return;

    const repo: BoardRepo = Container.get("boardRepo");
    const board = await repo.getBoard(reaction.message.guildId || "");

    // don't handle if board is not set up
    if (
      !board ||
      JSON.parse(board.banned_channels || "[]").includes(
        reaction.message.channelId,
      )
    )
      return;

    const dbMsg = await repo.findOrCreateMessage(reaction.message.id);

    if (dbMsg.hasBeenSent) {
      const sourceMsg = await reaction.message.fetch();
      const reactions = await Promise.all(
        sourceMsg.reactions.cache.map(async (r) => await r.fetch()),
      );
      const boardChannel = (await sourceMsg.guild?.channels.fetch(
        board.channel_id,
      )) as TextBasedChannel;
      const msgInBoard = await boardChannel.messages.fetch(dbMsg.idInBoard);

      if (reactions.filter((r) => r.count >= board.threshold).length > 0) {
        const embed = await this.boardEmbed(
          sourceMsg,
          this.formatReactions(reactions, board.threshold),
        );

        await msgInBoard.edit({
          embeds: embed,
        });
      } else {
        await repo.updateMessage(sourceMsg.id, "0", false);
        await msgInBoard.delete();
      }
    }
    stats.eventStats.events.inc({ event_name: "board_delete" });
  }

  private static async boardEmbed(msg: Message, reactions: string) {
    const member = await msg.member?.fetch();
    const content: string[] = [
      msg.content.length > 2048
        ? `${msg.content.slice(0, 2048)} [...]`
        : msg.content,
    ];

    let imgUrl: string | undefined;
    let spoiler = false;

    if (msg.embeds.length > 0) {
      const embed =
        msg.embeds.find((e) => e.thumbnail != null || e.image != null) ??
        msg.embeds.find((e) => e.image != null);

      if (msg.content.includes(`|| ${embed?.url} ||`)) spoiler = true;
      imgUrl = embed?.thumbnail?.url ?? embed?.image?.url;

      if (content[0] == null || content[0].trim() === "") {
        if (
          msg.embeds[0].description != null &&
          msg.embeds[0].description.trim() !== ""
        ) {
          content.push(msg.embeds[0].description);
        }
      }
    } else if (msg.attachments.size > 0) {
      const img = msg.attachments.find((a) =>
        a.contentType?.startsWith("image"),
      );

      if (img) {
        if (img.spoiler) spoiler = true;
        imgUrl = img.url;
      }

      content.push(
        ...msg.attachments.map((a) => `📎 ${maskedUrl(a.name, a.url)}`),
      );
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `Message from ${
          msg.member?.nickname ?? member?.displayName ?? msg.author.username
        }`,
        url: `https://discord.com/users/${msg.author.id}`,
      })
      .setThumbnail(member?.displayAvatarURL() ?? UnknownAvatar)
      .setColor(member?.displayColor ?? "Random")
      .addFields([
        {
          name: "Reactions",
          value: reactions,
          inline: true,
        },
        {
          name: "Posted in",
          value:
            msg.channel.type === ChannelType.PublicThread
              ? `<#${msg.channel.parent?.id}> 🧵 <#${msg.channel.id}>`
              : `<#${msg.channel.id}>`,
          inline: true,
        },
        {
          name: "Link",
          value: maskedUrl("Jump to message", msg.url),
          inline: true,
        },
      ])
      .setTimestamp(msg.createdAt);

    if (msg.reference?.messageId) {
      const refMsg = await (
        (await msg.guild?.channels.fetch(
          msg.reference.channelId,
        )) as TextBasedChannel
      ).messages.fetch(msg.reference.messageId);

      embed.addFields([
        {
          name: "Replying to",
          value: `${refMsg.author}`,
          inline: false,
        },
      ]);

      if (refMsg.content.trim() !== "") {
        let footer = `${refMsg.content.trim()}`;

        if (footer.length > 128) footer = `${footer.slice(0, 128)} [...]`;

        embed.setFooter({
          text: footer,
          iconURL: refMsg.author.displayAvatarURL() ?? undefined,
        });
      }
    }

    const description = content.join("\n").trim();
    if (description) embed.setDescription(description);

    if (imgUrl)
      embed.setImage(
        spoiler
          ? "https://cdn.discordapp.com/attachments/817365366997123115/1140075068664324197/spoilered.png"
          : imgUrl,
      );

    return [embed.toJSON()];
  }

  private static formatReactions(
    reactions: MessageReaction[],
    threshold: number,
  ): string {
    return Array.from(
      reactions
        .filter((reaction) => reaction.count >= threshold)
        .map((reaction) => ({ reaction, count: reaction.count }))
        .sort((a, b) => b.count - a.count)
        .reduce((grouped, item) => {
          if (!grouped.has(item.count)) {
            grouped.set(item.count, []);
          }
          grouped.get(item.count)?.push(`${item.reaction.emoji}`);
          return grouped;
        }, new Map<number, string[]>())
        .entries(),
    )
      .map(([count, emojis]) => `**${count}** × ${emojis.join(" ")}`)
      .join(" \n ");
  }
}
