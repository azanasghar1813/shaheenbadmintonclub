const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const admin = await Admin.findOne({ username });
  if (!admin) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!admin.isActive) {
    return res.status(403).json({ message: 'Your account has been restricted.' });
  }

  const match = await admin.comparePassword(password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { 
      id: admin._id, 
      username: admin.username,
      isGeneral: admin.isGeneral,
      contactName: admin.contactName,
      contactNumber: admin.contactNumber
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({ token, username: admin.username, isGeneral: admin.isGeneral, contactName: admin.contactName });
});

// POST /api/auth/verify — check if token is still valid
router.post('/verify', (req, res) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, decoded });
  } catch {
    res.json({ valid: false });
  }
});

module.exports = router;
