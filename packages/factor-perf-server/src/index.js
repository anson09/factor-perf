import { config } from "dotenv";
import { DB } from "./db.js";
import { DB_NS } from "./const.js";
import { start } from "./server.js";

config();
const clients = (await Promise.all(DB_NS.map((NS) => DB.init(NS)))).map(
  (client, idx) => ({ name: DB_NS[idx], instance: client })
);
start(clients);
