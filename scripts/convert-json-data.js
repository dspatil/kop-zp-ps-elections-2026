/**
 * Convert the extracted JSON data to our reservation format
 * 
 * Run: node scripts/convert-json-data.js
 */

const fs = require('fs');
const path = require('path');

const zpDataPath = path.join(__dirname, '..', 'kolhapur_election_reservation_details_zp.json');
const psDataPath1 = path.join(__dirname, '..', 'kolhapur_election_reservation_details_ps_chunk1.json');
const psDataPath2 = path.join(__dirname, '..', 'kolhapur_election_reservation_details_ps_chunk2.json');
const outputPath = path.join(__dirname, '..', 'data', 'reservations.json');

/**
 * Convert Marathi digits to Arabic
 */
function marathiToArabic(text) {
  if (!text) return text;
  const marathiDigits = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  let result = String(text);
  for (const [marathi, arabic] of Object.entries(marathiDigits)) {
    result = result.replace(new RegExp(marathi, 'g'), arabic);
  }
  return result;
}

/**
 * Convert Marathi reservation text to our category format
 */
function normalizeCategory(reservationMr) {
  if (!reservationMr) return 'General';
  
  const text = reservationMr;
  
  // Check for SC (अनुसूचित जाती) - note typo "अनसूचीत" also
  if (/अनुसूचित\s*जाती|अनसूचीत\s*जाती/i.test(text) || /\bsc\b/i.test(text)) {
    return 'SC';
  }
  // Check for ST (अनुसूचित जमाती)
  if (/अनुसूचित\s*जमाती/i.test(text) || /\bst\b/i.test(text)) {
    return 'ST';
  }
  // Check for OBC (नागरिकांचा मागासवर्ग प्रवर्ग) - also handle typo/variant "मागास प्रवर्ग"
  if (/मागासवर्ग|मागास\s*प्रवर्ग/i.test(text) || /\bobc\b/i.test(text)) {
    return 'OBC';
  }
  // Default to General (सर्वसाधारण)
  return 'General';
}

/**
 * Check if reservation is for women from Marathi text
 */
function isWomenReserved(reservationMr) {
  if (!reservationMr) return false;
  return reservationMr.includes('(महिला)') || reservationMr.includes('महिला');
}

/**
 * Read and parse JSON file, converting Marathi digits in the raw text first
 * (needed because JSON doesn't support Marathi numerals as number values)
 */
function readJsonWithMarathiNumbers(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Convert Marathi digits to Arabic in the raw JSON text
  content = marathiToArabic(content);
  return JSON.parse(content);
}

// Read Zilla Parishad data
const zpData = JSON.parse(fs.readFileSync(zpDataPath, 'utf8'));

// Read Panchayat Samiti data from both chunks
let psChunk1 = null;
let psChunk2 = null;

if (fs.existsSync(psDataPath1)) {
  psChunk1 = readJsonWithMarathiNumbers(psDataPath1);
}
if (fs.existsSync(psDataPath2)) {
  psChunk2 = readJsonWithMarathiNumbers(psDataPath2);
}

const reservations = [];

// Process Zilla Parishad divisions
zpData.election_divisions.forEach(division => {
  const category = normalizeCategory(division.reservation);
  const isWomen = isWomenReserved(division.reservation);
  
  reservations.push({
    id: `zp-Zilla Parishad-${division.id}`,
    electionType: 'Zilla Parishad',
    divisionName: 'Zilla Parishad',
    taluka: division.taluka,  // Store taluka for ZP seats
    seatNumber: `${division.id}-${division.name}`,
    category: category,
    isWomenReserved: isWomen,
    pdfPageNumber: 1,
    seatName: division.name
  });
});

console.log(`✅ Processed Zilla Parishad: ${zpData.election_divisions.length} seats`);

/**
 * Process PS chunk data
 * Structure: { "भाग": N, "जिल्हा_परिषद_विभाग_आणि_गण": { "तालुका": [...] } }
 */
function processPsChunk(psData) {
  if (!psData || !psData.जिल्हा_परिषद_विभाग_आणि_गण) return 0;
  
  let count = 0;
  const talukaData = psData.जिल्हा_परिषद_विभाग_आणि_गण;
  
  Object.entries(talukaData).forEach(([talukaName, ganas]) => {
    ganas.forEach(gana => {
      // Parse gana number from Marathi (e.g., "०१" -> 1)
      const ganaNumStr = marathiToArabic(gana.गण_क्रमांक);
      const ganaNum = parseInt(ganaNumStr, 10);
      
      const category = normalizeCategory(gana.आरक्षण);
      const isWomen = isWomenReserved(gana.आरक्षण);
      
      reservations.push({
        id: `ps-${talukaName}-${ganaNum}`,
        electionType: 'Panchayat Samiti',
        divisionName: talukaName,  // Taluka name is the Panchayat Samiti
        taluka: talukaName,  // Same as divisionName for PS
        seatNumber: `${ganaNum}-${gana.गण_नाव}`,
        category: category,
        isWomenReserved: isWomen,
        pdfPageNumber: 1,
        seatName: gana.गण_नाव,
        zpDivision: gana.झेडपी_विभाग  // Reference to ZP division
      });
      count++;
    });
  });
  
  return count;
}

// Process both PS chunks
let psCount1 = 0;
let psCount2 = 0;

if (psChunk1) {
  psCount1 = processPsChunk(psChunk1);
  console.log(`✅ Processed PS Chunk 1: ${psCount1} seats`);
}

if (psChunk2) {
  psCount2 = processPsChunk(psChunk2);
  console.log(`✅ Processed PS Chunk 2: ${psCount2} seats`);
}

// Create output JSON
const outputData = {
  metadata: {
    source: 'Official Reservation Notification PDF',
    authority: 'State Election Commission / Kolhapur District',
    note: 'Data is displayed as-is, without modification or interpretation.',
    sourcePdf: 'election_reservation_kop-ALL.pdf',
    extractedAt: new Date().toISOString(),
    totalSeats: reservations.length,
    pdfPages: 31,
    extractionMethod: 'converted-from-json',
  },
  reservations: reservations.sort((a, b) => {
    // Sort by election type (ZP first), then division, then seat number
    if (a.electionType !== b.electionType) {
      return a.electionType === 'Zilla Parishad' ? -1 : 1;
    }
    if (a.divisionName !== b.divisionName) {
      return a.divisionName.localeCompare(b.divisionName, 'mr');
    }
    const aNum = parseInt(a.seatNumber.split('-')[0]);
    const bNum = parseInt(b.seatNumber.split('-')[0]);
    return aNum - bNum;
  }),
};

// Write output
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');

// Show summary
const zpCount = reservations.filter(r => r.electionType === 'Zilla Parishad').length;
const psCount = reservations.filter(r => r.electionType === 'Panchayat Samiti').length;
const womenCount = reservations.filter(r => r.isWomenReserved).length;
const panchayatSamitis = [...new Set(reservations.filter(r => r.electionType === 'Panchayat Samiti').map(r => r.divisionName))];

console.log(`\n📊 Final Summary:`);
console.log(`   Total Seats: ${reservations.length}`);
console.log(`   Zilla Parishad: ${zpCount} seats`);
console.log(`   Panchayat Samiti: ${psCount} seats`);
console.log(`   Women Reserved: ${womenCount} seats`);
console.log(`   Panchayat Samitis: ${panchayatSamitis.length} unique`);
console.log(`   -> ${panchayatSamitis.join(', ')}`);
console.log(`\n   Output: ${outputPath}`);

// Category breakdown
const categories = {};
reservations.forEach(r => {
  const key = `${r.category}${r.isWomenReserved ? ' (Women)' : ''}`;
  categories[key] = (categories[key] || 0) + 1;
});

console.log(`\n📈 Category Breakdown:`);
Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`   ${cat}: ${count}`);
});

// Verify specific ZP seats mentioned by user
console.log(`\n🔍 Verifying specific ZP seats:`);
const seat8 = reservations.find(r => r.id === 'zp-Zilla Parishad-8');
const seat20 = reservations.find(r => r.id === 'zp-Zilla Parishad-20');
const seat24 = reservations.find(r => r.id === 'zp-Zilla Parishad-24');
const seat25 = reservations.find(r => r.id === 'zp-Zilla Parishad-25');
const seat28 = reservations.find(r => r.id === 'zp-Zilla Parishad-28');
const seat65 = reservations.find(r => r.id === 'zp-Zilla Parishad-65');

if (seat8) console.log(`   Seat 8-यवलुज: ${seat8.category}${seat8.isWomenReserved ? ' (Women)' : ''}`);
if (seat20) console.log(`   Seat 20-पट्टणकोडोली: ${seat20.category}${seat20.isWomenReserved ? ' (Women)' : ''}`);
if (seat24) console.log(`   Seat 24-आलास: ${seat24.category}${seat24.isWomenReserved ? ' (Women)' : ''}`);
if (seat25) console.log(`   Seat 25-नांदणी: ${seat25.category}${seat25.isWomenReserved ? ' (Women)' : ''}`);
if (seat28) console.log(`   Seat 28-दत्तवाड: ${seat28.category}${seat28.isWomenReserved ? ' (Women)' : ''}`);
if (seat65) console.log(`   Seat 65-अडकूर: ${seat65.category}${seat65.isWomenReserved ? ' (Women)' : ''}`);

// Sample PS seats
console.log(`\n🔍 Sample Panchayat Samiti seats:`);
const psSamples = reservations.filter(r => r.electionType === 'Panchayat Samiti').slice(0, 5);
psSamples.forEach(s => {
  console.log(`   ${s.divisionName} - ${s.seatNumber}: ${s.category}${s.isWomenReserved ? ' (Women)' : ''}`);
});
