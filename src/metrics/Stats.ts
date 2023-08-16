import { type GuildManager } from "discord.js";
import { Client } from "discordx";
import client from "prom-client";
import os from "os";

export class Stats {
  startTime: number;
  botStats: BotStats;
  commandStats: CommandStats;
  eventStats: EventStats;
  hostStats: HostStats;
  private defaultBuckets = [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10];

  constructor() {
    this.startTime = Date.now();
    this.botStats = {
      guilds: new client.Gauge({
        name: "discord_guilds_total",
        help: "Number of guilds the bot is in",
      }),
      uniqueUsers: new client.Gauge({
        name: "discord_unique_users_total",
        help: "Number of users the bot can see",
      }),
      channels: new client.Gauge({
        name: "discord_channels_total",
        help: "Number of channels the bot can see",
      }),
      totalUsers: new client.Gauge({
        name: "discord_users_total",
        help: "Number of users the bot can see",
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
        buckets: this.defaultBuckets,
      }),
      slashCommandsHistogram: new client.Histogram({
        name: "discord_slash_commands_duration_seconds",
        help: "Duration of slash commands in seconds",
        buckets: this.defaultBuckets,
      }),
    };

    this.eventStats = {
      events: new client.Counter({
        name: "discord_events_total",
        help: "Number of events executed",
        labelNames: ["event_name"],
      }),
      eventErrors: new client.Counter({
        name: "discord_event_errors_total",
        help: "Number of event errors",
        labelNames: ["event_name"],
      }),
      eventHistogram: new client.Histogram({
        name: "discord_events_duration_seconds",
        help: "Duration of event handlers in seconds",
        buckets: this.defaultBuckets,
      }),
    };

    this.hostStats = {
      cpuUsage: new client.Gauge({
        name: "host_cpu_usage_percent",
        help: "CPU usage of the host in percent",
        collect() {
          const start = getCPUInfo();
          const startIdle = start.idle;
          const startTotal = start.total;

          setTimeout(() => {
            const end = getCPUInfo();
            const endIdle = end.idle;
            const endTotal = end.total;

            const idle = endIdle - startIdle;
            const total = endTotal - startTotal;
            const perc = idle / total;

            this.set(1 - perc);
          }, 1000);

          function getCPUInfo() {
            const { idle, user, nice, sys, irq } = os.cpus().reduce(
              (acc, cpu) => ({
                idle: acc.idle + cpu.times.idle,
                user: acc.user + cpu.times.user,
                nice: acc.nice + cpu.times.nice,
                sys: acc.sys + cpu.times.sys,
                irq: acc.irq + cpu.times.irq,
              }),
              { idle: 0, user: 0, nice: 0, sys: 0, irq: 0 },
            );

            return { idle, total: user + nice + sys + irq + idle };
          }
        },
      }),
      freeMemory: new client.Gauge({
        name: "host_free_memory_bytes",
        help: "Free memory of the host in bytes",
        collect() {
          this.set(os.freemem());
        },
      }),
      totalMemory: new client.Gauge({
        name: "host_total_memory_bytes",
        help: "Total memory of the host",
        collect() {
          this.set(os.totalmem());
        },
      }),

      hostUptime: new client.Gauge({
        name: "host_uptime_seconds",
        help: "Uptime of the host in seconds",
        collect() {
          this.set(os.uptime());
        },
      }),
      processUptime: new client.Gauge({
        name: "process_uptime_seconds",
        help: "Uptime of the process in seconds",
        collect() {
          this.set(process.uptime());
        },
      }),
    };
  }

  public async initBotStats(client: Client) {
    this.botStats.guilds.set(client.guilds.cache.size);
    this.botStats.channels.set(client.channels.cache.size);
    await this.calcUsers(client.guilds);
  }

  public createMetricEventHandlers(client: Client) {
    client.on("guildCreate", (guild) => {
      this.botStats.guilds.inc();
      this.botStats.uniqueUsers.inc(guild.memberCount);
    });
    client.on("guildDelete", (guild) => {
      this.botStats.guilds.dec();
      this.botStats.uniqueUsers.dec(guild.memberCount);
    });
    client.on("channelCreate", () => {
      this.botStats.channels.inc();
    });
    client.on("channelDelete", () => {
      this.botStats.channels.dec();
    });
    client.on("guildMemberAdd", async () => {
      await this.calcUsers(client.guilds);
    });

    client.on("guildMemberRemove", async () => {
      await this.calcUsers(client.guilds);
    });
  }

  private async calcUsers(guilds: GuildManager) {
    const allMembers = [];
    for (const guild of guilds.cache.values()) {
      const members = await guild.members.fetch();
      allMembers.push([...members.values()]);
    }

    const flat = allMembers.flat().map((member) => member.id);
    this.botStats.uniqueUsers.set(new Set(flat).size);
    this.botStats.totalUsers.set(flat.length);
  }
}

interface BotStats {
  guilds: client.Gauge;
  channels: client.Gauge;
  totalUsers: client.Gauge;
  uniqueUsers: client.Gauge;
}

interface CommandStats {
  simpleCommands: client.Counter;
  simpleCommandErrors: client.Counter;
  slashCommands: client.Counter;
  slashCommandErrors: client.Counter;
  simpleCommandsHistogram: client.Histogram;
  slashCommandsHistogram: client.Histogram;
}

interface EventStats {
  events: client.Counter;
  eventErrors: client.Counter;
  eventHistogram: client.Histogram;
}

interface HostStats {
  cpuUsage: client.Gauge;
  freeMemory: client.Gauge;
  totalMemory: client.Gauge;
  hostUptime: client.Gauge;
  processUptime: client.Gauge;
}
