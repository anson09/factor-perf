import { readFile } from "fs/promises";
import { DB_NS } from "./const.js";

export default async function routes(fastify, options) {
  const riceDBClient = fastify.mongo[DB_NS[0]].client;
  const barraDBClient = fastify.mongo[DB_NS[1]].client;

  /*
@query [rice|barra] type
*/
  fastify.get("/factors", async (request, reply) => {
    switch (request.query.type) {
      case "rice":
        const documents = await riceDBClient.findDocuments(
          {},
          { _id: 0, factor_id: 1 }
        );
        return documents.map((document) => document.factor_id);
      case "barra":
        return barraDBClient.distinct("factor");
      default:
        return "please select query ?type=[rice|barra] ";
    }
  });

  /*
@params <string> factor
@query [rice|barra] type
@query <Date> start_date, when type is barra
*/
  fastify.get("/factors/:factor", async (request, reply) => {
    switch (request.query.type) {
      case "rice":
        return riceDBClient.findDocuments(
          { factor_id: request.params.factor },
          { _id: 0 }
        );
      case "barra":
        const default_start_date = new Date("2013-01-01");
        const user_start_date = new Date(request.query.start_date);
        let start_date;
        if (
          user_start_date.toString() === "Invalid Date" ||
          user_start_date < default_start_date
        ) {
          start_date = default_start_date;
        } else {
          start_date = user_start_date;
        }
        return barraDBClient.findDocuments(
          {
            factor: request.params.factor,
            date: { $gte: start_date },
          },
          { _id: 0 }
        );
      default:
        return "please select query ?type=[rice|barra]";
    }
  });

  fastify.get("/trading-dates", async (request, reply) => {
    return readFile(
      new URL("../assets/trading-dates@2013-2023.json", import.meta.url)
    );
  });
}
