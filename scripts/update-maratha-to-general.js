const fs = require('fs');
const path = require('path');

const mappingPath = path.join(__dirname, '..', 'data', 'surname-mapping.json');

console.log('Reading surname mapping file...');
const data = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

let updateCount = 0;

// Update all Maratha entries to General
data.surnames = data.surnames.map(entry => {
  if (entry.community === 'Maratha' || entry.communityMr === 'मराठा') {
    updateCount++;
    return {
      ...entry,
      community: 'General',
      communityMr: 'सर्वसाधारण'
    };
  }
  return entry;
});

console.log(`Updated ${updateCount} surnames from Maratha to General (सर्वसाधारण)`);

// Write back to file
fs.writeFileSync(mappingPath, JSON.stringify(data, null, 2), 'utf8');
console.log('File updated successfully!');
