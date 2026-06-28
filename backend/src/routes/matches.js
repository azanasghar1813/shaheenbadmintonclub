const express = require('express');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Announcement = require('../models/Announcement');
const { protect } = require('../middleware/auth');
const { enterScore } = require('../utils/bracketEngine');

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────

// GET /api/matches/:id
router.get('/:id', async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate('team1', 'name color players')
    .populate('team2', 'name color players')
    .populate('winner', 'name');
  if (!match) return res.status(404).json({ message: 'Match not found' });
  res.json(match);
});

// GET /api/matches  — today's matches or all
router.get('/', async (req, res) => {
  const { today, tournamentId, status } = req.query;
  const filter = {};
  if (tournamentId) filter.tournamentId = tournamentId;
  if (status) filter.status = status;
  if (today === 'true') {
    const start = new Date(); start.setHours(0,0,0,0);
    const end   = new Date(); end.setHours(23,59,59,999);
    filter.scheduledTime = { $gte: start, $lte: end };
  }

  const matches = await Match.find(filter)
    .populate('team1', 'name color')
    .populate('team2', 'name color')
    .populate('winner', 'name')
    .populate('tournamentId', 'name format')
    .sort({ scheduledTime: 1, round: 1, matchNumber: 1 });
  res.json(matches);
});

// ── Admin ─────────────────────────────────────────────────────────────────────

// POST /api/matches/daily-schedule (protected)
router.post('/daily-schedule', protect, async (req, res) => {
  const { teams, matches, announce } = req.body;
  if (!teams || !matches) return res.status(400).json({ message: 'Missing teams or matches array' });

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const tournament = await Tournament.create({
    name: `Daily Matches - ${dateStr}`,
    date: new Date(),
    format: 'round-robin',
    status: 'active'
  });

  const createdTeams = [];
  for (let i = 0; i < teams.length; i++) {
    const t = await Team.create({
      tournamentId: tournament._id,
      name: teams[i].name,
      players: teams[i].playerIds
    });
    createdTeams.push(t);
  }

  let scheduleText = `🏸 Match Schedule for ${dateStr} 🏸\n\n`;
  const createdMatches = [];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const team1 = createdTeams[m.team1Index];
    const team2 = createdTeams[m.team2Index];
    
    const match = await Match.create({
      tournamentId: tournament._id,
      team1: team1._id,
      team2: team2._id,
      status: 'scheduled',
      scheduledTime: new Date(),
      round: 1,
      matchNumber: i + 1
    });
    createdMatches.push(match);
    scheduleText += `- Match ${i + 1}: ${team1.name} vs ${team2.name}\n`;
  }

  if (announce) {
    await Announcement.create({
      title: `🏸 Match Schedule - ${dateStr}`,
      body: scheduleText,
      category: 'schedule',
      pinned: false
    });
  }

  res.status(201).json({ message: 'Schedule generated successfully', tournament, matches: createdMatches });
});

// PUT /api/matches/:id/score  (protected)
router.put('/:id/score', protect, async (req, res) => {
  const { score1, score2 } = req.body;
  if (score1 === undefined || score2 === undefined) {
    return res.status(400).json({ message: 'score1 and score2 are required' });
  }

  const match = await enterScore(req.params.id, Number(score1), Number(score2));

  // If this is the final match (no nextMatchId), mark tournament completed
  if (!match.nextMatchId) {
    const tournament = await Tournament.findById(match.tournamentId);
    if (tournament) {
      // Check if all matches completed
      const pendingMatches = await Match.countDocuments({
        tournamentId: match.tournamentId,
        status: { $in: ['scheduled', 'in_progress'] },
      });
      if (pendingMatches === 0) {
        tournament.status = 'completed';
        tournament.winner = match.winner;
        await tournament.save();

        // Update tournament winners' stats
        const winnerTeam = await Team.findById(match.winner).populate('players');
        if (winnerTeam?.players?.length) {
          const Player = require('../models/Player');
          await Player.updateMany(
            { _id: { $in: winnerTeam.players.map((p) => p._id) } },
            { $inc: { 'stats.tournamentsWon': 1 } }
          );
        }
      }
    }
  }

  const updated = await Match.findById(match._id)
    .populate('team1', 'name color')
    .populate('team2', 'name color')
    .populate('winner', 'name');
  res.json(updated);
});

// PUT /api/matches/:id/schedule  (protected) — set court + time
router.put('/:id/schedule', protect, async (req, res) => {
  const { court, scheduledTime, status } = req.body;
  const match = await Match.findByIdAndUpdate(
    req.params.id,
    { ...(court !== undefined && { court }), ...(scheduledTime && { scheduledTime }), ...(status && { status }) },
    { new: true }
  ).populate('team1', 'name').populate('team2', 'name');
  if (!match) return res.status(404).json({ message: 'Match not found' });
  res.json(match);
});

// PUT /api/matches/:id/strategy  (protected)
router.put('/:id/strategy', protect, async (req, res) => {
  const { strategyNotes } = req.body;
  const match = await Match.findByIdAndUpdate(
    req.params.id,
    { strategyNotes },
    { new: true }
  );
  if (!match) return res.status(404).json({ message: 'Match not found' });
  res.json(match);
});

module.exports = router;
