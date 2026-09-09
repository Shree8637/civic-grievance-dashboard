/**
 * Database setup script
 * Runs schema creation, ward seeding, and admin user seeding.
 * Usage: node src/setup-db.js
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./db');

async function setup() {
  try {
    console.log('Setting up database...\n');

    // 1. Run schema
    const schema = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'schema.sql'),
      'utf-8'
    );
    await pool.query(schema);
    console.log('✓ Schema created');

    // 2. Seed wards
    const wards = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'seed-wards.sql'),
      'utf-8'
    );
    await pool.query(wards);
    console.log('✓ Wards seeded');

    // 3. Seed admin user with proper bcrypt hash
    const passwordHash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO admin_users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['Admin User', 'admin@grievance.local', passwordHash, 'admin']
    );
    console.log('✓ Admin user seeded (admin@grievance.local / admin123)');

    console.log('\n✓ Database setup complete!');
  } catch (err) {
    console.error('✗ Setup failed:', err.message);
    if (err.message.includes('already exists')) {
      console.log('  (Tables may already exist — this is okay for re-runs)');
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

setup();
