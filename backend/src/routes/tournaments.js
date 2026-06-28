const express = require('express');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Match = require('../models/Match');
const { protect } = require('../middleware/auth');
const { generateKnockout, generateRoundRobin, getBracketTree } = require('../utils/bracketEngine');

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────

// GET /api/tournaments
router.get('/', async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const tournaments = await Tournament.find(filter).sort({ date: -1 });
  res.json(tournaments);
});

// GET /api/tournaments/:id
router.get('/:id', async (req, res) => {
  const tournament = await Tournament.findById(req.params.id).populate('winner');
  if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
  res.json(tournament);
});

// GET /api/tournaments/:id/teams
router.get('/:id/teams', async (req, res) => {
  const teams = await Team.find({ tournamentId: req.params.id }).populate('players', 'name photo skillLevel');
  res.json(teams);
});

// GET /api/tournaments/:id/bracket
router.get('/:id/bracket', async (req, res) => {
  const bracket = await getBracketTree(req.params.id);
  res.json(bracket);
});

// GET /api/tournaments/:id/schedule
router.get('/:id/schedule', async (req, res) => {
  const matches = await Match.find({ tournamentId: req.params.id })
    .populate('team1', 'name color')
    .populate('team2', 'name color')
    .populate('winner', 'name')
    .sort({ scheduledTime: 1, round: 1, matchNumber: 1 });
  res.json(matches);
});

// ── Admin ─────────────────────────────────────────────────────────────────────

// POST /api/tournaments  (protected)
router.post('/', protect, async (req, res) => {
  const { name, description, date, endDate, format, venue, maxTeams } = req.body;
  const tournament = await Tournament.create({ name, description, date, endDate, format, venue, maxTeams });
  res.status(201).json(tournament);
});

// PUT /api/tournaments/:id  (protected)
router.put('/:id', protect, async (req, res) => {
  const tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
  res.json(tournament);
});

// DELETE /api/tournaments/:id  (protected)
router.delete('/:id', protect, async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
  // Cascade delete teams + matches
  await Team.deleteMany({ tournamentId: tournament._id });
  await Match.deleteMany({ tournamentId: tournament._id });
  await tournament.deleteOne();
  res.json({ message: 'Tournament and all related data deleted' });
});

// POST /api/tournaments/:id/teams  (protected) — create a team
router.post('/:id/teams', protect, async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

  const { name, players, color } = req.body;
  const team = await Team.create({ tournamentId: req.params.id, name, players, color });
  res.status(201).json(await team.populate('players', 'name photo skillLevel'));
});

// PUT /api/tournaments/:id/teams/:teamId  (protected)
router.put('/:id/teams/:teamId', protect, async (req, res) => {
  const team = await Team.findOneAndUpdate(
    { _id: req.params.teamId, tournamentId: req.params.id },
    req.body,
    { new: true }
  ).populate('players', 'name photo skillLevel');
  if (!team) return res.status(404).json({ message: 'Team not found' });
  res.json(team);
});

// DELETE /api/tournaments/:id/teams/:teamId  (protected)
router.delete('/:id/teams/:teamId', protect, async (req, res) => {
  await Team.findOneAndDelete({ _id: req.params.teamId, tournamentId: req.params.id });
  res.json({ message: 'Team deleted' });
});

// POST /api/tournaments/:id/generate  (protected) — generate bracket/schedule
router.post('/:id/generate', protect, async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
  if (tournament.bracketGenerated) {
    return res.status(400).json({ message: 'Bracket already generated. Delete matches first to regenerate.' });
  }

  const teams = await Team.find({ tournamentId: req.params.id });
  if (teams.length < 2) {
    return res.status(400).json({ message: 'Need at least 2 teams to generate a bracket' });
  }

  let matches;
  if (tournament.format === 'knockout') {
    matches = await generateKnockout(tournament._id, teams);
  } else {
    matches = await generateRoundRobin(tournament._id, teams);
  }

  tournament.bracketGenerated = true;
  tournament.status = 'active';
  await tournament.save();

  res.json({ message: 'Bracket generated', matchCount: matches.length });
});

module.exports = router;
