import { CommandInteraction, Message } from "discord.js";
import { Discord, SimpleCommand, SimpleCommandMessage, Slash } from "discordx";

@Discord()
export class Ping {
  //#region Command Handlers
  @Slash({ name: "ping", description: "Ping the bot" })
  async slashPing(interaction: CommandInteraction) {
    await this.ping(interaction);
  }

  // simple handler
  @SimpleCommand({ name: "ping", description: "Ping the bot" })
  async simplePing(command: SimpleCommandMessage) {
    await this.ping(command.message);
  }

  //#endregion

  async ping(interaction: CommandInteraction | Message) {
    const ts = Date.now();
    const msg = await interaction.reply("Pinging...");
    const ping = Date.now() - ts;

    if (interaction instanceof CommandInteraction) {
      await interaction.editReply({ content: `Pong! \`${ping}ms\`` });
    } else {
      await msg.edit(`Pong! \`${ping}ms\``);
    }
  }
}
