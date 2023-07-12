import { LastClient } from "./LastClient";
import { Inject } from "typedi";
import LastRepo from "../../../db/LastRepo";

export abstract class LastCommand {
  @Inject("lastRepo")
  protected repo!: LastRepo;
  @Inject("lc")
  protected lastClient!: LastClient;

  protected async tryGetLast(userId: string) {
    const user = await this.repo.userById(userId);
    if (!user?.lastfm) throw new Error("No last.fm username set");
    return user.lastfm;
  }
}
