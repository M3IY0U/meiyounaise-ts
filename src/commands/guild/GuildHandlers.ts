import { ArgsOf, Discord, On } from "discordx";
import { Inject } from "typedi";
import { Message } from "discord.js";
import { GuildRepo } from "../../db/GuildRepo.js";

@Discord()
class GuildHandlers {
  @Inject("guildRepo")
  protected repo!: GuildRepo;

  private messages: { [id: string]: [msg: Message, count: number] } = {};

  @On({ event: "guildMemberAdd" })
  onMemberAdd([message]: ArgsOf<"guildMemberAdd">) {
    console.log("member joined");
  }

  @On({ event: "guildMemberRemove" })
  onMemberRemove() {
    console.log("member left");
  }

  @On({ event: "messageCreate" })
  async repeatMessage([msg]: ArgsOf<"messageCreate">) {
    if (msg.author.bot) return;

    const guild = await this.repo.guildById(msg.guildId || "");
    if (!guild || guild.repeat_msg === 0) return;

    if (!this.messages[msg.channelId]) {
      this.messages[msg.channelId] = [msg, 1];
      return;
    }

    if (
      this.messages[msg.channelId][0].content === msg.content &&
      this.messages[msg.channelId][0].author.id !== msg.author.id
    ) {
      this.messages[msg.channelId][1]++;
    } else {
      this.messages[msg.channelId] = [msg, 1];
    }

    if (this.messages[msg.channelId][1] >= guild.repeat_msg) {
      msg.channel.send(msg.content);
      this.messages[msg.channelId] = [msg, 1];
    }
  }
}
