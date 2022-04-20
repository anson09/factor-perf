import { readFile } from "fs/promises";

export default async function routes(fastify, options) {
  const dbClient = fastify.mongo.client;

  fastify.get("/factors", async (request, reply) => {
    const documents = await dbClient.findDocuments(
      {},
      { _id: 0, factor_id: 1 }
    );
    return documents.map((document) => document.factor_id);
  });

  fastify.get("/factors/:factor", async (request, reply) => {
    return dbClient.findDocuments(
      { factor_id: request.params.factor },
      { _id: 0 }
    );
  });

  fastify.get("/trading-dates", async (request, reply) => {
    return JSON.parse(
      await readFile(
        new URL("../assets/trading-dates@2020-2023.json", import.meta.url)
      )
    );
  });
}
