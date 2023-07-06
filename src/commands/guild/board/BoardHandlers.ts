import { ArgsOf, Discord, On } from "discordx";
import { Inject } from "typedi";
import { MeiyounaiseDB } from "../../../db/MeiyounaiseDB";
import { Client } from "discord.js";

@Discord()
class GuildHandlers {
  @Inject("db")
  protected db!: MeiyounaiseDB;

  /* @On({ event: "messageReactionAdd" })
  async onReactionAdd([event]: ArgsOf<"messageReactionAdd">) {
    const thing = await event.fetch();
    console.log(thing);
  }

  @On({ event: "messageReactionRemove" })
  async onReactionRm([event]: ArgsOf<"messageReactionRemove">) {
    const thing = await event.fetch();
    console.log(thing);
  } */
}
