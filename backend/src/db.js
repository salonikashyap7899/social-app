import mongoose from 'mongoose';

/** Connects to MongoDB Atlas; fails fast so a bad URI does not start a half-dead server. */
export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}
