const fs = require('fs');
const path = require('path');

// Load both files
const officialData = require('../data/voter-stats-official.json');
const csvData = require('../data/voter-stats.json');

// Merge: Use official counts for male/female, but add age groups from CSV
const mergedData = {
  metadata: {
    ...officialData.metadata,
    note: "Official male/female counts merged with CSV age distribution"
  },
  byDivision: {}
};

for (const divNum in officialData.byDivision) {
  const official = officialData.byDivision[divNum];
  const csv = csvData.byDivision[divNum];
  
  mergedData.byDivision[divNum] = {
    divisionNumber: parseInt(divNum),
    divisionName: official.divisionName,
    taluka: official.taluka,
    total: official.total,
    male: official.male,
    female: official.female,
    other: official.other || 0,
    malePercent: official.malePercent,
    femalePercent: official.femalePercent,
    // Add age data from CSV
    ageGroups: official.ageGroups || csv?.ageGroups || {},
    ageGroupPercents: official.ageGroupPercents || csv?.ageGroupPercents || {},
    firstTimeVoters: official.firstTimeVoters || csv?.firstTimeVoters || 0,
    // Add ward-level data WITH age groups from CSV
    wardsDetailed: {}
  };
  
  // Process wards with OFFICIAL counts + CSV age groups
  if (official.wards && csv?.wards) {
    for (const wardKey in official.wards) {
      const officialWard = official.wards[wardKey];
      const csvWard = csv.wards[wardKey];
      
      if (!officialWard || !csvWard) continue;
      
      // Calculate age groups for ward from CSV
      const wardAgeGroups = {};
      let wardFirstTimeVoters = 0;
      
      // Use CSV total to get age distribution percentage, then apply to official total
      if (csvWard.total > 0 && csv.byDivision[divNum]) {
        const divAge = csv.byDivision[divNum].ageGroups || {};
        for (const ageRange in divAge) {
          // Proportionally distribute division age groups to this ward based on ward size
          const wardRatio = csvWard.total / csv.byDivision[divNum].total;
          wardAgeGroups[ageRange] = Math.round(divAge[ageRange] * wardRatio);
        }
        wardFirstTimeVoters = Math.round((csv.byDivision[divNum].firstTimeVoters || 0) * wardRatio);
      }
      
      mergedData.byDivision[divNum].wardsDetailed[wardKey] = {
        wardNumber: officialWard.wardNumber,
        wardName: officialWard.wardName,
        total: officialWard.total,
        male: officialWard.male,
        female: officialWard.female,
        other: officialWard.other || 0,
        malePercent: Math.round((officialWard.male / officialWard.total) * 100),
        femalePercent: Math.round((officialWard.female / officialWard.total) * 100),
        ageGroups: wardAgeGroups,
        firstTimeVoters: wardFirstTimeVoters
      };
    }
  }
}

// Write merged file
const outputPath = path.join(__dirname, '../data/voter-stats-merged.json');
fs.writeFileSync(outputPath, JSON.stringify(mergedData, null, 2));
console.log('✅ Merged voter data written to:', outputPath);
console.log('   Using OFFICIAL male/female/other counts from screenshots');
console.log('   Added age groups from CSV extraction');
console.log('   Calculated ward-level age groups proportionally');
console.log('\nDivisions processed:', Object.keys(mergedData.byDivision).join(', '));


