import { Feature } from "../commands/guild/Feature.js";
import MeiyounaiseDB from "./MeiyounaiseDB.js";
import { Service } from "typedi";

@Service("guildRepo")
export default class GuildRepo extends MeiyounaiseDB {
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
          embed_spotify: false,
          embed_anilist: false,
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

  async setLeaveChannel(guildId: string, id: string) {
    await this.client.guilds.update({
      where: {
        id: guildId,
      },
      data: {
        leave_chn: id,
      },
    });
  }

  async setLeaveMsg(guildId: string, msg: string) {
    await this.client.guilds.update({
      where: {
        id: guildId,
      },
      data: {
        leave_msg: msg,
      },
    });
  }

  async setSpotifyPreview(guildId: string, value: boolean) {
    await this.client.guilds.update({
      where: {
        id: guildId,
      },
      data: {
        embed_spotify: value,
      },
    });
  }

  async setAnilistEmbed(guildId: string, enabled: boolean) {
    await this.client.guilds.update({
      where: {
        id: guildId,
      },
      data: {
        embed_anilist: enabled,
      },
    });
  }

  async disableFeature(guildId: string, feature: Feature) {
    switch (feature) {
      case Feature.JoinMessage:
        await this.client.guilds.update({
          where: {
            id: guildId,
          },
          data: {
            join_chn: "",
            join_msg: "",
          },
        });

        break;
      case Feature.LeaveMessage:
        await this.client.guilds.update({
          where: {
            id: guildId,
          },
          data: {
            leave_chn: "",
            leave_msg: "",
          },
        });
        break;
      case Feature.RepeatMessages:
        await this.client.guilds.update({
          where: {
            id: guildId,
          },
          data: {
            repeat_msg: 0,
          },
        });
        break;
      case Feature.SpotifyPreview:
        await this.client.guilds.update({
          where: {
            id: guildId,
          },
          data: {
            embed_spotify: false,
          },
        });
        break;
      case Feature.AnilistEmbed:
        await this.client.guilds.update({
          where: {
            id: guildId,
          },
          data: {
            embed_anilist: false,
          },
        });
        break;
    }
  }
}
