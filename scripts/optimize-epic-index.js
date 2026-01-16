const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../data/epic-index.json');
const OUTPUT_FILE = path.join(__dirname, '../data/epic-index-optimized.json');

console.log('Loading epic-index.json...');
const epicData = require(INPUT_FILE);

console.log(`Processing ${Object.keys(epicData).length} EPICs...`);

// Build nested structure
const optimized = {
  metadata: {
    format: 'nested',
    version: 2,
    totalEpics: Object.keys(epicData).length,
    generatedAt: new Date().toISOString()
  },
  talukas: {}
};

for (const [epic, data] of Object.entries(epicData)) {
  const { taluka, division, divisionName, ward, wardName } = data;
  
  // Initialize taluka
  if (!optimized.talukas[taluka]) {
    optimized.talukas[taluka] = { divisions: {} };
  }
  
  // Initialize division
  if (!optimized.talukas[taluka].divisions[division]) {
    optimized.talukas[taluka].divisions[division] = {
      name: divisionName,
      wards: {}
    };
  }
  
  // Initialize ward
  if (!optimized.talukas[taluka].divisions[division].wards[ward]) {
    optimized.talukas[taluka].divisions[division].wards[ward] = {
      name: wardName,
      epics: []
    };
  }
  
  // Add EPIC
  optimized.talukas[taluka].divisions[division].wards[ward].epics.push(epic);
}

// Write optimized file
console.log('Writing optimized file...');
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(optimized), 'utf8');

// Get file sizes
const originalSize = fs.statSync(INPUT_FILE).size;
const optimizedSize = fs.statSync(OUTPUT_FILE).size;

console.log('\n✅ Optimization complete!');
console.log(`   Original:  ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Optimized: ${(optimizedSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`   Reduction: ${((1 - optimizedSize / originalSize) * 100).toFixed(1)}%`);
console.log(`\n   Output: ${OUTPUT_FILE}`);

