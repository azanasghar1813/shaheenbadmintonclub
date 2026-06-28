/**
 * bracketEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles bracket generation and winner advancement for both
 * 'knockout' and 'round-robin' tournament formats.
 */

const Match = require('../models/Match');
const Player = require('../models/Player');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Shuffle an array in place (Fisher-Yates) */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Next power of 2 ≥ n */
function nextPow2(n) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

// ── Knockout ──────────────────────────────────────────────────────────────────

/**
 * Generate a single-elimination knockout bracket.
 *
 * For N teams:
 *  - Pad to next power-of-2 with null (BYE) slots
 *  - Create all match documents with nextMatchId linkage
 *  - Teams with BYE auto-advance
 *
 * Returns the created Match documents.
 */
async function generateKnockout(tournamentId, teams) {
  const seeded = shuffle([...teams]);
  const size = nextPow2(seeded.length);
  // Pad with nulls (BYE)
  while (seeded.length < size) seeded.push(null);

  const totalRounds = Math.log2(size);
  let roundMatches = []; // array of Match docs per round, bottom-up

  // Build all rounds bottom → up so we can link nextMatchId
  const allRoundDocs = [];

  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = size / Math.pow(2, round);
    const roundDocs = [];
    for (let i = 0; i < matchesInRound; i++) {
      roundDocs.push(
        new Match({
          tournamentId,
          round,
          matchNumber: i + 1,
          status: 'scheduled',
        })
      );
    }
    allRoundDocs.push(roundDocs);
  }

  // Link nextMatchId for each round (except final)
  for (let r = 0; r < allRoundDocs.length - 1; r++) {
    const currentRound = allRoundDocs[r];
    const nextRound = allRoundDocs[r + 1];
    for (let i = 0; i < currentRound.length; i++) {
      const parentIndex = Math.floor(i / 2);
      currentRound[i].nextMatchId = nextRound[parentIndex]._id;
      currentRound[i].nextMatchSlot = i % 2 === 0 ? 1 : 2;
    }
  }

  // Assign teams to round-1 matches
  const round1Docs = allRoundDocs[0];
  for (let i = 0; i < round1Docs.length; i++) {
    const t1 = seeded[i * 2] || null;
    const t2 = seeded[i * 2 + 1] || null;
    round1Docs[i].team1 = t1 ? t1._id : null;
    round1Docs[i].team2 = t2 ? t2._id : null;

    // Handle BYE — auto-advance the non-null team
    if (t1 && !t2) {
      round1Docs[i].winner = t1._id;
      round1Docs[i].status = 'walkover';
    } else if (!t1 && t2) {
      round1Docs[i].winner = t2._id;
      round1Docs[i].status = 'walkover';
    }
  }

  // Save all matches
  const allMatches = allRoundDocs.flat();
  await Match.insertMany(allMatches.map((m) => m.toObject()));

  // Advance BYE winners immediately
  for (const m of round1Docs) {
    if (m.winner) {
      await advanceWinner(m._id, m.winner);
    }
  }

  return allMatches;
}

// ── Round Robin ───────────────────────────────────────────────────────────────

/**
 * Generate round-robin fixtures: every team plays every other team once.
 * Returns Match documents.
 */
async function generateRoundRobin(tournamentId, teams) {
  const matches = [];
  let matchNumber = 1;

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        tournamentId,
        team1: teams[i]._id,
        team2: teams[j]._id,
        round: 1, // all one round for RR
        matchNumber: matchNumber++,
        status: 'scheduled',
      });
    }
  }

  await Match.insertMany(matches);
  return matches;
}

// ── Score Entry + Advancement ─────────────────────────────────────────────────

/**
 * Advance the winner of a completed match into the next match slot.
 */
async function advanceWinner(matchId, winnerId) {
  const match = await Match.findById(matchId);
  if (!match || !match.nextMatchId) return;

  const update =
    match.nextMatchSlot === 1
      ? { team1: winnerId }
      : { team2: winnerId };

  await Match.findByIdAndUpdate(match.nextMatchId, update);
}

/**
 * Enter score for a match, determine winner, advance bracket (knockout).
 * Also updates player stats.
 */
async function enterScore(matchId, score1, score2) {
  const match = await Match.findById(matchId)
    .populate({ path: 'team1', populate: { path: 'players' } })
    .populate({ path: 'team2', populate: { path: 'players' } });

  if (!match) throw new Error('Match not found');
  if (match.status === 'completed') throw new Error('Match already completed');

  const winnerId = score1 > score2 ? match.team1._id : match.team2._id;
  const loserId  = score1 > score2 ? match.team2._id : match.team1._id;

  match.scores = { team1: score1, team2: score2 };
  match.winner = winnerId;
  match.status = 'completed';
  await match.save();

  // Update bracket (knockout only — nextMatchId is null for round-robin)
  if (match.nextMatchId) {
    await advanceWinner(matchId, winnerId);
  }

  // Update player stats
  const winningTeam = score1 > score2 ? match.team1 : match.team2;
  const losingTeam  = score1 > score2 ? match.team2 : match.team1;

  if (winningTeam?.players?.length) {
    await Player.updateMany(
      { _id: { $in: winningTeam.players.map((p) => p._id) } },
      { $inc: { 'stats.wins': 1, 'stats.gamesPlayed': 1 } }
    );
  }
  if (losingTeam?.players?.length) {
    await Player.updateMany(
      { _id: { $in: losingTeam.players.map((p) => p._id) } },
      { $inc: { 'stats.losses': 1, 'stats.gamesPlayed': 1 } }
    );
  }

  return match;
}

/**
 * Build bracket tree structure for frontend visualization.
 * Returns rounds as arrays of matches.
 */
async function getBracketTree(tournamentId) {
  const matches = await Match.find({ tournamentId })
    .populate('team1', 'name color')
    .populate('team2', 'name color')
    .populate('winner', 'name')
    .sort({ round: 1, matchNumber: 1 });

  const rounds = {};
  for (const m of matches) {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  }

  return rounds;
}

module.exports = { generateKnockout, generateRoundRobin, enterScore, getBracketTree };
