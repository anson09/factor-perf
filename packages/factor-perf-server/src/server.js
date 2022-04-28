import Fastify from "fastify";
import fastifyMongodb from "fastify-mongodb";
import router from "./router.js";

const fastify = Fastify({ logger: true });

async function start(dbClients) {
  dbClients.forEach((dbClient) => {
    fastify.register(fastifyMongodb, {
      client: dbClient.instance,
      name: dbClient.name,
    });
  });

  fastify
    .register(router, { prefix: "/api/factor-perf" })
    .addHook("onClose", async () => {
      await Promise.all(dbClients.map((dbClient) => dbClient.instance.close()));
    });

  try {
    await fastify.listen(3000, "0.0.0.0");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

export { start };
