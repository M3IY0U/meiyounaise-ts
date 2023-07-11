import { LastClient } from "./LastClient";
import { Inject } from "typedi";
import LastRepo from "../../../db/LastRepo";

export abstract class LastCommand {
  @Inject("lastRepo")
  protected repo!: LastRepo;
  @Inject("lc")
  protected lastClient!: LastClient;
}
