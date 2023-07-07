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
  async onMemberAdd([event]: ArgsOf<"guildMemberAdd">) {
    const guild = await this.repo.guildById(event.guild.id);
    if (!guild || !guild.join_chn || !guild.join_msg) return;

    const channel = await event.guild.channels.fetch(guild.join_chn);
    if (!channel || !channel.isTextBased()) return;

    await channel.send(
      guild.join_msg.replaceAll("[user]", `<@${event.user.id}>`),
    );
  }

  @On({ event: "guildMemberRemove" })
  async onMemberRemove([event]: ArgsOf<"guildMemberRemove">) {
    const guild = await this.repo.guildById(event.guild.id);
    if (!guild || !guild.leave_chn || !guild.leave_msg) return;

    const channel = await event.guild.channels.fetch(guild.leave_chn);
    if (!channel || !channel.isTextBased()) return;

    await channel.send(
      guild.leave_msg.replaceAll("[user]", `@${event.user.username}`),
    );
  }

  @On({ event: "messageCreate" })
  async repeatMessage([msg]: ArgsOf<"messageCreate">) {
    if (msg.author.bot) return;

    const guild = await this.repo.guildById(msg.guildId || "");
    if (!guild || guild.repeat_msg === 0) return;

    // init entry if it doesn't exist
    if (!this.messages[msg.channelId]) {
      this.messages[msg.channelId] = [msg, 1];
      return;
    }

    // increment/update if the content is the same and the author is different
    if (
      this.messages[msg.channelId][0].content === msg.content &&
      this.messages[msg.channelId][0].author !== msg.author
    ) {
      const count = this.messages[msg.channelId][1];
      this.messages[msg.channelId] = [msg, count + 1];
    } else {
      this.messages[msg.channelId] = [msg, 1];
    }

    // send the message if the count is reached
    if (this.messages[msg.channelId][1] >= guild.repeat_msg) {
      await msg.channel.send(msg.content);
      this.messages[msg.channelId] = [msg, 1];
    }
  }
}
