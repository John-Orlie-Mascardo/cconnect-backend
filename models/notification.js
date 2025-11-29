import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['order_update', 'admin_alert'], required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export const NotificationModel = mongoose.model('Notification', notificationSchema);
