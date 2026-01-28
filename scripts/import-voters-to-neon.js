/**
 * Import voter CSV data to Neon PostgreSQL
 * 
 * Usage: 
 *   node scripts/import-voters-to-neon.js                    (imports 61-64)
 *   node scripts/import-voters-to-neon.js 60                 (imports specific division)
 *   node scripts/import-voters-to-neon.js 60 --replace       (deletes div 60 first, then imports)
 *   node scripts/import-voters-to-neon.js path/to/file.csv   (imports specific file)
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// CSV files location (voter-data-extraction output folder)
const CSV_BASE_PATH = path.resolve(__dirname, '../../voter-data-extraction/output');

// Marathi numeral to integer conversion
const marathiToInt = {
  '०': 0, '१': 1, '२': 2, '३': 3, '४': 4,
  '५': 5, '६': 6, '७': 7, '८': 8, '९': 9
};

function convertMarathiNumber(str) {
  if (!str || str.trim() === '') return null;
  
  // If already contains Arabic numerals
  if (/^\d+$/.test(str.trim())) {
    return parseInt(str.trim(), 10);
  }
  
  // Convert Marathi numerals
  let result = '';
  for (const char of str.trim()) {
    if (marathiToInt[char] !== undefined) {
      result += marathiToInt[char];
    } else if (/\d/.test(char)) {
      result += char;
    }
  }
  
  return result ? parseInt(result, 10) : null;
}

function extractNumber(str) {
  if (!str) return null;
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

async function importFile(client, filePath) {
  console.log(`\n📂 Processing: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found!`);
    return { inserted: 0, errors: 0 };
  }
  
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lineCount = 0;
  let insertedCount = 0;
  let errorCount = 0;
  let batch = [];
  const BATCH_SIZE = 500;
  
  const insertBatch = async () => {
    if (batch.length === 0) return;
    
    const values = [];
    const placeholders = [];
    let paramIndex = 1;
    
    for (const row of batch) {
      placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11})`);
      values.push(
        row.epic_id,
        row.name,
        row.age,
        row.gender,
        row.zp_division,
        row.zp_division_no,
        row.ps_ward,
        row.ps_ward_no,
        row.village,
        row.section,
        row.ac_no,
        row.serial_number
      );
      paramIndex += 12;
    }
    
    const query = `
      INSERT INTO voters (epic_id, name, age, gender, zp_division, zp_division_no, ps_ward, ps_ward_no, village, section, ac_no, serial_number)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT DO NOTHING
    `;
    
    try {
      await client.query(query, values);
      insertedCount += batch.length;
    } catch (err) {
      console.error(`  ❌ Batch insert error:`, err.message);
      errorCount += batch.length;
    }
    
    batch = [];
  };
  
  for await (const line of rl) {
    lineCount++;
    
    // Skip header
    if (lineCount === 1) continue;
    
    // Skip empty lines
    if (!line.trim()) continue;
    
    try {
      const columns = parseCSVLine(line);
      
      // Expected: Prabhag,Gan,SerialNumber,AC_No,EPIC_ID,Name,Age,Gender,Village,Status
      // Note: Section column has been removed from CSVs
      if (columns.length < 9) {
        errorCount++;
        continue;
      }
      
      const [prabhag, gan, serialNumber, acNo, epicId, name, age, gender, village, status] = columns;
      
      // Skip only records with invalid EPIC IDs
      if (!epicId || epicId.length < 5) continue;
      
      batch.push({
        epic_id: epicId,
        name: name || null,
        age: convertMarathiNumber(age),
        gender: gender || null,
        zp_division: prabhag || null,
        zp_division_no: extractNumber(prabhag),
        ps_ward: gan || null,
        ps_ward_no: extractNumber(gan),
        village: village || null,
        section: null,  // Section column removed from CSV
        ac_no: convertMarathiNumber(acNo) || extractNumber(acNo),
        serial_number: serialNumber || null
      });
      
      if (batch.length >= BATCH_SIZE) {
        await insertBatch();
        process.stdout.write(`  📊 Processed: ${lineCount.toLocaleString()} lines, Inserted: ${insertedCount.toLocaleString()}\r`);
      }
      
    } catch (err) {
      errorCount++;
    }
  }
  
  // Insert remaining batch
  await insertBatch();
  
  console.log(`\n  ✅ File complete: ${insertedCount.toLocaleString()} inserted, ${errorCount} errors`);
  return { inserted: insertedCount, errors: errorCount };
}

async function main() {
  const args = process.argv.slice(2);
  let files = [];
  let replaceMode = false;
  let divisionToReplace = null;
  
  // Check for --replace flag
  const replaceIndex = args.indexOf('--replace');
  if (replaceIndex !== -1) {
    replaceMode = true;
    args.splice(replaceIndex, 1);
  }
  
  if (args.length === 0) {
    // Default: import 61-64 (skip 60)
    files = [
      path.join(CSV_BASE_PATH, 'voter_data_61.csv'),
      path.join(CSV_BASE_PATH, 'voter_data_62.csv'),
      path.join(CSV_BASE_PATH, 'voter_data_63.csv'),
      path.join(CSV_BASE_PATH, 'voter_data_64.csv')
    ];
  } else if (args[0].match(/^\d+$/)) {
    // Single division number (e.g., "60")
    divisionToReplace = args[0];
    files = [path.join(CSV_BASE_PATH, `voter_data_${args[0]}.csv`)];
  } else {
    // Full file path(s)
    files = args.map(f => path.resolve(f));
  }
  
  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local file');
    console.error('   Create .env.local with: DATABASE_URL=your_connection_string');
    process.exit(1);
  }
  
  console.log('🚀 Neon Voter Data Import');
  console.log('========================');
  console.log(`📁 CSV Source: ${CSV_BASE_PATH}`);
  
  // Connect to Neon
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('\n🔌 Connecting to Neon...');
    await client.connect();
    console.log('✅ Connected!');
    
    // Check current count
    const countResult = await client.query('SELECT COUNT(*) FROM voters');
    console.log(`📊 Current records in DB: ${parseInt(countResult.rows[0].count).toLocaleString()}`);
    
    // If --replace mode, delete existing records for this division first
    if (replaceMode && divisionToReplace) {
      console.log(`\n🗑️  Deleting existing records for division ${divisionToReplace}...`);
      const deleteResult = await client.query(
        'DELETE FROM voters WHERE zp_division_no = $1',
        [parseInt(divisionToReplace)]
      );
      console.log(`✅ Deleted ${deleteResult.rowCount.toLocaleString()} records`);
      
      // Show updated count
      const afterDeleteCount = await client.query('SELECT COUNT(*) FROM voters');
      console.log(`📊 Records after delete: ${parseInt(afterDeleteCount.rows[0].count).toLocaleString()}`);
    }
    
    let totalInserted = 0;
    let totalErrors = 0;
    
    for (const filePath of files) {
      const result = await importFile(client, filePath);
      totalInserted += result.inserted;
      totalErrors += result.errors;
    }
    
    // Final count
    const finalCount = await client.query('SELECT COUNT(*) FROM voters');
    
    console.log('\n========================');
    console.log('📊 Import Summary');
    console.log('========================');
    console.log(`  Total inserted: ${totalInserted.toLocaleString()}`);
    console.log(`  Total errors: ${totalErrors}`);
    console.log(`  Records in DB: ${parseInt(finalCount.rows[0].count).toLocaleString()}`);
    
  } catch (err) {
    console.error('❌ Database error:', err.message);
  } finally {
    await client.end();
    console.log('\n👋 Disconnected from Neon');
  }
}

main();

