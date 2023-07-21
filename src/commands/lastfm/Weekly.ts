import { Discord, SimpleCommand, SimpleCommandMessage, Slash } from "discordx";
import { LastCommand } from "./last-util/LastCommand.js";
import { CommandInteraction, EmbedBuilder, Message } from "discord.js";
import {
  getUserAvatar,
  getUserColor,
  getUserName,
  respond,
} from "../../util/general.js";
import { RecentTrack } from "./last-util/types/RecentResponse.js";
import { TimeSpan } from "./last-util/types/general.js";

@Discord()
class Weekly extends LastCommand {
  @Slash({
    name: "weekly",
    description: "How much you listened to in the past week.",
  })
  async slashWeekly(interaction: CommandInteraction) {
    await interaction.deferReply();
    await this.weekly(interaction.user.id, interaction);
  }

  @SimpleCommand({ name: "weekly" })
  async simpleWeekly(command: SimpleCommandMessage) {
    await command.message.channel.sendTyping();
    await this.weekly(command.message.author.id, command.message);
  }

  async weekly(userId: string, interaction: CommandInteraction | Message) {
    const last = await this.tryGetLast(userId);

    const week = new Date();
    week.setDate(week.getDate() - 7);
    week.setHours(0, 0, 0, 0);

    const durations = await this.lastClient.getTrackDurations(
      last,
      TimeSpan.Month, // use month just to be sure
    );
    const recent = await this.lastClient.getScrobblesSince(
      last,
      week.getTime(),
    );

    const days = new Map<string, RecentTrack[]>();

    for (const track of recent.tracks) {
      const date = new Date(track.date * 1000);
      const day = date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      });

      if (!days.has(day)) days.set(day, []);
      days.get(day)?.push(track);
    }

    days.delete(days.keys().next().value);

    const dayDurations = new Map<string, number>();
    for (const [day, tracks] of days) {
      dayDurations.set(
        day,
        tracks.reduce(
          (acc, b) =>
            acc + (durations.get(`${b.artist.name}-${b.name}`) ?? 200),
          0,
        ),
      );
    }

    // calculate total time
    const total = [...dayDurations.values()].reduce((a, b) => a + b, 0);

    // calculate average scrobbles per day
    const average = Math.round(total / dayDurations.size);

    const embed = new EmbedBuilder()
      .setTitle(`${getUserName(interaction)}'s Weekly Report`)
      .setThumbnail(getUserAvatar(interaction))
      .setColor(getUserColor(interaction))
      // add each day to description and extra stats as fields
      .setDescription(
        [...dayDurations.entries()]
          .map(
            ([day, duration]) =>
              `**${day}** - ${Math.round(duration / 60)} minutes on ${
                days.get(day)?.length
              } tracks`,
          )
          .reverse()
          .join("\n"),
      )
      .addFields([
        {
          name: "Total Tracks",
          value: [...days.values()]
            .reduce((a, b) => a + b.length, 0)
            .toString(),
          inline: true,
        },
        {
          name: "Distinct Tracks",
          value: [
            ...new Set(recent.tracks.map((t) => t.name)),
          ].length.toString(),
          inline: true,
        },
        {
          name: "Daily Average",
          value: Math.round(average / 60).toString(),
          inline: true,
        },
      ]);

    await respond({ embeds: [embed] }, interaction);
  }
}
