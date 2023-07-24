import MeiyounaiseDB from "./MeiyounaiseDB.js";
import { Service } from "typedi";

@Service("lastRepo")
export default class LastRepo extends MeiyounaiseDB {
  async setLast(id: string, lastfm: string | null) {
    await this.client.users.upsert({
      where: {
        id,
      },
      update: {
        lastfm,
      },
      create: {
        id,
        lastfm,
      },
    });
  }

  async getLastUsersInGuild(userIds: string[]) {
    const result: Array<[id: string, last: string]> = [];

    for (const id of userIds) {
      const user = await this.client.users.findUnique({
        where: {
          id,
        },
      });

      if (user?.lastfm) result.push([id, user.lastfm]);
    }

    return result;
  }
}
