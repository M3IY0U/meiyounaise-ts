import LastRepo from "../../../db/LastRepo.js";
import { CommandError } from "../../../util/general.js";
import { LastClient } from "./LastClient.js";
import { Inject } from "typedi";

export abstract class LastCommand {
  @Inject("lastRepo")
  protected repo!: LastRepo;
  @Inject("lc")
  protected lastClient!: LastClient;

  protected async tryGetLast(userId: string) {
    const user = await this.repo.userById(userId);
    if (!user?.lastfm) throw new CommandError("No last.fm username set");
    return user.lastfm;
  }
}
