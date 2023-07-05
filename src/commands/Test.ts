import { CommandInteraction, Message } from "discord.js";
import { Discord, SimpleCommand, SimpleCommandMessage, Slash } from "discordx";

@Discord()
export class Test {
  @Slash({ name: "test", description: "Test Command" })
  slashTest(interaction: CommandInteraction) {
    this.test(interaction);
  }

  @SimpleCommand({ name: "test" })
  simpleTest(command: SimpleCommandMessage) {
    this.test(command.message);
  }

  test(command: CommandInteraction | Message) {
    if (command instanceof CommandInteraction) {
      command.reply("Interaction!");
    } else {
      command.reply("Simple Command!");
    }
  }
}
