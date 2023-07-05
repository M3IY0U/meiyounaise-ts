import { LastClient } from "./LastClient";
import { MeiyounaiseDB } from "../../../db/MeiyounaiseDB";
import { Inject } from "typedi";

export abstract class LastCommand {
  @Inject("db")
  protected db!: MeiyounaiseDB;
  @Inject("lc")
  protected lastClient!: LastClient;
}
