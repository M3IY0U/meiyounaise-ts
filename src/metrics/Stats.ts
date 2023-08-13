import { type GuildManager } from "discord.js";
import { Client } from "discordx";
import client from "prom-client";

export class Stats {
  startTime: number;
  botStats: BotStats;
  commandStats: CommandStats;

  constructor() {
    this.startTime = Date.now();
    this.botStats = {
      guilds: new client.Gauge({
        name: "discord_guilds_total",
        help: "Number of guilds the bot is in",
      }),
      users: new client.Gauge({
        name: "discord_users_total",
        help: "Number of users the bot can see",
      }),
      channels: new client.Gauge({
        name: "discord_channels_total",
        help: "Number of channels the bot can see",
      }),
    };
    this.commandStats = {
      simpleCommands: new client.Counter({
        name: "discord_simple_commands_total",
        help: "Number of simple commands executed",
        labelNames: ["command"],
      }),
      simpleCommandErrors: new client.Counter({
        name: "discord_simple_command_errors_total",
        help: "Number of simple command errors",
        labelNames: ["command"],
      }),
      slashCommands: new client.Counter({
        name: "discord_slash_commands_total",
        help: "Number of slash commands executed",
        labelNames: ["command"],
      }),
      slashCommandErrors: new client.Counter({
        name: "discord_slash_command_errors_total",
        help: "Number of slash command errors",
        labelNames: ["command"],
      }),
      simpleCommandsHistogram: new client.Histogram({
        name: "discord_simple_commands_duration_seconds",
        help: "Duration of simple commands in seconds",
        labelNames: ["command", "success"],
      }),
      slashCommandsHistogram: new client.Histogram({
        name: "discord_slash_commands_duration_seconds",
        help: "Duration of slash commands in seconds",
        labelNames: ["command", "success"],
      }),
    };
  }

  public async initBotStats(client: Client) {
    this.botStats.guilds.set(client.guilds.cache.size);
    this.botStats.channels.set(client.channels.cache.size);

    await this.calcUniqueUsers(client.guilds);
  }

  public createMetricEventHandlers(client: Client) {
    client.on("guildCreate", (guild) => {
      this.botStats.guilds.inc();
      this.botStats.users.inc(guild.memberCount);
    });
    client.on("guildDelete", (guild) => {
      this.botStats.guilds.dec();
      this.botStats.users.dec(guild.memberCount);
    });
    client.on("channelCreate", () => {
      this.botStats.channels.inc();
    });
    client.on("channelDelete", () => {
      this.botStats.channels.dec();
    });
    client.on("guildMemberAdd", async () => {
      await this.calcUniqueUsers(client.guilds);
    });

    client.on("guildMemberRemove", async () => {
      await this.calcUniqueUsers(client.guilds);
    });
  }

  private async calcUniqueUsers(guilds: GuildManager) {
    const allMembers = [];
    for (const guild of guilds.cache.values()) {
      const members = await guild.members.fetch();
      allMembers.push([...members.values()]);
    }

    const flat = allMembers.flat().map((member) => member.id);
    this.botStats.users.set(new Set(flat).size);
  }
}

interface BotStats {
  guilds: client.Gauge;
  users: client.Gauge;
  channels: client.Gauge;
}

interface CommandStats {
  simpleCommands: client.Counter;
  simpleCommandErrors: client.Counter;
  slashCommands: client.Counter;
  slashCommandErrors: client.Counter;
  simpleCommandsHistogram: client.Histogram;
  slashCommandsHistogram: client.Histogram;
}
