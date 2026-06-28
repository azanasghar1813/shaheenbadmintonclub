const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: Date, required: true },
    endDate: { type: Date },
    format: {
      type: String,
      enum: ['knockout', 'round-robin'],
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'upcoming',
    },
    venue: { type: String, default: '' },
    maxTeams: { type: Number, default: 8 },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    bracketGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tournament', tournamentSchema);
