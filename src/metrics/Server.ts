import fastify from "fastify";
import client from "prom-client";
import { Container } from "typedi";
import type MeiyounaiseDB from "../db/MeiyounaiseDB.js";

const app = fastify();

export function startMetricsServer() {
  client.collectDefaultMetrics();

  app.get("/metrics", async (_, res) => {
    res.header("Content-Type", client.register.contentType);
    const appMetrics = await client.register.metrics();
    const prismaMetrics = await (
      Container.get("db") as MeiyounaiseDB
    ).getMetrics();

    res.send(`${appMetrics}\n${prismaMetrics}`);
  });

  app.listen({ host: "0.0.0.0", port: 4321 }, (err, addr) => {
    if (err) {
      console.error(`Couldn't start metrics server: ${err}`);
    }
    console.log(`Metrics server listening at ${addr}`);
  });
}
