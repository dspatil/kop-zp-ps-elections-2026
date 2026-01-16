const fs = require('fs');
const path = require('path');

// Input directory with voter CSVs
const VOTER_DATA_DIR = 'C:/Deepak/Workspace/personal-projects/voter-data-extraction/output';
const OUTPUT_FILE = path.join(__dirname, '../data/epic-index.json');

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || '';
    });
    rows.push(row);
  }
  return rows;
}

function buildEpicIndex() {
  const epicIndex = {};
  
  // Find all CSV files
  const files = fs.readdirSync(VOTER_DATA_DIR).filter(f => f.endsWith('.csv'));
  console.log(`Processing ${files.length} CSV files for EPIC index...`);

  let totalEpics = 0;

  files.forEach(file => {
    console.log(`  Reading: ${file}`);
    const content = fs.readFileSync(path.join(VOTER_DATA_DIR, file), 'utf8');
    const rows = parseCSV(content);

    rows.forEach(row => {
      const epic = (row.EPIC_ID || row.EPIC_No || row.epic || '').trim().toUpperCase();
      const divisionKey = row.Prabhag || '';
      const wardKey = row.Nirvachan_Gan || '';

      if (!epic || epic === 'NA' || epic === 'N/A' || epic === '') return;

      // Extract numbers
      const divMatch = divisionKey.match(/^(\d+)/);
      const wardMatch = wardKey.match(/^(\d+)/);
      
      if (divMatch && wardMatch) {
        const divNum = parseInt(divMatch[1]);
        const wardNum = parseInt(wardMatch[1]);
        
        epicIndex[epic] = {
          division: divNum,
          divisionName: divisionKey,
          ward: wardNum,
          wardName: wardKey,
          taluka: 'गडहिंग्लज'
        };
        totalEpics++;
      }
    });
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(epicIndex, null, 2));
  console.log(`\n✅ EPIC Index created: ${OUTPUT_FILE}`);
  console.log(`   Total unique EPICs indexed: ${Object.keys(epicIndex).length}`);
}

buildEpicIndex();

