const fs = require('fs');
const path = require('path');

// Input directory with voter CSVs
const VOTER_DATA_DIR = 'C:/Deepak/Workspace/personal-projects/voter-data-extraction/output';
const OUTPUT_FILE = path.join(__dirname, '../data/voter-stats.json');

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

function getAgeGroup(age) {
  const ageNum = parseInt(age);
  if (ageNum >= 18 && ageNum <= 21) return '18-21';
  if (ageNum >= 22 && ageNum <= 25) return '22-25';
  if (ageNum >= 26 && ageNum <= 35) return '26-35';
  if (ageNum >= 36 && ageNum <= 50) return '36-50';
  if (ageNum >= 51 && ageNum <= 65) return '51-65';
  if (ageNum > 65) return '65+';
  return 'Unknown';
}

function processVoterData() {
  const stats = {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'Official Voter List - Gadhinglaj Taluka',
      divisions: []
    },
    byDivision: {},
    byWard: {}
  };

  // Find all CSV files
  const files = fs.readdirSync(VOTER_DATA_DIR).filter(f => f.endsWith('.csv'));
  console.log(`Found ${files.length} CSV files to process`);

  let totalVoters = 0;

  files.forEach(file => {
    console.log(`\nProcessing: ${file}`);
    const content = fs.readFileSync(path.join(VOTER_DATA_DIR, file), 'utf8');
    const rows = parseCSV(content);
    console.log(`  Rows: ${rows.length}`);
    totalVoters += rows.length;

    rows.forEach(row => {
      const divisionKey = row.Prabhag || '';
      const wardKey = row.Nirvachan_Gan || '';
      const gender = row.Gender || '';
      const age = row.Age || '';
      const status = row.Status || '';

      // Skip if no division
      if (!divisionKey) return;

      // Extract division number
      const divMatch = divisionKey.match(/^(\d+)/);
      const divNum = divMatch ? parseInt(divMatch[1]) : 0;

      // Initialize division stats
      if (!stats.byDivision[divNum]) {
        stats.byDivision[divNum] = {
          divisionNumber: divNum,
          divisionName: divisionKey,
          taluka: 'गडहिंग्लज',
          total: 0,
          male: 0,
          female: 0,
          ageGroups: {
            '18-21': 0,
            '22-25': 0,
            '26-35': 0,
            '36-50': 0,
            '51-65': 0,
            '65+': 0
          },
          firstTimeVoters: 0,
          active: 0,
          wards: {}
        };
        stats.metadata.divisions.push(divNum);
      }

      const div = stats.byDivision[divNum];
      div.total++;

      // Gender
      if (gender === 'पुरुष') div.male++;
      else if (gender === 'स्त्री') div.female++;

      // Age groups
      const ageGroup = getAgeGroup(age);
      if (div.ageGroups[ageGroup] !== undefined) {
        div.ageGroups[ageGroup]++;
      }

      // First-time voters (18-21)
      const ageNum = parseInt(age);
      if (ageNum >= 18 && ageNum <= 21) {
        div.firstTimeVoters++;
      }

      // Active status
      if (status === 'Active') div.active++;

      // Ward-level stats
      if (wardKey) {
        const wardMatch = wardKey.match(/^(\d+)/);
        const wardNum = wardMatch ? parseInt(wardMatch[1]) : 0;
        
        if (!div.wards[wardNum]) {
          div.wards[wardNum] = {
            wardNumber: wardNum,
            wardName: wardKey,
            total: 0,
            male: 0,
            female: 0
          };
        }
        
        div.wards[wardNum].total++;
        if (gender === 'पुरुष') div.wards[wardNum].male++;
        else if (gender === 'स्त्री') div.wards[wardNum].female++;
      }
    });
  });

  // Calculate percentages
  Object.values(stats.byDivision).forEach(div => {
    div.malePercent = div.total > 0 ? Math.round((div.male / div.total) * 100) : 0;
    div.femalePercent = div.total > 0 ? Math.round((div.female / div.total) * 100) : 0;
    
    // Age group percentages
    div.ageGroupPercents = {};
    Object.entries(div.ageGroups).forEach(([group, count]) => {
      div.ageGroupPercents[group] = div.total > 0 ? Math.round((count / div.total) * 100) : 0;
    });
  });

  stats.metadata.totalVoters = totalVoters;
  stats.metadata.divisionsCount = stats.metadata.divisions.length;

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stats, null, 2), 'utf8');
  console.log(`\n✅ Output written to: ${OUTPUT_FILE}`);
  console.log(`   Total voters processed: ${totalVoters.toLocaleString()}`);
  console.log(`   Divisions: ${stats.metadata.divisions.join(', ')}`);

  // Summary
  console.log('\n📊 Summary by Division:');
  Object.values(stats.byDivision).forEach(div => {
    console.log(`   ${div.divisionName}: ${div.total.toLocaleString()} voters (M: ${div.malePercent}%, F: ${div.femalePercent}%)`);
  });
}

processVoterData();

