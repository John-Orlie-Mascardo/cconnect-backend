import dotenv from 'dotenv';
import path from 'path';
dotenv.config(); // Load .env
console.log("ENV keys:", Object.keys(process.env));
console.log("Mongo URI:", process.env.MONGODB_URI);

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';


import { userRoutes } from './routes/user.js';
import { contactsRoutes } from './routes/contacts.js';
import productRouter from './routes/product.js';
import { passwordResetRoutes } from './routes/passwordReset.js';
import { cartRoutes } from './routes/cart.js';
import { addressRoutes } from './routes/address.js';
import { orderRoutes } from './routes/orders.js';
import { wishlistRoutes } from './routes/wishlist.js';
import { aiRoutes } from './routes/ai.js';
import { notificationRoutes } from './routes/notifications.js';
import { chatRoutes } from './routes/chat.js';



const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
      if (CLIENT_ORIGIN && origin === CLIENT_ORIGIN) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});
// CORS setup - Allow any localhost origin for development
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Allow any localhost origin (for Flutter web dev server with random ports)
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }

      // In production, check against CLIENT_ORIGIN env variable
      const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
      if (CLIENT_ORIGIN && origin === CLIENT_ORIGIN) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.use(express.json());

// Serve uploads folder
const uploadsPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});


// Base URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
app.locals.baseUrl = API_BASE_URL;


// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running' });
});


// Routes
app.use('/api/user/addresses', addressRoutes);
app.use('/api/user', userRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api', productRouter);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/cart', cartRoutes);
// app.use('/api/address', addressRoutes); // Moved to /api/user/addresses
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);


// Socket.IO Setup
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { MessageModel } from './models/Message.js';
import { ConversationModel } from './models/Conversation.js';

const setupSocketIO = (io) => {
  // Store connected users: { userId: socketId }
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('🔌 New socket connection:', socket.id);

    // Authenticate user
    socket.on('authenticate', async (token) => {
      try {
        let userId, userRole;

        // 1. Try Firebase Verification
        if (admin.apps.length) {
          try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            userId = decodedToken.uid;

            // Fetch user role from database
            const UserModel = (await import('./models/user.js')).UserModel;
            const user = await UserModel.findOne({ firebaseUid: userId });

            if (user) {
              userRole = user.role || 'user';
              console.log(`✅ Firebase Auth Success: ${userId} (Role: ${userRole})`);
            } else {
              userRole = 'user'; // Default for new users
              console.log(`✅ Firebase Auth Success: ${userId} (New user, default role: user)`);
            }
          } catch (e) {
            // Not a valid Firebase token, continue to custom JWT
          }
        }

        // 2. Try Custom JWT Verification (if not already authenticated)
        if (!userId) {
          const secret = process.env.JWT_SECRET || 'default_secret_key_change_me';
          const decoded = jwt.verify(token, secret);
          userId = decoded.uid;
          userRole = decoded.role || 'user';
          console.log(`✅ Custom JWT Auth Success: ${userId} (Role: ${userRole})`);
        }

        socket.userId = userId;
        socket.userRole = userRole;

        // Store connection
        connectedUsers.set(socket.userId, socket.id);

        console.log(`✅ User authenticated: ${socket.userId} (${socket.userRole})`);
        socket.emit('authenticated', { userId: socket.userId, role: socket.userRole });
      } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        socket.emit('error', { message: 'Authentication failed' });
        socket.disconnect();
      }
    });

    // Join conversation room
    socket.on('join_conversation', async (conversationId) => {
      if (!socket.userId) {
        return socket.emit('error', { message: 'Not authenticated' });
      }

      socket.join(conversationId);
      console.log(`👤 User ${socket.userId} joined conversation: ${conversationId}`);

      // Notify other party that user is online
      socket.to(conversationId).emit('user_online', { userId: socket.userId });
    });

    // Send message
    socket.on('send_message', async (data) => {
      console.log('=== 📤 SEND MESSAGE DEBUG ===');
      console.log('Data received:', data);
      console.log('socket.userId:', socket.userId);
      console.log('socket.userRole:', socket.userRole);

      try {
        if (!socket.userId) {
          console.error('❌ ERROR: socket.userId is undefined!');
          return socket.emit('error', { message: 'Not authenticated' });
        }

        const { conversationId, message } = data;

        if (!conversationId) {
          console.error('❌ ERROR: conversationId is missing!');
          return socket.emit('error', { message: 'Missing conversationId' });
        }

        if (!message) {
          console.error('❌ ERROR: message is missing!');
          return socket.emit('error', { message: 'Missing message' });
        }

        console.log('✅ Validation passed, creating message...');

        // Save message to database
        const newMessage = await MessageModel.create({
          conversationId,
          senderId: socket.userId,
          senderRole: socket.userRole,
          message,
          timestamp: new Date()
        });

        console.log('✅ Message created:', newMessage._id);

        // Try to populate sender info if it's an ObjectId, otherwise just return the message
        try {
          if (mongoose.Types.ObjectId.isValid(socket.userId)) {
            await newMessage.populate('senderId', 'name email role');
            console.log('✅ Sender info populated');
          } else {
            console.log('ℹ️ Skipping populate for Firebase UID');
          }
        } catch (err) {
          console.warn('⚠️ Failed to populate sender info:', err.message);
        }

        // Update conversation
        console.log('Updating conversation...');

        // Find conversation by the actual customer ID (which could be ObjectId or Firebase UID)
        // First, try to find the user in the database to get their ObjectId
        const UserModel = (await import('./models/user.js')).UserModel;
        let customerDbId = socket.userId;

        // If it's a Firebase UID, find the user's ObjectId
        if (!mongoose.Types.ObjectId.isValid(socket.userId)) {
          const user = await UserModel.findOne({ firebaseUid: socket.userId });
          if (user) {
            customerDbId = user._id;
          }
        }

        const conversation = await ConversationModel.findOne({
          customerId: customerDbId
        });

        if (conversation) {
          conversation.lastMessage = message.substring(0, 100);
          conversation.lastMessageTime = new Date();

          // Increment unread count for the recipient
          if (socket.userRole === 'admin') {
            conversation.unreadCount += 1;
          } else {
            conversation.adminUnreadCount += 1;
          }

          await conversation.save();
          console.log('✅ Conversation updated');
        } else {
          console.warn('⚠️ Conversation not found');
        }

        // Broadcast message to conversation room (exclude sender to prevent duplicates)
        socket.to(conversationId).emit('new_message', {
          message: newMessage,
          conversationId
        });

        // Optionally emit a confirmation to the sender if needed
        socket.emit('message_sent_confirmation', {
          message: newMessage,
          conversationId
        });

        console.log(`✅ Message sent in ${conversationId} by ${socket.userId}`);
      } catch (error) {
        console.error('❌ DETAILED ERROR:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      if (!socket.userId) return;

      const { conversationId, isTyping } = data;
      socket.to(conversationId).emit('user_typing', {
        userId: socket.userId,
        isTyping
      });
    });

    // Mark messages as read
    socket.on('mark_read', async (data) => {
      try {
        if (!socket.userId) return;

        const { conversationId } = data;
        const senderRole = socket.userRole === 'admin' ? 'user' : 'admin';

        // Mark messages as read
        await MessageModel.updateMany(
          { conversationId, senderRole, isRead: false },
          { isRead: true }
        );

        // Update conversation unread count
        const conversation = await ConversationModel.findOne({
          customerId: conversationId.split('_')[1] || socket.userId
        });

        if (conversation) {
          if (socket.userRole === 'admin') {
            conversation.adminUnreadCount = 0;
          } else {
            conversation.unreadCount = 0;
          }
          await conversation.save();
        }

        // Notify other party
        socket.to(conversationId).emit('messages_read', { conversationId });
      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`👋 User ${socket.userId} disconnected`);
      }
    });
  });
};


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

    // Socket.IO connection handling
    setupSocketIO(io);

    // Start server only after MongoDB connection
    httpServer.listen(3000, '0.0.0.0', () => {
      console.log("🚀 Server running on http://0.0.0.0:3000");
      console.log("💬 Socket.IO ready for real-time chat");
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
