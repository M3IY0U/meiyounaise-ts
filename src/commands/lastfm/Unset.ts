import { Discord, SimpleCommand, SimpleCommandMessage, Slash, SlashGroup } from "discordx";
import { LastCommand } from "./last-util/LastCommand.js";
import { CommandInteraction, Message } from "discord.js";
import { ResponseType, respond, responseEmbed } from "../../util/general.js";

@Discord()
@SlashGroup("fm")
class Unset extends LastCommand {
  // slash handler
  @Slash({ name: "unset", description: "Unset your last.fm username." })
  async slashUnset(interaction: CommandInteraction) {
    await interaction.deferReply();
    await this.unset(interaction.user.id, interaction);
  }
  // simple handler
  @SimpleCommand({
    name: "unset",
    description: "Unset your last.fm username.",
  })
  async simpleUnset(command: SimpleCommandMessage) {
    await command.message.channel.sendTyping();
    await this.unset(command.message.author.id, command.message);
  }

  // command logic
  async unset(userId: string, interaction: CommandInteraction | Message) {
    const user = await this.repo.userById(userId);
    if (!user || user.lastfm === null)
      throw new Error("You don't have a last.fm account set.");

    await this.repo.setLast(userId, null);
    await respond(
      {
        embeds: responseEmbed(ResponseType.Success, "Unset last.fm account."),
      },
      interaction,
    );
  }
}