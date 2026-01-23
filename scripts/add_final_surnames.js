const fs = require('fs');
const path = require('path');

// Parse the final surname file
function parseFinalSurnames() {
  const content = fs.readFileSync(
    path.join(__dirname, '../newSurnameaddition-final'),
    'utf-8'
  );
  
  const lines = content.trim().split('\n');
  const surnames = [];
  const seenSurnames = new Set();
  const duplicates = [];
  
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    
    // Parse format: सुतार -- हिंदू (Hindu) -- सुतार / ओबीसी
    const parts = line.split('--').map(p => p.trim());
    
    if (parts.length < 3) {
      console.warn(`⚠️  Line ${index + 1}: Invalid format - "${line}"`);
      return;
    }
    
    const surname = parts[0].trim();
    
    // Check for duplicates
    if (seenSurnames.has(surname)) {
      duplicates.push({
        surname,
        line: index + 1,
        content: line
      });
      return;
    }
    seenSurnames.add(surname);
    
    // Extract religion
    const religionMatch = parts[1].match(/(.+?)\s*\(([^)]+)\)/);
    if (!religionMatch) {
      console.warn(`⚠️  Line ${index + 1}: Could not parse religion - "${parts[1]}"`);
      return;
    }
    
    const religionMr = religionMatch[1].trim();
    const religion = religionMatch[2].trim();
    
    // Extract community (may have multiple parts)
    let communityStr = parts[2].trim();
    
    // Handle cases like "सुतार / ओबीसी" or "अनुसूचित जाती"
    let communityMr, community;
    
    // Map Marathi to English
    const religionMap = {
      'हिंदू': 'Hindu',
      'बौद्ध': 'Buddhist',
      'मुस्लिम': 'Muslim',
      'ख्रिश्चन': 'Christian',
      'जैन': 'Jain',
      'शीख': 'Sikh'
    };
    
    const communityMap = {
      'मराठा': 'Maratha',
      'ओबीसी': 'OBC',
      'ब्राह्मण': 'Brahmin',
      'अनुसूचित जाती': 'SC',
      'एनटी': 'NT',
      'लिंगायत': 'Lingayat',
      'मुस्लिम': 'Muslim',
      'ख्रिश्चन': 'Christian',
      'जैन': 'Jain',
      'जैन/वाणिया': 'Jain/Vaishya',
      'मारवाडी जैन': 'Marwadi Jain',
      'शीख': 'Sikh'
    };
    
    // Simple mapping for communities
    if (communityMap[communityStr]) {
      communityMr = communityStr;
      community = communityMap[communityStr];
    } else {
      // Default to the string itself
      communityMr = communityStr;
      community = communityStr;
    }
    
    surnames.push({
      surname,
      religion: religionMap[religionMr] || religion,
      religionMr,
      community,
      communityMr
    });
  });
  
  return { surnames, duplicates };
}

// Load existing mapping
function loadExistingMapping() {
  const mappingPath = path.join(__dirname, '../data/surname-mapping.json');
  const content = fs.readFileSync(mappingPath, 'utf-8');
  return JSON.parse(content);
}

// Main function
function main() {
  console.log('🔍 Parsing final surname list...\n');
  
  const { surnames: newSurnames, duplicates } = parseFinalSurnames();
  
  // Report duplicates
  if (duplicates.length > 0) {
    console.log('⚠️  DUPLICATES FOUND:');
    console.log('=' .repeat(70));
    duplicates.forEach(dup => {
      console.log(`Line ${dup.line}: ${dup.surname}`);
      console.log(`  Content: ${dup.content}`);
    });
    console.log('\n❌ Please resolve duplicates before adding to mapping!\n');
    console.log('Suggestion for मगदूम:');
    console.log('  - Line 30: मगदूम -- हिंदू (Hindu) -- मराठा [DELETE]');
    console.log('  - Line 86: मगदूम -- जैन (Jain) -- जैन [KEEP or change to Muslim?]');
    console.log('\n');
  }
  
  console.log(`✅ Parsed ${newSurnames.length} surnames from newSurnameaddition-final\n`);
  
  // Load existing
  const existingMapping = loadExistingMapping();
  const existingSurnamesSet = new Set(
    existingMapping.surnames.map(s => s.surname)
  );
  
  console.log(`📊 Current mapping has ${existingMapping.surnames.length} surnames\n`);
  
  // Identify new vs existing
  const toAdd = newSurnames.filter(s => !existingSurnamesSet.has(s.surname));
  const alreadyExists = newSurnames.filter(s => existingSurnamesSet.has(s.surname));
  
  console.log('📈 ANALYSIS:');
  console.log('=' .repeat(70));
  console.log(`New surnames to add:     ${toAdd.length}`);
  console.log(`Already in mapping:      ${alreadyExists.length}`);
  console.log(`Duplicates in file:      ${duplicates.length}`);
  console.log();
  
  if (alreadyExists.length > 0) {
    console.log('ℹ️  Surnames already in mapping (will skip):');
    alreadyExists.forEach(s => {
      console.log(`   - ${s.surname}`);
    });
    console.log();
  }
  
  if (duplicates.length > 0) {
    console.log('❌ Cannot proceed with duplicates in file.');
    console.log('   Please fix newSurnameaddition-final and run again.\n');
    process.exit(1);
  }
  
  if (toAdd.length === 0) {
    console.log('✅ All surnames already in mapping. Nothing to add.\n');
    return;
  }
  
  // Add new surnames
  console.log(`\n➕ Adding ${toAdd.length} new surnames...\n`);
  
  const updatedMapping = {
    surnames: [...existingMapping.surnames, ...toAdd]
  };
  
  // Write back
  const mappingPath = path.join(__dirname, '../data/surname-mapping.json');
  fs.writeFileSync(
    mappingPath,
    JSON.stringify(updatedMapping, null, 2),
    'utf-8'
  );
  
  console.log('✅ SUCCESS!');
  console.log('=' .repeat(70));
  console.log(`Total surnames in mapping: ${updatedMapping.surnames.length}`);
  console.log(`  (was: ${existingMapping.surnames.length})`);
  console.log(`  Added: ${toAdd.length} new surnames\n`);
  
  // Show breakdown by religion
  const religionCounts = {};
  updatedMapping.surnames.forEach(s => {
    religionCounts[s.religion] = (religionCounts[s.religion] || 0) + 1;
  });
  
  console.log('📊 Breakdown by Religion:');
  Object.entries(religionCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([religion, count]) => {
      console.log(`   ${religion}: ${count} surnames`);
    });
  console.log();
  
  console.log('✅ File updated: data/surname-mapping.json\n');
  console.log('🔄 Next steps:');
  console.log('   1. Test the application');
  console.log('   2. Run analytics to verify increased coverage');
  console.log('   3. Check voter demographics with new mappings\n');
}

main();

