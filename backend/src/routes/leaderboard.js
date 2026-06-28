const express = require('express');
const Player = require('../models/Player');

const router = express.Router();

// GET /api/leaderboard
// Returns players ranked by wins, then win rate
router.get('/', async (req, res) => {
  const { limit = 50 } = req.query;

  const players = await Player.find({ status: 'approved' })
    .sort({ 'stats.wins': -1, 'stats.gamesPlayed': 1 })
    .limit(Number(limit));

  const ranked = players.map((p, i) => ({
    rank: i + 1,
    _id: p._id,
    name: p.name,
    photo: p.photo,
    skillLevel: p.skillLevel,
    wins: p.stats.wins,
    losses: p.stats.losses,
    gamesPlayed: p.stats.gamesPlayed,
    tournamentsWon: p.stats.tournamentsWon,
    winRate: p.winRate,
  }));

  res.json(ranked);
});

module.exports = router;
