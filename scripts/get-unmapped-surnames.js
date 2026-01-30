require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load existing surname mappings
const surnameMapping = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/surname-mapping.json'), 'utf8'));
const mappedSurnames = new Set(surnameMapping.surnames.map(s => s.surname));

async function getUnmappedSurnames() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  await client.connect();
  
  console.log('🔍 Analyzing surnames across all divisions...\n');
  
  // Get all divisions we have data for
  const divisions = [29, 30, 31, 32, 33, 34, 42, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68];
  
  const results = {};
  
  for (const division of divisions) {
    console.log(`📊 Processing Division ${division}...`);
    
    // Extract surname from the LAST word of the name (actual surname)
    // Query ALL surnames by count for this division (no limit)
    const query = `
      SELECT 
        TRIM(REGEXP_REPLACE(name, '^.* ([^ ]+)$', '\\1')) as surname,
        COUNT(*) as count
      FROM voters
      WHERE zp_division_no = $1
        AND name IS NOT NULL
        AND TRIM(name) != ''
        AND name LIKE '% %'
      GROUP BY TRIM(REGEXP_REPLACE(name, '^.* ([^ ]+)$', '\\1'))
      HAVING COUNT(*) >= 10
      ORDER BY count DESC
    `;
    
    const surnamesInDivision = await client.query(query, [division]);
    
    // Filter out already mapped surnames - get ALL unmapped
    const unmapped = surnamesInDivision.rows
      .filter(s => !mappedSurnames.has(s.surname));
    
    results[division] = unmapped;
    
    console.log(`  ✅ Found ${unmapped.length} unmapped surnames\n`);
  }
  
  // Write results to file
  let output = '=' .repeat(80) + '\n';
  output += 'ALL UNMAPPED SURNAMES BY DIVISION (with 10+ voters)\n';
  output += '=' .repeat(80) + '\n\n';
  output += `Total Divisions Analyzed: ${divisions.length}\n`;
  output += `Currently Mapped Surnames: ${mappedSurnames.size}\n`;
  output += `Generated: ${new Date().toLocaleString()}\n\n`;
  output += '=' .repeat(80) + '\n\n';
  
  for (const division of divisions) {
    const unmapped = results[division];
    
    output += `📍 DIVISION ${division}\n`;
    output += '-'.repeat(80) + '\n';
    
    if (unmapped.length === 0) {
      output += '  ✓ All surnames (with 10+ voters) already mapped!\n\n';
    } else {
      output += `  Total unmapped: ${unmapped.length}\n\n`;
      unmapped.forEach((item, idx) => {
        output += `  ${(idx + 1).toString().padStart(3)}. ${item.surname.padEnd(30)} (${item.count} voters)\n`;
      });
      output += '\n';
    }
  }
  
  // Also create a consolidated list of unique unmapped surnames across all divisions
  output += '\n' + '='.repeat(80) + '\n';
  output += 'UNIQUE UNMAPPED SURNAMES (ACROSS ALL DIVISIONS)\n';
  output += '='.repeat(80) + '\n\n';
  
  const allUnmapped = new Map();
  for (const division of divisions) {
    results[division].forEach(item => {
      if (!allUnmapped.has(item.surname)) {
        allUnmapped.set(item.surname, { total: 0, divisions: [] });
      }
      allUnmapped.get(item.surname).total += parseInt(item.count);
      allUnmapped.get(item.surname).divisions.push(division);
    });
  }
  
  // Sort by total count
  const sortedUnmapped = Array.from(allUnmapped.entries())
    .sort((a, b) => b[1].total - a[1].total);
  
  output += `Total Unique Unmapped Surnames: ${sortedUnmapped.length}\n\n`;
  
  sortedUnmapped.forEach(([surname, data], idx) => {
    const divList = data.divisions.join(', ');
    output += `${(idx + 1).toString().padStart(3)}. ${surname.padEnd(30)} `;
    output += `(${data.total.toString().padStart(6)} voters across divisions: ${divList})\n`;
  });
  
  // Write to file
  const outputDir = path.join(__dirname, '../temp');
  const outputPath = path.join(outputDir, 'unmapped-surnames-by-division.txt');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, output, 'utf8');
  
  await client.end();
  
  console.log('\n✅ Analysis complete!');
  console.log(`📄 Results written to: ${outputPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Total Unique Unmapped Surnames: ${sortedUnmapped.length}`);
  console.log(`   - Already Mapped Surnames: ${mappedSurnames.size}`);
  console.log(`   - Divisions Analyzed: ${divisions.length}`);
}

// Run the analysis
getUnmappedSurnames()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
