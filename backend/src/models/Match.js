const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    team1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    team2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    scores: {
      team1: { type: Number, default: 0 },
      team2: { type: Number, default: 0 },
    },
    court: { type: String, default: '' },
    scheduledTime: { type: Date, default: null },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'walkover'],
      default: 'scheduled',
    },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    // Bracket positioning
    round: { type: Number, default: 1 },          // 1 = QF, 2 = SF, 3 = Final (knockout)
    matchNumber: { type: Number, default: 1 },     // position within the round
    nextMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null }, // winner advances here
    nextMatchSlot: { type: Number, enum: [1, 2], default: 1 }, // team1 or team2 slot
    // Strategy notes (admin only)
    strategyNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
