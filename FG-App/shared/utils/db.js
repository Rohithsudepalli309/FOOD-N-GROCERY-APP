const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fg_user:fg_pass@localhost:5432/fg_db',
  // In production, you might want strict SSL depending on your cloud provider
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle pg client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
