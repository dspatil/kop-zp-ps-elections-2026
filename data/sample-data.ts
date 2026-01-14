/**
 * Reservation data loader
 * 
 * IMPORTANT: This file reads from data/reservations.json, which is generated
 * by the one-time PDF extraction script (scripts/extract-pdf.js).
 * 
 * The web application NEVER reads PDFs directly - it only reads the JSON file.
 */

import { SeatReservation } from '@/types/reservation';

interface ReservationsData {
  metadata: {
    source?: string;
    authority?: string;
    note?: string;
    sourcePdf: string;
    extractedAt: string;
    totalSeats: number;
    pdfPages: number;
    extractionMethod?: string;
  };
  reservations: SeatReservation[];
}

// Load JSON file (valid JSON - credibility info is in metadata)
import reservationsData from './reservations.json';

const data = reservationsData as ReservationsData;

/**
 * Get all reservations from JSON file
 */
export function getAllReservations(): SeatReservation[] {
  return data.reservations || [];
}

/**
 * Get metadata about the data source
 */
export function getMetadata() {
  return data.metadata || {};
}

/**
 * Filter reservations based on criteria
 */
export function filterReservations(filters: {
  electionType?: string;
  category?: string;
  isWomenReserved?: boolean;
  divisionName?: string;
  taluka?: string;
  searchText?: string;
}): SeatReservation[] {
  const allReservations = getAllReservations();
  let filtered = [...allReservations];

  if (filters.electionType) {
    filtered = filtered.filter(r => r.electionType === filters.electionType);
  }

  if (filters.category) {
    filtered = filtered.filter(r => r.category === filters.category);
  }

  if (filters.isWomenReserved !== undefined) {
    filtered = filtered.filter(r => r.isWomenReserved === filters.isWomenReserved);
  }

  if (filters.divisionName) {
    filtered = filtered.filter(r => 
      r.divisionName.toLowerCase().includes(filters.divisionName!.toLowerCase())
    );
  }

  // Filter by taluka (works for both ZP and PS)
  if (filters.taluka) {
    filtered = filtered.filter(r => r.taluka === filters.taluka);
  }

  if (filters.searchText) {
    const searchLower = filters.searchText.toLowerCase();
    filtered = filtered.filter(r =>
      r.divisionName.toLowerCase().includes(searchLower) ||
      r.seatNumber.includes(searchLower) ||
      r.category.toLowerCase().includes(searchLower) ||
      (r.taluka && r.taluka.toLowerCase().includes(searchLower))
    );
  }

  return filtered;
}

