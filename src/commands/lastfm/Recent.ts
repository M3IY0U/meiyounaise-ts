import {
  Discord,
  SimpleCommand,
  SimpleCommandMessage,
  SimpleCommandOption,
  SimpleCommandOptionType,
  Slash,
  SlashOption,
} from "discordx";
import { LastCommand } from "./last-util/LastCommand.js";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  EmbedBuilder,
  Message,
  User,
} from "discord.js";
import { getUserAvatar, maskedUrl, respond } from "../../util/general.js";
import { UnknownAlbumArt } from "./last-util/LastUtil.js";

@Discord()
class Recent extends LastCommand {
  // slash handler
  @Slash({ name: "recent", description: "Get your recent tracks." })
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
    await this.recent(user.id ?? interaction.user.id, amount, interaction);
  }

  // simple handler
  @SimpleCommand({ name: "recent", description: "Get your recent tracks." })
  async simpleRecent(
    @SimpleCommandOption(
      { 
        name: "user", 
        type: SimpleCommandOptionType.User, 
        description: "User to get recent scrobbles for"}) user:
      | User
      | undefined,
    @SimpleCommandOption(
      {
        name: "amount", 
        type: SimpleCommandOptionType.Number, 
        description: "Amount fo scrobbles to get"}) amount: number | undefined,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();

    await this.recent(
      user?.id ?? command.message.author.id,
      amount,
      command.message,
    );
  }
  // command logic
  async recent(
    userId: string,
    amount: number | undefined,
    interaction: CommandInteraction | Message,
  ) {
    const last = await this.tryGetLast(userId);

    const recent = await this.lastClient.getRecentScrobbles(
      last,
      Math.min(amount ?? 5, 10),
    );

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `Most recent scrobbles for ${last}`,
        url: `https://last.fm/user/${last}`,
        iconURL: getUserAvatar(interaction),
      })
      .setColor("Random")
      .setThumbnail(recent.tracks[0].image ?? UnknownAlbumArt);

    for (const track of recent.tracks) {
      embed.addFields({
        name: `<t:${track.date.getTime()}:R>`,
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
