const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    seed: { type: Number, default: 0 }, // seeding order for brackets
    color: { type: String, default: '#3b82f6' }, // team color for UI
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
