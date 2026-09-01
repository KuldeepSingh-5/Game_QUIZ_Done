import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const isProd = process.env.NODE_ENV === 'production';

if (!uri) {
  if (isProd) {
    console.error('[db] FATAL: MONGODB_URI environment variable is not set.');
    process.exit(1);
  }
  console.warn('[db] WARNING: MONGODB_URI not set, falling back to local dev database.');
}

const connectionString = uri || 'mongodb://127.0.0.1:27017/daily_challenge';

const mongooseOpts = {
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 10,
};

export async function connectDB() {
  try {
    await mongoose.connect(connectionString, mongooseOpts);
    console.log('[db] MongoDB connected');
  } catch (err) {
    console.error('[db] MongoDB connection error:', err.message);
    process.exit(1);
  }
}
