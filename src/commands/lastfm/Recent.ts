import {
  UnknownAvatar,
  getUserColor,
  maskedUrl,
  respond,
} from "../../util/general.js";
import { LastCommand } from "./last-util/LastCommand.js";
import { UnknownAlbumArt } from "./last-util/LastUtil.js";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  EmbedBuilder,
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

@Discord()
@SlashGroup("fm")
export class Recent extends LastCommand {
  //#region Command Handlers
  @Slash({ name: "recent", description: "Get your recent tracks" })
  async slashRecent(
    @SlashOption({
      name: "user", 
      description: "User to get recent scrobbles for", 
      type: ApplicationCommandOptionType.User,
      required: false 
    }) user: User,
    @SlashOption({
      name: "amount", 
      description: "Amount of scrobbles to get", 
      type: ApplicationCommandOptionType.Number, 
      required: false
    }) amount: number | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    await this.recent(user ?? interaction.user, amount, interaction);
  }

  // simple handler
  @SimpleCommand({ name: "fm recent", description: "Get your recent tracks" })
  async simpleRecent(
    @SimpleCommandOption({ 
      name: "user",
      type: SimpleCommandOptionType.User, 
      description: "User to get recent scrobbles for"
    }) user: User | undefined,
    @SimpleCommandOption({
      name: "amount", 
      type: SimpleCommandOptionType.Number, 
      description: "Amount fo scrobbles to get"
    }) amount: number | undefined,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.recent(user ?? command.message.author, amount, command.message);
  }
  //#endregion

  async recent(
    user: User,
    amount: number | undefined,
    interaction: CommandInteraction | Message,
  ) {
    const last = await this.tryGetLast(user.id);
    const recent = await this.lastClient.getRecentScrobbles(
      last,
      Math.min(amount ?? 5, 10),
    );

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `Most recent scrobbles for ${last}`,
        url: `https://last.fm/user/${last}`,
        iconURL: user.displayAvatarURL() ?? UnknownAvatar,
      })
      .setColor(getUserColor(interaction))
      .setThumbnail(recent.tracks[0].image || UnknownAlbumArt);

    for (const track of recent.tracks) {
      embed.addFields({
        name: `<t:${track.date}:R>`,
        value: `${maskedUrl(
          track.artist.name,
          encodeURI(track.artist.url),
        )} - ${maskedUrl(track.name, encodeURI(track.url))}`,
      });
    }

    await respond(
      {
        embeds: [embed.toJSON()],
      },
      interaction,
    );
  }
}
