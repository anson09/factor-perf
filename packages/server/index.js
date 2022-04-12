import { config } from "dotenv";
import { DB } from "./db.js";
config();

if (
  !process.env.DB_URI ||
  !process.env.DB_NAME ||
  !process.env.COLLECTION_NAME
) {
  console.error(
    "Missing DB_URI, DB_NAME, or DB_COLLECTION environment variables! Please set these variables in .env file."
  );
  process.exit();
}

const client = await new DB().init({
  uri: process.env.DB_URI,
  db: process.env.DB_NAME,
  collection: process.env.COLLECTION_NAME,
});

async function getALLFactors() {
  const documents = await client.findDocuments({}, { _id: 0, factor_id: 1 });
  return documents.map((document) => document.factor_id);
}

async function getFactor(factor_id) {
  return client.findDocuments({ factor_id });
}

await client.close();
