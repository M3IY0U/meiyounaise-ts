import { Meiyounaise } from "./Client.js";
import BoardRepo from "./db/BoardRepo.js";
import DebugRepo from "./db/DebugRepo.js";
import GuildRepo from "./db/GuildRepo.js";
import LastRepo from "./db/LastRepo.js";
import { startMetricsServer } from "./metrics/Server.js";
import { DIService, typeDiDependencyRegistryEngine } from "discordx";
import "dotenv/config";
import "reflect-metadata";
import { Container, Service } from "typedi";

if (!process.env.BOT_TOKEN) {
  console.log("Please set the BOT_TOKEN environment variable");
  process.exit(1);
}

// dependency injection
DIService.engine = typeDiDependencyRegistryEngine
  .setService(Service)
  .setInjector(Container);
Container.set("lastRepo", new LastRepo());
Container.set("boardRepo", new BoardRepo());
Container.set("guildRepo", new GuildRepo());
Container.set("debugRepo", new DebugRepo());

// start things
startMetricsServer();

const bot = new Meiyounaise();
await bot.start();
