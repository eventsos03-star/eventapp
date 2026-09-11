import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';


async function start(): Promise<void> {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`EventOS API running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });


  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
