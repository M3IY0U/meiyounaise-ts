import { Service } from "typedi";
import MeiyounaiseDB from "./MeiyounaiseDB.js";

@Service("lastRepo")
export default class LastRepo extends MeiyounaiseDB {
  async setLast(id: string, lastfm: string) {
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
}
