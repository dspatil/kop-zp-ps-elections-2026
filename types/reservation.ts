/**
 * Reservation categories as per official government classification
 */
export type ReservationCategory = 
  | 'General' 
  | 'SC' // Scheduled Caste
  | 'ST' // Scheduled Tribe
  | 'OBC'; // Other Backward Classes

/**
 * Election type
 */
export type ElectionType = 'Zilla Parishad' | 'Panchayat Samiti';

/**
 * Seat reservation information
 * Every field must trace back to the official PDF
 */
export interface SeatReservation {
  /** Unique identifier for the seat */
  id: string;
  
  /** Type of election (ZP or Panchayat Samiti) */
  electionType: ElectionType;
  
  /** Name of the Panchayat Samiti or ZP division */
  divisionName: string;
  
  /** Taluka name (for filtering both ZP and PS by taluka) */
  taluka?: string;
  
  /** Seat number or identifier */
  seatNumber: string;
  
  /** Category reservation (General, SC, ST, OBC) */
  category: ReservationCategory;
  
  /** Whether this seat is reserved for Women */
  isWomenReserved: boolean;
  
  /** Page number in the official PDF where this information appears */
  pdfPageNumber: number;
  
  /** Optional: Additional notes or clarifications from the PDF */
  notes?: string;
}

/**
 * Filter options for searching seats
 */
export interface FilterOptions {
  electionType?: ElectionType;
  category?: ReservationCategory;
  isWomenReserved?: boolean;
  divisionName?: string;
  taluka?: string;
  searchText?: string;
}

