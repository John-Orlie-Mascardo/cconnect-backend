import { ContactModel } from '../models/contact.js';

/**
 * Returns all non-deleted contacts for the authenticated user
 */
export async function getAllContacts(req, res) {
  try {
    const contacts = await ContactModel.find({
      owner: req.user.uid,
      deleted: false,
    }).sort({ createdAt: -1 });
    return res.json({ data: contacts });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch contacts' });
  }
}

/**
 * Returns single contact by id (only owner and not-deleted)
 */
export async function getContactById(req, res) {
  try {
    const { id } = req.params;
    const contact = await ContactModel.findOne({
      _id: id,
      owner: req.user.uid,
      deleted: false,
    });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    return res.json({ data: contact });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch contact' });
  }
}

/**
 * Create a new contact (owner derived from token)
 */
export async function createContact(req, res) {
  try {
    const { name, email, phone } = req.body;
    if (!name || (!email && !phone)) {
      return res.status(400).json({ error: 'Validation: name and (email or phone) required' });
    }

    const newContact = new ContactModel({
      name,
      email,
      phone,
      owner: req.user.uid,
    });

    await newContact.save();
    return res.status(201).json({ message: 'Contact created', data: newContact });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to create contact' });
  }
}

/**
 * Update selected contact (PUT semantics: full update)
 */
export async function updateContact(req, res) {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    if (!name && !email && !phone) {
      return res.status(400).json({ error: 'Validation: at least one field required to update' });
    }

    const updated = await ContactModel.findOneAndUpdate(
      { _id: id, owner: req.user.uid, deleted: false },
      { $set: { name, email, phone } },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Contact not found or already deleted' });
    return res.json({ message: 'Contact updated', data: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update contact' });
  }
}

/**
 * Soft-delete contact
 */
export async function deleteContact(req, res) {
  try {
    const { id } = req.params;
    const deleted = await ContactModel.findOneAndUpdate(
      { _id: id, owner: req.user.uid, deleted: false },
      { $set: { deleted: true } },
      { new: true }
    );

    if (!deleted) return res.status(404).json({ error: 'Contact not found or already deleted' });
    return res.json({ message: 'Contact soft-deleted', data: deleted });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to delete contact' });
  }
}