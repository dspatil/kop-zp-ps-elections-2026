/**
 * Merge all ward composition JSON files into a single data file
 * for the Ward Map feature
 */

const fs = require('fs');
const path = require('path');

const wardDir = path.join(__dirname, '..', 'ward_composition_ZP_and_PS');
const outputFile = path.join(__dirname, '..', 'data', 'ward-composition.json');

// All PS files (12 talukas)
const psFiles = [
  'ajara-ps-gemini.json',
  'bhudargad-ps-gemini.json',
  'chandgad-ps-gemini.json',
  'gadhinglaj-ps-gemini.json',
  'gaganbavda-ps-gemini.json',
  'hatkanagale-ps-gemini.json',
  'kagal-ps-gemini.json',
  'karaveer-ps-gemini.json',
  'panhala-ps-gemini.json',
  'radhanagari-ps-gemini.json',
  'shahuwadi-ps-gemini.json',
  'shirole-ps-gemini.json'
];

// ZP file
const zpFile = 'kop-zp-gemini.json';

// Marathi to Arabic numeral conversion
function marathiToArabic(text) {
  const marathiDigits = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  let result = text;
  for (const [marathi, arabic] of Object.entries(marathiDigits)) {
    result = result.replace(new RegExp(marathi, 'g'), arabic);
  }
  return result;
}

// Extract number from division/ward name
function extractNumber(name) {
  const converted = marathiToArabic(name);
  const match = converted.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Extract name part (after the number)
function extractName(name) {
  // Remove leading number and separators
  return name.replace(/^[\d०-९]+[\s\-\.]+/, '').trim();
}

// Process ZP data
function processZP() {
  const filePath = path.join(wardDir, zpFile);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const zpDivisions = [];
  
  for (const division of data.election_divisions || []) {
    const divNum = extractNumber(division.division_no_and_name);
    const divName = extractName(division.division_no_and_name);
    
    zpDivisions.push({
      number: divNum,
      name: divName,
      fullName: division.division_no_and_name,
      taluka: division.taluka,
      villages: division.grampanchayats || []
    });
  }
  
  // Sort by number
  zpDivisions.sort((a, b) => a.number - b.number);
  
  return zpDivisions;
}

// Process PS data
function processPS() {
  const psTalukas = [];
  
  for (const file of psFiles) {
    const filePath = path.join(wardDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping missing file: ${file}`);
      continue;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const talukaName = data.taluka;
    
    const divisions = [];
    
    for (const division of data.election_divisions || []) {
      const divNum = extractNumber(division.division_no_and_name);
      const divName = extractName(division.division_no_and_name);
      
      const wards = [];
      
      for (const ward of division.wards || []) {
        const wardNum = extractNumber(ward.ward_no_and_name);
        const wardName = extractName(ward.ward_no_and_name);
        
        wards.push({
          number: wardNum,
          name: wardName,
          fullName: ward.ward_no_and_name,
          villages: ward.grampanchayats || []
        });
      }
      
      // Sort wards by number
      wards.sort((a, b) => a.number - b.number);
      
      divisions.push({
        number: divNum,
        name: divName,
        fullName: division.division_no_and_name,
        wards: wards
      });
    }
    
    // Sort divisions by number
    divisions.sort((a, b) => a.number - b.number);
    
    psTalukas.push({
      taluka: talukaName,
      divisions: divisions
    });
  }
  
  // Sort talukas alphabetically
  psTalukas.sort((a, b) => a.taluka.localeCompare(b.taluka, 'mr'));
  
  return psTalukas;
}

// Build village index for quick lookup
function buildVillageIndex(zpDivisions, psTalukas) {
  const index = {};
  
  // Index ZP villages
  for (const div of zpDivisions) {
    for (const village of div.villages) {
      const key = village.toLowerCase();
      if (!index[key]) {
        index[key] = { zp: null, ps: null };
      }
      index[key].zp = {
        divisionNumber: div.number,
        divisionName: div.name,
        taluka: div.taluka
      };
    }
  }
  
  // Index PS villages
  for (const taluka of psTalukas) {
    for (const div of taluka.divisions) {
      for (const ward of div.wards) {
        for (const village of ward.villages) {
          const key = village.toLowerCase();
          if (!index[key]) {
            index[key] = { zp: null, ps: null };
          }
          index[key].ps = {
            taluka: taluka.taluka,
            divisionNumber: div.number,
            divisionName: div.name,
            wardNumber: ward.number,
            wardName: ward.name
          };
        }
      }
    }
  }
  
  return index;
}

// Main
function main() {
  console.log('Processing ZP data...');
  const zpDivisions = processZP();
  console.log(`  Found ${zpDivisions.length} ZP divisions`);
  
  console.log('Processing PS data...');
  const psTalukas = processPS();
  console.log(`  Found ${psTalukas.length} talukas`);
  
  let totalWards = 0;
  for (const t of psTalukas) {
    for (const d of t.divisions) {
      totalWards += d.wards.length;
    }
  }
  console.log(`  Found ${totalWards} PS wards`);
  
  console.log('Building village index...');
  const villageIndex = buildVillageIndex(zpDivisions, psTalukas);
  console.log(`  Indexed ${Object.keys(villageIndex).length} unique villages`);
  
  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'Official Ward Composition PDFs',
      authority: 'जिल्हाधिकारी कोल्हापूर'
    },
    zp: {
      totalDivisions: zpDivisions.length,
      divisions: zpDivisions
    },
    ps: {
      totalTalukas: psTalukas.length,
      totalWards: totalWards,
      talukas: psTalukas
    },
    villageIndex: villageIndex
  };
  
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\nOutput written to: ${outputFile}`);
}

main();

