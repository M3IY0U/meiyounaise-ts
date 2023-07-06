import {
  ApplicationCommandOptionType,
  CommandInteraction,
  EmbedBuilder,
  GuildMember,
  Message,
  User,
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
import { polyReply } from "../util.js";
import { LastCommand } from "./last-util/LastCommand.js";

@Discord()
@SlashGroup({ name: "fm", description: "LastFM Commands" })
@SlashGroup("fm")
export class SetUser extends LastCommand {
  // slash handler
  @Slash({ name: "set", description: "Set or show your last.fm username." })
  async slashSet(
    @SlashOption({ 
      name: "username", 
      description: "The last.fm username to set", 
      type: ApplicationCommandOptionType.String,
      required: false
    }) name: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    await this.set(interaction.member as GuildMember, name, interaction);
  }

  // simple handler
  @SimpleCommand({
    name: "set",
    description: "Set or show your current last.fm username.",
  })
  async simpleSet(
    @SimpleCommandOption({name: "username", type: SimpleCommandOptionType.String}) username: string,
    command: SimpleCommandMessage,
  ) {
    await this.set(command.message.author, username, command.message);
  }

  // command logic
  async set(
    user: GuildMember | User,
    username: string,
    interaction: CommandInteraction | Message,
  ) {
    if (!username) {
      const lastfm = (await this.repo.userById(user.id))?.lastfm;
      return await polyReply(
        {
          embeds: [
            new EmbedBuilder()
              .setTitle("🔷 last.fm Username")
              .setDescription(
                lastfm
                  ? `Your last.fm username is currently set to \`${lastfm}\`.`
                  : "No last.fm username set.",
              )
              .setColor("Blue")
              .toJSON(),
          ],
        },
        interaction,
      );
    }

    if (username.match(/[^A-z0-9_-]/))
      return await polyReply({ content: "Invalid username" }, interaction);
    await this.repo.setLast(user.id, username).then(async () => {
      await polyReply(
        {
          embeds: [
            new EmbedBuilder()
              .setTitle("✅ last.fm Username Set")
              .setDescription(
                `Your last.fm username has been set to \`${username}\`.`,
              )
              .setColor("Green")
              .toJSON(),
          ],
        },
        interaction,
      );
    });
  }
}
