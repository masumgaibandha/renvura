import mongoose from 'mongoose';
import { serverEnv } from '@/lib/env';

/**
 * Serverless-safe Mongoose connection.
 *
 * The connection is cached on `globalThis` so that hot reloads in development
 * and warm lambda invocations in production reuse one pool instead of opening a
 * new one per request. Nothing here runs at import time — `connectToDatabase()`
 * is only called from request handlers and from `npm run db:check`, which is
 * what keeps `npm run build` independent of a live database.
 */

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  __renvuraMongoose?: MongooseCache;
};

const cache: MongooseCache = globalForMongoose.__renvuraMongoose ?? { conn: null, promise: null };
globalForMongoose.__renvuraMongoose = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    const env = serverEnv();

    cache.promise = mongoose
      .connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB_NAME,
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10,
      })
      .catch((error: unknown) => {
        // Clear the cached promise so the next request can retry.
        cache.promise = null;
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cache.conn) {
    await cache.conn.disconnect();
  }
  cache.conn = null;
  cache.promise = null;
}
