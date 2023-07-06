import { Service } from "typedi";
import { MeiyounaiseDB } from "./MeiyounaiseDB.js";

@Service("boardrepo")
export class BoardRepo extends MeiyounaiseDB {
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
}
