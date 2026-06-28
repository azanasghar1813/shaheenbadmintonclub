const express = require('express');
const Player = require('../models/Player');
const { protect } = require('../middleware/auth');
const { upload, cloudinary, uploadToCloudinary } = require('../middleware/upload');

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────

// GET /api/players
router.get('/', async (req, res) => {
  const { search, skill, sort = 'name', status } = req.query;
  const filter = {};
  
  // If status is provided, use it. Otherwise, default to 'approved' for public endpoints
  if (status && status !== 'all') {
    filter.status = status;
  } else if (!status) {
    filter.status = 'approved';
  }

  if (search) filter.name = { $regex: search, $options: 'i' };
  if (skill) filter.skillLevel = skill;

  const sortMap = {
    name: { name: 1 },
    wins: { 'stats.wins': -1 },
    winRate: { 'stats.wins': -1 },
    joined: { joinedDate: -1 },
  };

  const players = await Player.find(filter).sort(sortMap[sort] || { name: 1 });
  res.json(players);
});

// POST /api/players/join (public)
router.post('/join', upload.single('photo'), async (req, res) => {
  const { name, skillLevel, position, phone } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  let photo = { url: '', publicId: '' };
  if (req.file) {
    photo = await uploadToCloudinary(req.file.buffer, `player_join_${Date.now()}`);
  }

  const player = await Player.create({ 
    name, 
    skillLevel: skillLevel || 'Beginner', 
    position, 
    phone, 
    photo,
    status: 'pending' 
  });
  res.status(201).json({ message: 'Join request submitted', player });
});

// GET /api/players/:id
router.get('/:id', async (req, res) => {
  const player = await Player.findById(req.params.id);
  if (!player) return res.status(404).json({ message: 'Player not found' });
  res.json(player);
});

// ── Admin ─────────────────────────────────────────────────────────────────────

// POST /api/players  (protected)
router.post('/', protect, upload.single('photo'), async (req, res) => {
  const { name, skillLevel, position, phone, joinedDate } = req.body;
  let photo = { url: '', publicId: '' };
  if (req.file) {
    photo = await uploadToCloudinary(req.file.buffer, `player_${Date.now()}`);
  }

  const player = await Player.create({ name, skillLevel, position, phone, photo, joinedDate });
  res.status(201).json(player);
});

// PUT /api/players/:id  (protected)
router.put('/:id', protect, upload.single('photo'), async (req, res) => {
  const player = await Player.findById(req.params.id);
  if (!player) return res.status(404).json({ message: 'Player not found' });

  const { name, skillLevel, position, phone, status } = req.body;
  if (name) player.name = name;
  if (skillLevel) player.skillLevel = skillLevel;
  if (position !== undefined) player.position = position;
  if (phone !== undefined) player.phone = phone;
  if (status !== undefined) player.status = status;

  if (req.file) {
    // Delete old Cloudinary image
    if (player.photo?.publicId) {
      await cloudinary.uploader.destroy(player.photo.publicId);
    }
    player.photo = await uploadToCloudinary(req.file.buffer, `player_${player._id}`);
  }

  await player.save();
  res.json(player);
});

// PUT /api/players/:id/status (protected)
router.put('/:id/status', protect, async (req, res) => {
  const player = await Player.findById(req.params.id);
  if (!player) return res.status(404).json({ message: 'Player not found' });

  const { status } = req.body;
  
  // Only General Admin can restrict or unrestrict a restricted user
  if ((status === 'restricted' || player.status === 'restricted') && !req.admin.isGeneral) {
    return res.status(403).json({ message: 'Only General Admin can manage restricted players.' });
  }

  if (['pending', 'approved', 'restricted'].includes(status)) {
    player.status = status;
    await player.save();
    res.json(player);
  } else {
    res.status(400).json({ message: 'Invalid status' });
  }
});

// DELETE /api/players/:id  (protected)
router.delete('/:id', protect, async (req, res) => {
  const player = await Player.findById(req.params.id);
  if (!player) return res.status(404).json({ message: 'Player not found' });

  if (player.photo?.publicId) {
    await cloudinary.uploader.destroy(player.photo.publicId);
  }

  await player.deleteOne();
  res.json({ message: 'Player deleted' });
});

// PATCH /api/players/:id/stats  (protected) — manual stat adjustment
router.patch('/:id/stats', protect, async (req, res) => {
  const { wins, losses, gamesPlayed, tournamentsPlayed, tournamentsWon } = req.body;
  const update = {};
  if (wins !== undefined) update['stats.wins'] = Number(wins);
  if (losses !== undefined) update['stats.losses'] = Number(losses);
  if (gamesPlayed !== undefined) update['stats.gamesPlayed'] = Number(gamesPlayed);
  if (tournamentsPlayed !== undefined) update['stats.tournamentsPlayed'] = Number(tournamentsPlayed);
  if (tournamentsWon !== undefined) update['stats.tournamentsWon'] = Number(tournamentsWon);

  const player = await Player.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
  if (!player) return res.status(404).json({ message: 'Player not found' });
  res.json(player);
});

module.exports = router;
