import express from 'express';
import { NotificationModel } from '../models/notification.js';
import { verifyAuth } from '../middleware/auth.js';
import { UserModel } from '../models/user.js';

const router = express.Router();

// Middleware to ensure user exists
const ensureUser = async (req, res, next) => {
    try {
        const { uid } = req.user;
        const user = await UserModel.findOne({ firebaseUid: uid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        req.mongoUser = user;
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/notifications - Fetch notifications for the current user
router.get('/', verifyAuth, ensureUser, async (req, res) => {
    try {
        console.log(`📬 Fetching notifications for user: ${req.mongoUser._id} (${req.mongoUser.email}) [Role: ${req.mongoUser.role}]`);

        const notifications = await NotificationModel.find({
            recipient: req.mongoUser._id
        })
            .sort({ createdAt: -1 })
            .limit(50);

        console.log(`   Found ${notifications.length} notifications for this user`);
        console.log(`   Unread count: ${notifications.filter(n => !n.read).length}`);

        res.status(200).json(notifications);
    } catch (error) {
        console.error('❌ Error fetching notifications:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', verifyAuth, ensureUser, async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`📖 Marking notification ${id} as read for user: ${req.mongoUser._id} (${req.mongoUser.email})`);

        const notification = await NotificationModel.findOne({
            _id: id,
            recipient: req.mongoUser._id // Ensure notification belongs to current user
        });

        if (!notification) {
            console.log(`   ❌ Notification not found or doesn't belong to user`);
            return res.status(404).json({ error: 'Notification not found' });
        }

        notification.read = true;
        await notification.save();

        console.log(`   ✅ Notification marked as read`);
        res.status(200).json(notification);
    } catch (error) {
        console.error('❌ Error marking notification as read:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export const notificationRoutes = router;
