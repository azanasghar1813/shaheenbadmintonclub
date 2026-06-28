const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    photo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    skillLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
      default: 'Intermediate',
    },
    position: { type: String, default: '' }, // e.g. Singles, Doubles, Mixed
    phone: { type: String, default: '' },
    stats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      gamesPlayed: { type: Number, default: 0 },
      tournamentsPlayed: { type: Number, default: 0 },
      tournamentsWon: { type: Number, default: 0 },
    },
    joinedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'restricted'], default: 'approved' },
  },
  { timestamps: true }
);

// Virtual win rate
playerSchema.virtual('winRate').get(function () {
  if (this.stats.gamesPlayed === 0) return 0;
  return ((this.stats.wins / this.stats.gamesPlayed) * 100).toFixed(1);
});

playerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Player', playerSchema);
