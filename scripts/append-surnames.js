const fs = require('fs');
const path = require('path');

// Read existing mapping
const mappingPath = path.join(__dirname, '../data/surname-mapping.json');
const existingMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// Read new surnames
const newSurnamesPath = path.join(__dirname, '../temp/parsed-surnames.json');
const newSurnames = JSON.parse(fs.readFileSync(newSurnamesPath, 'utf8'));

console.log(`📊 Current surnames: ${existingMapping.surnames.length}`);
console.log(`📊 New surnames to add: ${newSurnames.length}`);

// Check for duplicates
const existingSurnamesSet = new Set(existingMapping.surnames.map(s => s.surname));
const duplicates = [];
const toAdd = [];

for (const surname of newSurnames) {
  if (existingSurnamesSet.has(surname.surname)) {
    duplicates.push(surname.surname);
  } else {
    toAdd.push(surname);
  }
}

if (duplicates.length > 0) {
  console.log(`\n⚠️  Found ${duplicates.length} duplicates (will skip):`);
  duplicates.slice(0, 10).forEach(s => console.log(`   - ${s}`));
  if (duplicates.length > 10) console.log(`   ... and ${duplicates.length - 10} more`);
}

console.log(`\n✅ Adding ${toAdd.length} new surnames`);

// Append new surnames
existingMapping.surnames.push(...toAdd);

// Write back
fs.writeFileSync(mappingPath, JSON.stringify(existingMapping, null, 2), 'utf8');

console.log(`\n📄 Updated mapping file:`);
console.log(`   Total surnames: ${existingMapping.surnames.length}`);
console.log(`   File: ${mappingPath}`);
