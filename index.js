import dotenv from 'dotenv';
import path from 'path';
dotenv.config(); // Load .env
console.log("ENV keys:", Object.keys(process.env));
console.log("Mongo URI:", process.env.MONGODB_URI);

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import fs from 'fs';


import { userRoutes } from './routes/user.js';
import { contactsRoutes } from './routes/contacts.js';
import productRouter from './routes/product.js';


const app = express();
app.use(express.json());

// Serve uploads folder
const uploadsPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// CORS setup
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:61458';
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Base URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
app.locals.baseUrl = API_BASE_URL;

// Routes
app.use('/api/user', userRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api', productRouter);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in .env");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    // Start server only after MongoDB connection
    app.listen(3000, '0.0.0.0', () => {
      console.log("🚀 Server running on http://0.0.0.0:3000");
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
