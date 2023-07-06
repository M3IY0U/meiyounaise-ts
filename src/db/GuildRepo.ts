import { Service } from "typedi";
import { MeiyounaiseDB } from "./MeiyounaiseDB.js";

@Service("guildRepo")
export class GuildRepo extends MeiyounaiseDB {
  async guildById(id: string) {
    let guild = await this.client.guilds.findUnique({
      where: {
        id,
      },
    });

    if (!guild) {
      guild = await this.client.guilds.create({
        data: {
          id,
          join_chn: "",
          leave_chn: "",
          repeat_msg: 0,
          join_msg: "",
          leave_msg: "",
        },
      });
    }
    return guild;
  }

  async setRepeatMsg(guildId: string, count: number) {
    await this.client.guilds.update({
      where: {
        id: guildId,
      },
      data: {
        repeat_msg: count,
      },
    });
  }

  async setJoinChannel(guildId: string, id: string) {
    await this.client.guilds.update({
      where: {
        id: guildId,
      },
      data: {
        join_chn: id,
      },
    });
  }

  async setJoinMsg(guildId: string, msg: string) {
    await this.client.guilds.update({
      where: {
        id: guildId,
      },
      data: {
        join_msg: msg,
      },
    });
  }
}
