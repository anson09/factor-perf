import { MongoClient } from "mongodb";

export class DB {
  client;
  db;
  collection;
  CONFIG = {
    serverSelectionTimeoutMS: 3000,
  };

  static async init(NS) {
    if (
      !process.env[`${NS}_DB_URI`] ||
      !process.env[`${NS}_DB_NAME`] ||
      !process.env[`${NS}_COLLECTION_NAME`]
    ) {
      console.error(
        "Missing DB_URI, DB_NAME, or DB_COLLECTION environment variables! Please set these variables in .env file."
      );
      process.exit();
    }

    return new DB().init({
      uri: process.env[`${NS}_DB_URI`],
      db: process.env[`${NS}_DB_NAME`],
      collection: process.env[`${NS}_COLLECTION_NAME`],
      ns: NS,
    });
  }

  async init({ uri, db, collection, config, ns }) {
    Object.assign(this.CONFIG, config);
    this.client = await this.#connectToCluster(uri, ns);
    this.db = this.client.db(db);
    this.collection = this.db.collection(collection);
    return this;
  }

  async #connectToCluster(uri, ns = "") {
    let mongoClient;

    try {
      console.time(`Connect to ${ns} DB use`);
      mongoClient = new MongoClient(uri, this.CONFIG);
      console.log(`Connecting to MongoDB ${ns} Cluster...`);
      await mongoClient.connect();
      console.timeEnd(`Connect to ${ns} DB use`);

      return mongoClient;
    } catch (error) {
      console.error(`Connection to MongoDB ${ns} failed!`, error);
      process.exit();
    }
  }

  async addDocument(document) {
    const rsp = await this.collection.insertOne(document);
    return rsp.insertedId.toString();
  }

  async findDocuments(fields, projection = {}) {
    return this.collection.find(fields).project(projection).toArray();
  }

  async updateDocuments(fields, updatedFields) {
    const rsp = await this.collection.updateMany(fields, {
      $set: updatedFields,
    });
    return rsp.matchedCount;
  }

  async deleteDocuments(fields) {
    const rsp = await this.collection.deleteMany(fields);
    return rsp.deletedCount;
  }

  async distinct(field, query = {}) {
    return this.collection.distinct(field, query);
  }

  async close() {
    return this.client.close();
  }
}
