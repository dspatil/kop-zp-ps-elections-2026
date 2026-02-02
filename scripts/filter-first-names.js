const fs = require('fs');
const path = require('path');

// Common Marathi/Hindi first names to exclude
const firstNames = new Set([
  // Male names
  'मारुती', 'शंकर', 'राजाराम', 'प्रकाश', 'पांडुरंग', 'सुरेश', 'संतोष', 'महेश', 'रमेश', 'विजय',
  'अशोक', 'सचिन', 'अनिल', 'राहुल', 'रोहित', 'सुभाष', 'प्रवीण', 'दीपक', 'राजेंद्र', 'दत्तात्रेय',
  'तानाजी', 'बाबुराव', 'विमल', 'कृष्णात', 'युवराज', 'सतीश', 'शुभम', 'ओंकार', 'सुशांत', 'स्वप्नील',
  'चंद्रकांत', 'बाळासो', 'संजय', 'सुनील', 'मंगल', 'शिवाजी', 'संदीप', 'महादेव', 'संभाजी',
  'विनायक', 'रामचंद्र', 'विशाल', 'सदाशिव', 'गणेश', 'नारायण', 'दिनेश', 'राकेश', 'उमेश',
  // Female names  
  'वैशाली', 'जयश्री', 'शोभा', 'सुशीला', 'सविता', 'पूजा', 'सुरेखा', 'आक्काताई', 'अनिता', 'गीता',
  'मनीषा', 'सरिता', 'ज्योती', 'भारती', 'स्वाती', 'लक्ष्मी', 'आनंदी', 'सुजाता', 'दिपाली', 'शुभांगी',
  'रेखा', 'अर्चना', 'राजश्री', 'कविता', 'सोनाबाई', 'रंजना', 'महादेवी', 'गंगाई', 'सुवर्णा', 'सारिका',
  'शांताबाई', 'वाणी', 'चवई', 'रेश्मा', 'शेवंता', 'अश्विनी', 'संगीता', 'सुनीता', 'पार्वते',
  'शांता', 'छाया', 'पार्वती', 'लक्ष्मीबाई', 'कल्पना', 'वंदना', 'उषा', 'शोभना', 'शांती',
  // Common names that could be both
  'आनंदा', 'धामाण्णा', 'मुद्दाण्णा', 'बुवा',
  // Regional variations
  'आंबी', 'गंगाधर', 'गंगाधरे'
]);

// Read the unmapped surnames file
const inputPath = path.join(__dirname, '../temp/unmapped-surnames-by-division.txt');
const content = fs.readFileSync(inputPath, 'utf8');

console.log('🔍 Filtering out first names from unmapped surnames...\n');

// Split into lines
const lines = content.split('\n');

let filteredLines = [];
let removedCount = 0;
let keptCount = 0;
let inConsolidatedSection = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if we're in the consolidated section
  if (line.includes('UNIQUE UNMAPPED SURNAMES (ACROSS ALL DIVISIONS)')) {
    inConsolidatedSection = true;
    filteredLines.push(line);
    continue;
  }
  
  // If we're in the consolidated section and it's a surname line
  if (inConsolidatedSection && line.match(/^\s*\d+\.\s+(\S+)/)) {
    const match = line.match(/^\s*\d+\.\s+(\S+)/);
    const surname = match[1];
    
    // Check if it's a first name
    if (firstNames.has(surname)) {
      removedCount++;
      continue; // Skip this line
    }
  }
  
  // For division sections, also filter out first names
  if (!inConsolidatedSection && line.match(/^\s+\d+\.\s+(\S+)/)) {
    const match = line.match(/^\s+\d+\.\s+(\S+)/);
    const surname = match[1];
    
    if (firstNames.has(surname)) {
      removedCount++;
      continue; // Skip this line
    }
  }
  
  // Keep all other lines
  filteredLines.push(line);
  
  if (line.match(/^\s*\d+\.\s+(\S+)/) || line.match(/^\s+\d+\.\s+(\S+)/)) {
    keptCount++;
  }
}

// Recalculate the total unique count in consolidated section
let newTotal = 0;
let totalLineIndex = -1;
for (let i = 0; i < filteredLines.length; i++) {
  if (filteredLines[i].match(/^Total Unique Unmapped Surnames:/)) {
    totalLineIndex = i;
  }
  if (filteredLines[i].match(/^\s*\d+\.\s+(\S+)/) && i > totalLineIndex && totalLineIndex !== -1) {
    newTotal++;
  }
}

// Update the total count
if (totalLineIndex !== -1) {
  filteredLines[totalLineIndex] = `Total Unique Unmapped Surnames: ${newTotal}`;
}

// Write back to file
const outputContent = filteredLines.join('\n');
fs.writeFileSync(inputPath, outputContent, 'utf8');

console.log(`✅ Filtering complete!`);
console.log(`   - First names removed: ${removedCount}`);
console.log(`   - Surnames kept: ${newTotal}`);
console.log(`   - File updated: ${inputPath}`);
