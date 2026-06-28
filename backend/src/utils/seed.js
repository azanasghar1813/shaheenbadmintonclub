/**
 * seed.js — Run once to create the admin account
 * Usage: npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const existing = await Admin.findOne({ username: process.env.ADMIN_USERNAME });
  if (existing) {
    console.log('⚠️  Admin already exists. Skipping seed.');
    process.exit(0);
  }

  const admin = new Admin({
    username: process.env.ADMIN_USERNAME || 'admin',
    passwordHash: process.env.ADMIN_PASSWORD || 'shaheen2024',
    isGeneral: true,
  });
  await admin.save();
  console.log(`✅ Admin created: ${admin.username}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
