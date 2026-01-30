require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function checkVillageCoverage() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('🔍 Checking Mahagaon village coverage...\n');

    // Read existing surname mapping
    const mappingPath = path.join(__dirname, '../data/surname-mapping.json');
    const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    const mappedSurnamesSet = new Set(mappingData.surnames.map(s => s.surname));

    console.log(`📊 Total mapped surnames: ${mappedSurnamesSet.size}\n`);

    // Get all surnames from Mahagaon
    const query = `
      SELECT 
        TRIM(SPLIT_PART(name, ' ', 1)) as surname,
        COUNT(*) as voter_count
      FROM voters
      WHERE village = 'महागांव'
        AND TRIM(SPLIT_PART(name, ' ', 1)) != ''
      GROUP BY TRIM(SPLIT_PART(name, ' ', 1))
      ORDER BY voter_count DESC
      LIMIT 100;
    `;

    const result = await client.query(query);
    
    let totalVoters = 0;
    let mappedVoters = 0;
    let unmappedVoters = 0;
    const unmappedSurnames = [];

    for (const row of result.rows) {
      const surname = row.surname;
      const count = parseInt(row.voter_count);
      totalVoters += count;

      if (mappedSurnamesSet.has(surname)) {
        mappedVoters += count;
      } else {
        unmappedVoters += count;
        unmappedSurnames.push({ surname, count });
      }
    }

    console.log('📊 Mahagaon Coverage Summary:');
    console.log(`   Total voters analyzed: ${totalVoters}`);
    console.log(`   Mapped voters: ${mappedVoters} (${((mappedVoters/totalVoters)*100).toFixed(1)}%)`);
    console.log(`   Unmapped voters: ${unmappedVoters} (${((unmappedVoters/totalVoters)*100).toFixed(1)}%)`);
    console.log(`\n📋 Top unmapped surnames in Mahagaon:\n`);

    unmappedSurnames.slice(0, 50).forEach((item, idx) => {
      console.log(`${String(idx + 1).padStart(3)}. ${item.surname.padEnd(30)} (${item.count} voters)`);
    });

    // Get total voters in village
    const totalQuery = `
      SELECT COUNT(*) as total FROM voters WHERE village = 'महागांव';
    `;
    const totalResult = await client.query(totalQuery);
    console.log(`\n💡 Total voters in Mahagaon: ${totalResult.rows[0].total}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkVillageCoverage();
