import "reflect-metadata";
import { Meiyounaise } from "./Client.js";
import "dotenv/config";
import { dirname, importx } from "@discordx/importer";
import { DIService, typeDiDependencyRegistryEngine } from "discordx";
import { Container, Service } from "typedi";
import { MeiyounaiseDB } from "./db/MeiyounaiseDB.js";
import { LastRepo } from "./db/LastRepo.js";
import { BoardRepo } from "./db/BoardRepo.js";
import { GuildRepo } from "./db/GuildRepo.js";

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

// start things
await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);
await Meiyounaise.login(process.env.BOT_TOKEN).catch(async (e) => {
  console.error(e);
  await Container.get(MeiyounaiseDB).disconnect();
  process.exit(1);
});
