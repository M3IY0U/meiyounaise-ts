import { ResponseType, respond, responseEmbed } from "../../util/general.js";
import { LastCommand } from "./last-util/LastCommand.js";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  Message,
} from "discord.js";
import {
  Discord,
  SimpleCommand,
  SimpleCommandMessage,
  SimpleCommandOption,
  SimpleCommandOptionType,
  Slash,
  SlashGroup,
  SlashOption,
} from "discordx";

@Discord()
@SlashGroup({ name: "fm", description: "LastFM Commands" })
@SlashGroup("fm")
export class SetUser extends LastCommand {
  //#region Command Handlers
  @Slash({ name: "set", description: "Set or show your last.fm username" })
  async slashSet(
    @SlashOption({ 
      name: "username", 
      description: "The last.fm username to set", 
      type: ApplicationCommandOptionType.String,
      required: false
    }) name: string | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    await this.set(interaction.user.id, name, interaction);
  }

  // simple handler
  @SimpleCommand({
    name: "fm set",
    description: "Set or show your current last.fm username",
  })
  async simpleSet(
    @SimpleCommandOption({
      name: "username", 
      description: "The last.fm username to set", 
      type: SimpleCommandOptionType.String
    }) username: string | undefined,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.set(command.message.author.id, username, command.message);
  }
  //#endregion

  async set(
    userId: string,
    username: string | undefined,
    interaction: CommandInteraction | Message,
  ) {
    if (!username) {
      const lastfm = (await this.repo.userById(userId))?.lastfm;
      return await respond(
        {
          embeds: responseEmbed(
            ResponseType.Info,
            lastfm
              ? `Your last.fm username is currently set to \`${lastfm}\``
              : "No last.fm username set",
          ),
        },
        interaction,
      );
    }

    if (username.match(/[^A-z0-9_-]/))
      return await respond(
        { embeds: responseEmbed(ResponseType.Error, "Invalid username") },
        interaction,
      );
    await this.repo.setLast(userId, username).then(async () => {
      await respond(
        {
          embeds: responseEmbed(
            ResponseType.Success,
            `Your last.fm username has been set to \`${username}\``,
          ),
        },
        interaction,
      );
    });
  }
}
