import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log('MONGO_URI:', process.env.MONGODB_URI); // optional debug

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected!');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
