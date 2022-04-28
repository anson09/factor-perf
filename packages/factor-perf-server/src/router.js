import { readFile } from "fs/promises";

export default async function routes(fastify, options) {
  const riceDBClient = fastify.mongo.RICE.client;
  const barraDBClient = fastify.mongo.BARRA.client;

  fastify.get("/factors", async (request, reply) => {
    const documents = await riceDBClient.findDocuments(
      {},
      { _id: 0, factor_id: 1 }
    );
    return documents.map((document) => document.factor_id);
  });

  fastify.get("/factors/:factor", async (request, reply) => {
    return riceDBClient.findDocuments(
      { factor_id: request.params.factor },
      { _id: 0 }
    );
  });

  fastify.get("/trading-dates", async (request, reply) => {
    return readFile(
      new URL("../assets/trading-dates@2013-2023.json", import.meta.url)
    );
  });
}
