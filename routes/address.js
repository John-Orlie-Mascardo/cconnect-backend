import express from 'express';
import { UserModel } from '../models/user.js';
import { verifyAuth } from '../middleware/auth.js';

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

/**
 * 🔹 Get User Addresses
 * GET /api/address
 */
router.get('/', verifyAuth, ensureUser, async (req, res) => {
    try {
        res.status(200).json(req.mongoUser.addresses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * 🔹 Add New Address
 * POST /api/address/add
 * Body: { street, city, state, zipCode, country, isDefault }
 */
router.post('/add', verifyAuth, ensureUser, async (req, res) => {
    try {
        const { street, city, state, zipCode, country, isDefault } = req.body;

        if (!street || !city || !state || !zipCode || !country) {
            return res.status(400).json({ error: 'All address fields are required' });
        }

        const newAddress = {
            street,
            city,
            state,
            zipCode,
            country,
            isDefault: isDefault || false
        };

        // If setting as default, unset other defaults
        if (newAddress.isDefault) {
            req.mongoUser.addresses.forEach(addr => addr.isDefault = false);
        }
        // If first address, make it default automatically
        else if (req.mongoUser.addresses.length === 0) {
            newAddress.isDefault = true;
        }

        req.mongoUser.addresses.push(newAddress);
        await req.mongoUser.save();

        res.status(201).json(req.mongoUser.addresses);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * 🔹 Update Address
 * PUT /api/address/:addressId
 */
router.put('/:addressId', verifyAuth, ensureUser, async (req, res) => {
    try {
        const { addressId } = req.params;
        const updates = req.body;

        const address = req.mongoUser.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // If setting as default, unset others
        if (updates.isDefault) {
            req.mongoUser.addresses.forEach(addr => addr.isDefault = false);
        }

        // Update fields
        if (updates.street) address.street = updates.street;
        if (updates.city) address.city = updates.city;
        if (updates.state) address.state = updates.state;
        if (updates.zipCode) address.zipCode = updates.zipCode;
        if (updates.country) address.country = updates.country;
        if (updates.isDefault !== undefined) address.isDefault = updates.isDefault;

        await req.mongoUser.save();
        res.status(200).json(req.mongoUser.addresses);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * 🔹 Delete Address
 * DELETE /api/address/:addressId
 */
router.delete('/:addressId', verifyAuth, ensureUser, async (req, res) => {
    try {
        const { addressId } = req.params;

        req.mongoUser.addresses.pull(addressId);
        await req.mongoUser.save();

        res.status(200).json(req.mongoUser.addresses);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export const addressRoutes = router;
