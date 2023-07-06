import { ArgsOf, Discord, On } from "discordx";
import { Inject } from "typedi";
import { MeiyounaiseDB } from "../../db/MeiyounaiseDB";

@Discord()
class GuildHandlers {
  @Inject("db")
  protected db!: MeiyounaiseDB;

  @On({ event: "guildMemberAdd" })
  onMemberAdd([message]: ArgsOf<"guildMemberAdd">) {
    console.log("member joined");
  }

  @On({ event: "guildMemberRemove" })
  onMemberRemove() {
    console.log("member left");
  }


}
