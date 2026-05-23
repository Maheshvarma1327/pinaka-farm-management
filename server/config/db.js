import mongoose from 'mongoose';

/**
 * Initializes connection to MongoDB.
 * Uses environment credentials with automatic fallback to local instance.
 */
export const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pinaka';
    
    // Configure Mongoose connection options
    const conn = await mongoose.connect(connUri);
    
    console.log(`\x1b[32m[MongoDB Connected]: Host: ${conn.connection.host} | Database: ${conn.connection.name}\x1b[0m`);
  } catch (error) {
    console.error(`\x1b[31m[MongoDB Connection Error]: ${error.message}\x1b[0m`);
    // Do not terminate process in development bypass mode
  }
};
