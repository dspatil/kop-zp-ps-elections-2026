require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function sampleNames() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  await client.connect();
  
  console.log('🔍 Fetching sample names from database...\n');
  
  // Get 50 random names
  const query = `
    SELECT name, zp_division_no, village 
    FROM voters 
    WHERE name IS NOT NULL 
      AND TRIM(name) != ''
      AND zp_division_no = 29
    ORDER BY RANDOM()
    LIMIT 50
  `;
  
  const result = await client.query(query);
  
  console.log('Sample Names (Division 29):\n');
  console.log('='.repeat(100));
  
  result.rows.forEach((row, idx) => {
    const words = row.name.split(' ').filter(w => w.trim());
    const wordCount = words.length;
    
    console.log(`${(idx + 1).toString().padStart(2)}. ${row.name.padEnd(50)} [${wordCount} words]`);
  });
  
  console.log('\n' + '='.repeat(100));
  console.log('\nWord position analysis:');
  console.log('='.repeat(100));
  
  // Analyze word positions
  const wordCounts = {};
  result.rows.forEach(row => {
    const words = row.name.split(' ').filter(w => w.trim());
    const count = words.length;
    wordCounts[count] = (wordCounts[count] || 0) + 1;
  });
  
  console.log('\nName word count distribution:');
  Object.keys(wordCounts).sort().forEach(count => {
    const percentage = ((wordCounts[count] / result.rows.length) * 100).toFixed(1);
    console.log(`  ${count} words: ${wordCounts[count].toString().padStart(2)} names (${percentage}%)`);
  });
  
  await client.end();
}

sampleNames()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
