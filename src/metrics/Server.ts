import fastify from "fastify";
import client from "prom-client";

const app = fastify();

export function startMetricsServer() {
  client.collectDefaultMetrics();

  app.get("/metrics", async (_, res) => {
    res.header("Content-Type", client.register.contentType);

    res.send(await client.register.metrics());
  });

  app.listen({ host: "0.0.0.0", port: 4321 }, (err, addr) => {
    if (err) {
      console.error(`Couldn't start metrics server: ${err}`);
    }
    console.log(`Metrics server listening at ${addr}`);
  });
}
