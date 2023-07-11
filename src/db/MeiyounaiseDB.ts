import { PrismaClient } from "@prisma/client";
import { Service } from "typedi";

@Service("db")
export default class MeiyounaiseDB {
  protected client = new PrismaClient();

  async userById(id: string) {
    return await this.client.users.findUnique({
      where: {
        id,
      },
    });
  }

  async disconnect() {
    await this.client.$disconnect();
  }
}
