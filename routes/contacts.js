import express from 'express';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.js';
import {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
} from '../controllers/contacts.js';

const router = express.Router();

// All contacts routes require authentication
router.use(verifyFirebaseToken);

// Read many
router.get('/', getAllContacts);

// Read one
router.get('/:id', getContactById);

// Create
router.post('/', createContact);

// Update (full update / could switch to PATCH for partial)
router.put('/:id', updateContact);

// Soft-delete
router.delete('/:id', deleteContact);

export const contactsRoutes = router;