import MeiyounaiseDB from "./MeiyounaiseDB.js";
import { Service } from "typedi";

@Service("boardRepo")
export default class BoardRepo extends MeiyounaiseDB {
  async upsertBoard(guildId: string, channelId: string, threshold: number) {
    const exist = await this.client.boards.findUnique({
      where: {
        guild_id: guildId,
      },
    });

    await this.client.boards.upsert({
      where: {
        guild_id: guildId,
      },
      update: {
        channel_id: channelId,
        threshold,
      },
      create: {
        guild_id: guildId,
        channel_id: channelId,
        threshold,
        banned_channels: JSON.stringify([]),
      },
    });
    return exist === null;
  }

  async getBoard(guildId: string) {
    return await this.client.boards.findUnique({
      where: {
        guild_id: guildId,
      },
    });
  }

  async deleteBoard(guildId: string) {
    await this.client.boards.delete({
      where: {
        guild_id: guildId,
      },
    });
  }

  async addBannedChannel(guildId: string, channelId: string) {
    const board = await this.getBoard(guildId);
    if (!board) throw new Error("There is no board in this server.");

    const banned = JSON.parse(board.banned_channels || "[]");
    if (banned.includes(channelId))
      throw new Error("Channel is already banned.");

    await this.client.boards.update({
      where: {
        guild_id: guildId,
      },
      data: {
        banned_channels: JSON.stringify([...banned, channelId]),
      },
    });
  }

  async removeBannedChannel(guildId: string, channelId: string) {
    const board = await this.getBoard(guildId);
    if (!board) throw new Error("There is no board in this server.");

    const banned = JSON.parse(board.banned_channels || "[]");
    if (!banned.includes(channelId)) throw new Error("Channel is not banned.");

    await this.client.boards.update({
      where: {
        guild_id: guildId,
      },
      data: {
        banned_channels: JSON.stringify(
          banned.filter((c: string) => c !== channelId),
        ),
      },
    });
  }

  async clearBannedChannels(guildId: string) {
    const board = await this.getBoard(guildId);
    if (!board) throw new Error("There is no board in this server.");

    await this.client.boards.update({
      where: {
        guild_id: guildId,
      },
      data: {
        banned_channels: JSON.stringify([]),
      },
    });
  }

  async getMessage(id: string) {
    return await this.client.messages.findUnique({
      where: {
        id,
      },
    });
  }

  async addMessage(id: string) {
    await this.client.messages.create({
      data: {
        id,
        idInBoard: "0",
        hasBeenSent: false,
      },
    });
  }

  async updateMessage(id: string, idInBoard: string, hasBeenSent: boolean) {
    await this.client.messages.update({
      where: {
        id,
      },
      data: {
        idInBoard,
        hasBeenSent,
      },
    });
  }
}
