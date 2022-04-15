import { config } from "dotenv";
import { DB } from "./db.js";
import { start } from "./services.js";

config();
const dbClient = await DB.init();
start(dbClient);
