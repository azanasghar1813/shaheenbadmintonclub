const express = require('express');
const Announcement = require('../models/Announcement');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/announcements  (public)
router.get('/', async (req, res) => {
  const { limit = 20, category } = req.query;
  const filter = category ? { category } : {};
  const announcements = await Announcement.find(filter)
    .sort({ pinned: -1, createdAt: -1 })
    .limit(Number(limit));
  res.json(announcements);
});

// GET /api/announcements/:id  (public)
router.get('/:id', async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
  res.json(announcement);
});

// POST /api/announcements  (protected)
router.post('/', protect, async (req, res) => {
  const { title, body, pinned, category } = req.body;
  const announcement = await Announcement.create({ title, body, pinned, category });
  res.status(201).json(announcement);
});

// PUT /api/announcements/:id  (protected)
router.put('/:id', protect, async (req, res) => {
  const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
  res.json(announcement);
});

// DELETE /api/announcements/:id  (protected)
router.delete('/:id', protect, async (req, res) => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ message: 'Announcement deleted' });
});

module.exports = router;
