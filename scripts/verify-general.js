const fs = require('fs');
const path = require('path');

const mappingPath = path.join(__dirname, '..', 'data', 'surname-mapping.json');
const data = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

const general = data.surnames.filter(s => s.community === 'General');
const maratha = data.surnames.filter(s => s.community === 'Maratha');

console.log(`Total General entries: ${general.length}`);
console.log(`Remaining Maratha entries: ${maratha.length}`);
console.log('\nSample General entries:');
general.slice(0, 5).forEach(s => {
  console.log(`  ${s.surname} -> ${s.community} / ${s.communityMr}`);
});
