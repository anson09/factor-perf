import { MongoClient } from "mongodb";

export class DB {
  CONFIG = {
    serverSelectionTimeoutMS: 3000,
  };

  async init({ uri, db, collection, config }) {
    Object.assign(this.CONFIG, config);
    this.client = await this.connectToCluster(uri);
    this.db = this.client.db(db);
    this.collection = this.db.collection(collection);
    return this;
  }

  async connectToCluster(uri) {
    let mongoClient;

    try {
      console.time("connectToClusterUse");
      mongoClient = new MongoClient(uri, this.CONFIG);
      console.log("Connecting to MongoDB cluster...");
      await mongoClient.connect();
      console.log("Successfully connected to MongoDB !");
      console.timeEnd("connectToClusterUse");

      return mongoClient;
    } catch (error) {
      console.error("Connection to MongoDB failed!", error);
      process.exit();
    }
  }

  async addDocument(document) {
    const rsp = await this.collection.insertOne(document);
    return rsp.insertedId.toString();
  }

  async findDocuments(fields, projection) {
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

  async close() {
    return this.client.close();
  }
}
