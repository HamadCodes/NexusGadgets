import { MongoClient, Db, Collection, Document } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

const uri = process.env.MONGODB_URI as string;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
let dbInstance: Db;

if (!uri) throw new Error('Add Mongo URI to .env.local');

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// Function to get database instance
export async function getDb(): Promise<Db> {
  if (!dbInstance) {
    const client = await clientPromise;
    dbInstance = client.db(); // Use your database name if not default
  }
  return dbInstance;
}

// Function to get collection with type safety
export async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}