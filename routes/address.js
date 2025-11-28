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
 * POST /api/user/addresses
 * Body: { province, city, barangay, postalCode, streetDetails, isDefault }
 */
router.post('/', verifyAuth, ensureUser, async (req, res) => {
    try {
        const { province, city, barangay, postalCode, streetDetails, isDefault } = req.body;

        if (!province || !city || !barangay || !postalCode || !streetDetails) {
            return res.status(400).json({ error: 'All address fields are required (province, city, barangay, postalCode, streetDetails)' });
        }

        const newAddress = {
            province,
            city,
            barangay,
            postalCode,
            streetDetails,
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
 * PUT /api/user/addresses/:addressId
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

        // Update fields (Philippine format)
        if (updates.province) address.province = updates.province;
        if (updates.city) address.city = updates.city;
        if (updates.barangay) address.barangay = updates.barangay;
        if (updates.postalCode) address.postalCode = updates.postalCode;
        if (updates.streetDetails) address.streetDetails = updates.streetDetails;
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
