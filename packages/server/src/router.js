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
    return dbClient.findDocuments({ factor_id: request.params.factor });
  });
}
