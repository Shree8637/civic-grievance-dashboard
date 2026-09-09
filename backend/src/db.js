const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('✓ PostgreSQL connected'))
  .catch((err) => console.error('✗ PostgreSQL connection error:', err.message));

module.exports = pool;
