import { config } from "dotenv";
import { DB } from "./db.js";
import { start } from "./server.js";

config();
const dbClient = await DB.init();
start(dbClient);
