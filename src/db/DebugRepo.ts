import { Service } from "typedi";
import MeiyounaiseDB from "./MeiyounaiseDB.js";

@Service("debugRepo")
export default class DebugRepo extends MeiyounaiseDB {
  async query(q: string) {
    return await this.client.$queryRawUnsafe(q);
  }

  async execute(q: string) {
    const affected = await this.client.$executeRawUnsafe(q);
    return affected;
  }
}
