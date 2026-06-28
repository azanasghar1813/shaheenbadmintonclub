const express = require('express');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Middleware to restrict to general admin only
const requireGeneralAdmin = (req, res, next) => {
  if (!req.admin || !req.admin.isGeneral) {
    return res.status(403).json({ message: 'Forbidden. General Admin access required.' });
  }
  next();
};

// GET /api/admins/public (No auth required)
router.get('/public', async (req, res) => {
  // Fetch active Club Admins
  const admins = await Admin.find({ isGeneral: false, isActive: true })
    .select('contactName contactNumber username -_id')
    .sort({ createdAt: 1 });
  res.json(admins);
});

// GET /api/admins
router.get('/', protect, requireGeneralAdmin, async (req, res) => {
  const admins = await Admin.find({ isGeneral: false }).select('-passwordHash').sort({ createdAt: -1 });
  res.json(admins);
});

// POST /api/admins
router.post('/', protect, requireGeneralAdmin, async (req, res) => {
  const { username, password, contactName, contactNumber } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });

  const existing = await Admin.findOne({ username });
  if (existing) return res.status(400).json({ message: 'Username already exists' });

  const admin = await Admin.create({
    username,
    passwordHash: password, // Pre-save hook hashes it
    contactName,
    contactNumber,
    isGeneral: false,
    isActive: true,
  });
  
  const adminObj = admin.toObject();
  delete adminObj.passwordHash;
  res.status(201).json(adminObj);
});

// PUT /api/admins/:id/restrict
router.put('/:id/restrict', protect, requireGeneralAdmin, async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  if (admin.isGeneral) return res.status(400).json({ message: 'Cannot restrict general admin' });

  admin.isActive = !admin.isActive;
  await admin.save();
  
  const adminObj = admin.toObject();
  delete adminObj.passwordHash;
  res.json(adminObj);
});

// DELETE /api/admins/:id
router.delete('/:id', protect, requireGeneralAdmin, async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  if (admin.isGeneral) return res.status(400).json({ message: 'Cannot delete general admin' });

  await Admin.findByIdAndDelete(req.params.id);
  res.json({ message: 'Admin deleted' });
});

module.exports = router;
