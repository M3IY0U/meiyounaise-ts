import { ArgsOf, Discord, On } from "discordx";
import { Inject } from "typedi";
import { Client } from "discord.js";
import { BoardRepo } from "../db/BoardRepo.js";

@Discord()
class GuildHandlers {
  @Inject("db")
  protected repo!: BoardRepo;

  @On({ event: "messageReactionAdd" })
  async onReactionAdd([event]: ArgsOf<"messageReactionAdd">) {
    const thing = await event.fetch();
    console.log(thing);
  }

  @On({ event: "messageReactionRemove" })
  async onReactionRm([event]: ArgsOf<"messageReactionRemove">) {
    const thing = await event.fetch();
    console.log(thing);
  }
}
