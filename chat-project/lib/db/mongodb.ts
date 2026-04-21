import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;

const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo._mongoClientPromise = client.connect();
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const name = process.env.MONGODB_DB ?? "chat_app";
  return client.db(name);
}

export function isMongoConfigured(): boolean {
  return Boolean(uri);
}
