import Fastify from "fastify";
import fastifyMongodb from "fastify-mongodb";
import router from "./router.js";

const fastify = Fastify({ logger: true });

async function start(dbClient) {
  fastify
    .register(fastifyMongodb, { client: dbClient })
    .register(router, { prefix: "/api/factor-perf" })
    .addHook("onClose", async () => {
      await dbClient.close();
    });

  try {
    await fastify.listen(3000, "0.0.0.0");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

export { start };
