import { PrismaClient } from "@prisma/client";
import { Service } from "typedi";

@Service("db")
export class MeiyounaiseDB {
  private client = new PrismaClient();

  async userById(id: string) {
    return await this.client.users.findUnique({
      where: {
        id,
      },
    });
  }

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

  async disconnect() {
    await this.client.$disconnect();
  }
}
