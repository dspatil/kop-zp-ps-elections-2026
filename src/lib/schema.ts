/**
 * Data schema for Kolhapur district election reservations
 * 
 * This module defines the data structure and normalization functions
 * for parsing reservation data from the official Marathi PDF.
 */

export type BodyType = "ZP" | "PS";

export type ReservationCategory =
  | "GENERAL"
  | "GENERAL_WOMEN"
  | "SC"
  | "SC_WOMEN"
  | "ST"
  | "ST_WOMEN"
  | "OBC"
  | "OBC_WOMEN"
  | "VJNT"
  | "VJNT_WOMEN"
  | "SBC"
  | "SBC_WOMEN"
  | "EWS"
  | "EWS_WOMEN"
  | "OTHER";

export interface ReservationSeat {
  id: string;              // stable id: `${bodyType}-${samitiName ?? "ZP"}-${seatNo}`
  bodyType: BodyType;
  samitiName?: string;     // required for PS, omitted for ZP
  seatNo: number;          // parse from Marathi/Arabic numerals
  seatName: string;        // electoral division name / group name
  category: ReservationCategory;
  isWomenReserved: boolean;
  rawCategoryText: string; // exact text from PDF
  rawRowText?: string;     // optional full extracted row for debugging
  source: { pdfName: string; page: number; };
}

export interface DatasetMeta {
  pdfName: string;
  extractedAtISO: string;
  notes: string;
}

export interface ReservationDataset {
  meta: DatasetMeta;
  seats: ReservationSeat[];
}

/**
 * Normalize reservation category from raw Marathi text
 * 
 * Handles:
 * - Marathi variants and messy spacing/punctuation
 * - Women reservation detection from "महिला"
 * - Maps to appropriate _WOMEN variant when applicable
 */
export function normalizeReservationCategory(
  raw: string
): { category: ReservationCategory; isWomenReserved: boolean } {
  // Step 1: Normalize the input text
  let normalized = raw
    .trim()
    // Collapse multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Remove common punctuation
    .replace(/[.:\-–—]/g, ' ')
    // Collapse spaces again after punctuation removal
    .replace(/\s+/g, ' ')
    .trim();

  // Step 2: Detect women reservation (Marathi and English variants)
  const isWomenReserved = /महिला|mahila|women/i.test(normalized);
  
  // Remove women indicators for category detection
  const categoryText = normalized
    .replace(/\(महिला\)/gi, '')
    .replace(/महिला/gi, '')
    .replace(/\(mahila\)/gi, '')
    .replace(/mahila/gi, '')
    .replace(/\(women\)/gi, '')
    .replace(/women/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Step 3: Detect category (case-insensitive matching for English, exact for Marathi)
  let baseCategory: ReservationCategory;

  // GENERAL patterns
  if (
    /सर्वसाधारण/.test(categoryText) ||
    /खुला/.test(categoryText) ||
    /ओपन/i.test(categoryText) ||
    /general/i.test(categoryText)
  ) {
    baseCategory = "GENERAL";
  }
  // SC patterns
  else if (
    /अनुसूचित\s*जाती/.test(categoryText) ||
    /अनु\.?\s*जा/.test(categoryText) ||
    /SC/i.test(categoryText)
  ) {
    baseCategory = "SC";
  }
  // ST patterns
  else if (
    /अनुसूचित\s*जमाती/.test(categoryText) ||
    /अनु\.?\s*ज/.test(categoryText) ||
    /ST/i.test(categoryText)
  ) {
    baseCategory = "ST";
  }
  // OBC patterns
  else if (
    /इतर\s*मागास/.test(categoryText) ||
    /इ\.?\s*मा\.?\s*व/.test(categoryText) ||
    /नागरिकांचा\s*मागासवर्ग/.test(categoryText) ||
    /OBC/i.test(categoryText)
  ) {
    baseCategory = "OBC";
  }
  // VJNT patterns
  else if (
    /वि\.?\s*जा/.test(categoryText) ||
    /विमुक्त\s*जाती/.test(categoryText) ||
    /भटक्या\s*जमाती/.test(categoryText) ||
    /VJ\/NT/i.test(categoryText) ||
    /VJNT/i.test(categoryText)
  ) {
    baseCategory = "VJNT";
  }
  // SBC patterns
  else if (
    /विशेष\s*मागास/.test(categoryText) ||
    /SBC/i.test(categoryText)
  ) {
    baseCategory = "SBC";
  }
  // EWS patterns
  else if (
    /ईडब्ल्यूएस/.test(categoryText) ||
    /EWS/i.test(categoryText) ||
    /आर्थिकदृष्ट्या\s*दुर्बल/.test(categoryText)
  ) {
    baseCategory = "EWS";
  }
  // Unknown category
  else {
    baseCategory = "OTHER";
  }

  // Step 4: Map to _WOMEN variant if applicable
  let finalCategory: ReservationCategory = baseCategory;

  if (isWomenReserved && baseCategory !== "OTHER") {
    // Map base category to _WOMEN variant
    switch (baseCategory) {
      case "GENERAL":
        finalCategory = "GENERAL_WOMEN";
        break;
      case "SC":
        finalCategory = "SC_WOMEN";
        break;
      case "ST":
        finalCategory = "ST_WOMEN";
        break;
      case "OBC":
        finalCategory = "OBC_WOMEN";
        break;
      case "VJNT":
        finalCategory = "VJNT_WOMEN";
        break;
      case "SBC":
        finalCategory = "SBC_WOMEN";
        break;
      case "EWS":
        finalCategory = "EWS_WOMEN";
        break;
      // OTHER stays as OTHER (no OTHER_WOMEN)
      default:
        finalCategory = baseCategory;
    }
  } else {
    finalCategory = baseCategory;
  }

  return {
    category: finalCategory,
    isWomenReserved,
  };
}

/**
 * Parse seat number from text containing Marathi or Arabic digits
 * 
 * Converts Marathi digits (०१२३४५६७८९) to Arabic digits (0123456789)
 * and extracts the first integer found.
 * 
 * @throws Error if no seat number is found
 */
export function parseSeatNo(text: string): number {
  // Marathi to Arabic digit mapping
  const marathiDigits: Record<string, string> = {
    '०': '0',
    '१': '1',
    '२': '2',
    '३': '3',
    '४': '4',
    '५': '5',
    '६': '6',
    '७': '7',
    '८': '8',
    '९': '9',
  };

  // Convert Marathi digits to Arabic
  let normalizedText = text;
  for (const [marathi, arabic] of Object.entries(marathiDigits)) {
    normalizedText = normalizedText.replace(new RegExp(marathi, 'g'), arabic);
  }

  // Extract first integer (sequence of digits)
  const match = normalizedText.match(/\d+/);
  
  if (!match) {
    throw new Error(`No seat number found in text: "${text}"`);
  }

  const seatNo = parseInt(match[0], 10);
  
  if (isNaN(seatNo)) {
    throw new Error(`Invalid seat number parsed from text: "${text}"`);
  }

  return seatNo;
}

