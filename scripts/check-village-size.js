const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkVillageSizes() {
  try {
    const result = await pool.query(`
      SELECT village, COUNT(*) as c 
      FROM voters 
      GROUP BY village 
      ORDER BY c DESC 
      LIMIT 5;
    `);
    console.log('Top 5 largest villages:');
    console.table(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkVillageSizes();
