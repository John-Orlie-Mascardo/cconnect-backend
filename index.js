import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { userRoutes } from './routes/user.js';
import { contactsRoutes } from './routes/contacts.js'; // added

dotenv.config(); // load .env

const app = express();
app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin: 'http://localhost:61458',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Connect MongoDB using Atlas
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Use routes
app.use('/api/user', userRoutes);
app.use('/api/contacts', contactsRoutes); // added

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});

import productRouter from './routes/product.js';
app.use('/api', productRouter);
