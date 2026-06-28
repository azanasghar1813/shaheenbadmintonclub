const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    pinned: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ['general', 'tournament', 'result', 'schedule', 'urgent'],
      default: 'general',
    },
  },
  { timestamps: true }
);

// Pinned first, then by creation date
announcementSchema.index({ pinned: -1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
