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
import { LastCommand } from "./last-util/LastCommand.js";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  EmbedBuilder,
  Message,
  User,
} from "discord.js";
import {
  getUserAvatar,
  getUserColor,
  getUserName,
  respond,
} from "../../util/general.js";
import { TimeSpan } from "./last-util/types/general.js";

@Discord()
@SlashGroup("fm")
class Daily extends LastCommand {
  @Slash({
    name: "daily",
    description: "How much you listened to in the past 24 hours.",
  })
  async slashDaily(
    @SlashOption({
    name: "user", 
    description: "Which user to check", 
    type: ApplicationCommandOptionType.User,
    required: false}) user: User,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    await this.daily(user?.id ?? interaction.user.id, interaction);
  }

  @SimpleCommand({
    name: "daily",
    description: "How much you listened to in the past 24 hours.",
  })
  async simpleDaily(
    @SimpleCommandOption({name: "user", type: SimpleCommandOptionType.User}) user:
      | User
      | undefined,
    command: SimpleCommandMessage,
  ) {
    await command.message.channel.sendTyping();
    await this.daily(user?.id ?? command.message.author.id, command.message);
  }

  async daily(userId: string, interaction: CommandInteraction | Message) {
    const last = await this.tryGetLast(userId);

    const durations = await this.lastClient.getTrackDurations(last, TimeSpan.Week, true);

    // if you listen to more than 1000 tracks per day https://cdn.discordapp.com/attachments/493557274371948545/1131862099627356210/F1b_l7PXwAAdhsR.jpg
    const recents = await this.lastClient.getRecentScrobbles(last, 1000);

    const dailyTracks = recents.tracks
      .filter((t) => !t.nowplaying)
      .filter((t) => t.date * 1000 >= Date.now() - 864e5);

    const minutes =
      dailyTracks.reduce(
        (a, b) => a + (durations.get(`${b.artist.name}-${b.name}`) ?? 200),
        0,
      ) / 60;

    if (minutes === 0) throw new Error("No tracks found in the last 24 hours");

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${getUserName(interaction)}'s last 24 hours`,
        iconURL: getUserAvatar(interaction),
        url: `https://last.fm/user/${last}`,
      })
      .addFields([
        {
          name: "Tracks",
          value: dailyTracks.length.toString(),
          inline: true,
        },
        {
          name: "Minutes",
          value: Math.round(minutes).toString(),
          inline: true,
        },
        {
          name: "Hours",
          value: `${Math.floor(minutes / 60)}:${Math.floor(minutes % 60)}`,
          inline: true,
        },
      ])
      .setColor(getUserColor(interaction))
      .toJSON();

    await respond(
      {
        embeds: [embed],
      },
      interaction,
    );
  }
}
