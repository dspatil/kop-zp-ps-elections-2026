'use client';

import { useState, useMemo } from 'react';
import { SeatReservation, ReservationCategory, ElectionType } from '@/types/reservation';
import { getAllReservations, filterReservations, getMetadata } from '@/data/sample-data';
import wardCompositionData from '@/data/ward-composition.json';
import epicIndexOptimized from '@/data/epic-index-optimized.json';
import styles from './page.module.css';

// Helper to search EPIC in optimized nested structure
function searchEpicInOptimized(epic: string): { found: boolean; division?: string; ward?: string; taluka?: string } | null {
  const data = epicIndexOptimized as any;
  
  for (const [talukaName, talukaData] of Object.entries(data.talukas || {})) {
    const taluka = talukaData as any;
    for (const [, divData] of Object.entries(taluka.divisions || {})) {
      const division = divData as any;
      for (const [, wardData] of Object.entries(division.wards || {})) {
        const ward = wardData as any;
        if (ward.epics && ward.epics.includes(epic)) {
          return {
            found: true,
            division: division.name,
            ward: ward.name,
            taluka: talukaName
          };
        }
      }
    }
  }
  return null;
}


type TabType = 'schedule' | 'eligibility' | 'reservations' | 'nomination' | 'wardmap' | 'voterlookup';

// Voter data type (will be populated with real data later)
interface VoterData {
  total: number;
  male: number;
  female: number;
  ageGroups: {
    '18-25': number;
    '26-35': number;
    '36-50': number;
    '50+': number;
  };
  pollingStations: number;
  booths: number;
}

// Sample voter data (replace with real data later)
const getSampleVoterData = (seatId: string): VoterData => {
  // Generate sample data (will be replaced with real data)
  const base = parseInt(seatId.split('-')[0] || '1', 10);
  const total = 35000 + (base * 1234);
  const male = Math.floor(total * 0.52);
  const female = total - male;
  
  return {
    total,
    male,
    female,
    ageGroups: {
      '18-25': Math.floor(total * 0.18),
      '26-35': Math.floor(total * 0.28),
      '36-50': Math.floor(total * 0.35),
      '50+': Math.floor(total * 0.19),
    },
    pollingStations: Math.floor(base / 3) + 8,
    booths: Math.floor(base / 2) + 25,
  };
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [selectedSeat, setSelectedSeat] = useState<SeatReservation | null>(null);
  const [villageSearch, setVillageSearch] = useState('');
  const [epicSearch, setEpicSearch] = useState('');
  const [epicResult, setEpicResult] = useState<{found: boolean; division?: string; ward?: string; taluka?: string} | null>(null);
  
  // Enhanced Voter Lookup state
  const [voterSearchType, setVoterSearchType] = useState<'epic' | 'name' | 'village'>('epic');
  const [nameSearch, setNameSearch] = useState('');
  const [nameSearchResults, setNameSearchResults] = useState<any[]>([]);
  const [nameSearchTotal, setNameSearchTotal] = useState(0);
  const [nameSearchPage, setNameSearchPage] = useState(1);
  const [voterSearchLoading, setVoterSearchLoading] = useState(false);
  const [voterSearchError, setVoterSearchError] = useState<string | null>(null);
  const [villageList, setVillageList] = useState<any[]>([]);
  const [selectedVillageVoters, setSelectedVillageVoters] = useState<{village: string; stats: any; voters: any[]; page: number; totalPages: number} | null>(null);
  const [apiEpicResult, setApiEpicResult] = useState<any>(null);
  const [searchDivisionFilter, setSearchDivisionFilter] = useState<string>('');
  const [searchWardFilter, setSearchWardFilter] = useState<string>('');
  
  // Get ward options for a division from ward-composition.json
  const getWardOptionsForDivision = (divisionNo: string): {no: number, name: string}[] => {
    const divNum = parseInt(divisionNo);
    // Search through all PS talukas to find the division
    for (const taluka of (wardCompositionData as any).ps?.talukas || []) {
      for (const division of taluka.divisions || []) {
        if (division.number === divNum) {
          return (division.wards || []).map((ward: any) => ({
            no: ward.number,
            name: `${ward.number} - ${ward.name}`
          }));
        }
      }
    }
    return [];
  };
  
  // Seat Analytics from API
  const [seatAnalytics, setSeatAnalytics] = useState<any>(null);
  const [seatAnalyticsLoading, setSeatAnalyticsLoading] = useState(false);
  const [seatAnalyticsNotFound, setSeatAnalyticsNotFound] = useState(false);
  
  // Ward Map state
  const [wardMapType, setWardMapType] = useState<'zp' | 'ps'>('zp');
  const [selectedTaluka, setSelectedTaluka] = useState<string>('');
  const [expandedDivisions, setExpandedDivisions] = useState<Set<number>>(new Set());
  
  // Map modal state
  const [mapModal, setMapModal] = useState<{
    isOpen: boolean;
    title: string;
    taluka: string;
    villages: string[];
    currentVillage: string;
  }>({ isOpen: false, title: '', taluka: '', villages: [], currentVillage: '' });
  const [expandedWards, setExpandedWards] = useState<Set<string>>(new Set());
  
  const [filters, setFilters] = useState<{
    electionType?: ElectionType;
    category?: ReservationCategory;
    isWomenReserved?: boolean;
    taluka?: string;
  }>({});


  const allReservations = getAllReservations();
  const metadata = getMetadata();
  
  const talukas = useMemo(() => {
    const talukaSet = new Set<string>();
    allReservations.forEach(r => {
      if (r.taluka) talukaSet.add(r.taluka);
    });
    return Array.from(talukaSet).sort((a, b) => a.localeCompare(b, 'mr'));
  }, [allReservations]);
  
  const filteredReservations = useMemo(() => {
    return filterReservations(filters);
  }, [filters]);

  const stats = useMemo(() => {
    const data = filteredReservations;
    return {
      total: data.length,
      zp: data.filter(r => r.electionType === 'Zilla Parishad').length,
      ps: data.filter(r => r.electionType === 'Panchayat Samiti').length,
      women: data.filter(r => r.isWomenReserved).length,
      general: data.filter(r => r.category === 'General').length,
      sc: data.filter(r => r.category === 'SC').length,
      st: data.filter(r => r.category === 'ST').length,
      obc: data.filter(r => r.category === 'OBC').length,
    };
  }, [filteredReservations]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  // API-based voter search functions
  const searchByEpicApi = async (epicId: string) => {
    setVoterSearchLoading(true);
    setVoterSearchError(null);
    setApiEpicResult(null);
    
    try {
      const response = await fetch(`/api/voters/epic/${epicId}`);
      const data = await response.json();
      
      if (response.ok && data.found) {
        setApiEpicResult(data.voter);
      } else {
        // Fallback to client-side search
        const result = searchEpicInOptimized(epicId);
        if (result) {
          setApiEpicResult({ ...result, fromClientCache: true });
        } else {
          setVoterSearchError('Voter not found / मतदार सापडला नाही');
        }
      }
    } catch {
      // Fallback to client-side search on API error
      const result = searchEpicInOptimized(epicId);
      if (result) {
        setApiEpicResult({ ...result, fromClientCache: true });
      } else {
        setVoterSearchError('Search failed. Please try again.');
      }
    } finally {
      setVoterSearchLoading(false);
    }
  };

  const searchByName = async (name: string, page = 1) => {
    if (!name || name.length < 2) return;
    
    setVoterSearchLoading(true);
    setVoterSearchError(null);
    if (page === 1) setNameSearchResults([]);
    
    try {
      let url = `/api/voters/search?name=${encodeURIComponent(name)}&limit=20&page=${page}`;
      if (searchDivisionFilter) {
        url += `&division=${searchDivisionFilter}`;
      }
      if (searchWardFilter) {
        url += `&ward=${searchWardFilter}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setNameSearchResults(data.voters || []);
        setNameSearchTotal(data.total || 0);
        setNameSearchPage(data.page || 1);
        if (data.voters?.length === 0) {
          setVoterSearchError('No voters found / मतदार सापडले नाहीत');
        }
      } else {
        setVoterSearchError(data.error || 'Search failed');
      }
    } catch {
      setVoterSearchError('Search failed. Please try again.');
    } finally {
      setVoterSearchLoading(false);
    }
  };

  const loadVillageList = async () => {
    setVoterSearchLoading(true);
    try {
      let url = '/api/voters/village?list=true';
      if (searchDivisionFilter) {
        url += `&division=${searchDivisionFilter}`;
      }
      if (searchWardFilter) {
        url += `&ward=${searchWardFilter}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setVillageList(data.villages || []);
      }
    } catch {
      console.error('Failed to load villages');
    } finally {
      setVoterSearchLoading(false);
    }
  };

  const loadVillageVoters = async (villageName: string, page = 1, divisionNo?: number, wardNo?: number) => {
    setVoterSearchLoading(true);
    try {
      let url = `/api/voters/village?name=${encodeURIComponent(villageName)}&page=${page}&limit=20`;
      if (divisionNo) url += `&division=${divisionNo}`;
      if (wardNo) url += `&ward=${wardNo}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setSelectedVillageVoters({
          village: villageName,
          stats: data.stats,
          voters: data.voters || [],
          page: data.page,
          totalPages: data.totalPages
        });
      }
    } catch {
      setVoterSearchError('Failed to load village voters');
    } finally {
      setVoterSearchLoading(false);
    }
  };

  // Export search results to CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    // CSV headers
    const headers = ['Sr.No.', 'Name', 'Age', 'Gender', 'Village', 'EPIC', 'Division', 'Ward'];
    
    // Convert data to CSV rows
    const rows = data.map(voter => [
      voter.serialNumber || '',
      voter.name || '',
      voter.age || '',
      voter.gender || '',
      voter.village || '',
      voter.epicId || '',
      voter.divisionNo || voter.division || '',
      voter.wardNo || voter.ward || ''
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Add BOM for Excel to recognize UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Fetch seat analytics from API (for divisions/wards not in client-side JSON)
  const fetchSeatAnalytics = async (seatNumber: string, electionType: string) => {
    const match = seatNumber.match(/^(\d+)/);
    if (!match) return;
    const num = parseInt(match[1]);
    
    setSeatAnalyticsLoading(true);
    setSeatAnalyticsNotFound(false);
    try {
      const param = electionType === 'Zilla Parishad' ? `division=${num}` : `ward=${num}`;
      const response = await fetch(`/api/voters/analytics?${param}`);
      if (response.ok) {
        const data = await response.json();
        setSeatAnalytics(data);
      } else {
        // No data found (404 or other error)
        setSeatAnalyticsNotFound(true);
      }
    } catch {
      console.error('Failed to fetch seat analytics');
      setSeatAnalyticsNotFound(true);
    } finally {
      setSeatAnalyticsLoading(false);
    }
  };

  const getCategoryColor = (category: ReservationCategory): string => {
    const colors: Record<ReservationCategory, string> = {
      'General': '#3182ce',
      'SC': '#e53e3e',
      'ST': '#38a169',
      'OBC': '#dd6b20',
    };
    return colors[category];
  };

  // Election Schedule - Official dates with dynamic status
  const getScheduleStatus = (startDate: Date, endDate?: Date): 'completed' | 'active' | 'upcoming' => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (endDate) {
      // For events with date ranges
      if (now >= startDate && now <= endDate) return 'active';
      if (now > endDate) return 'completed';
      return 'upcoming';
    } else {
      // For single-day events
      if (now.getTime() === startDate.getTime()) return 'active';
      if (now > startDate) return 'completed';
      return 'upcoming';
    }
  };

  const electionSchedule = useMemo(() => {
    const schedule = [
      { 
        event: 'Nomination Start', 
        eventMr: 'अर्ज सुरू', 
        date: '16 Jan', 
        dateMr: '१६ जाने', 
        startDate: new Date(2026, 0, 16),
        endDate: new Date(2026, 0, 21) 
      },
      { 
        event: 'Nomination End', 
        eventMr: 'अर्ज शेवट', 
        date: '21 Jan', 
        dateMr: '२१ जाने', 
        startDate: new Date(2026, 0, 21) 
      },
      { 
        event: 'Scrutiny', 
        eventMr: 'छाननी', 
        date: '22 Jan', 
        dateMr: '२२ जाने', 
        startDate: new Date(2026, 0, 22) 
      },
      { 
        event: 'Withdrawal', 
        eventMr: 'माघार', 
        date: '27 Jan', 
        dateMr: '२७ जाने', 
        startDate: new Date(2026, 0, 27) 
      },
      { 
        event: 'Polling', 
        eventMr: 'मतदान', 
        date: '5 Feb', 
        dateMr: '५ फेब्रु', 
        startDate: new Date(2026, 1, 5) 
      },
      { 
        event: 'Counting', 
        eventMr: 'मतमोजणी', 
        date: '7 Feb', 
        dateMr: '७ फेब्रु', 
        startDate: new Date(2026, 1, 7) 
      },
    ];
    
    return schedule.map(item => ({
      ...item,
      status: getScheduleStatus(item.startDate, item.endDate)
    }));
  }, []);

  // Eligibility state
  const [eligibilityFilters, setEligibilityFilters] = useState<{
    gender?: 'male' | 'female';
    category?: ReservationCategory;
    taluka?: string;
  }>({});

  const eligibleSeats = useMemo(() => {
    if (!eligibilityFilters.gender && !eligibilityFilters.category) return [];
    
    return allReservations.filter(seat => {
      if (eligibilityFilters.category && seat.category !== eligibilityFilters.category) {
        return false;
      }
      if (eligibilityFilters.gender === 'male' && seat.isWomenReserved) {
        return false;
      }
      if (eligibilityFilters.taluka && seat.taluka !== eligibilityFilters.taluka) {
        return false;
      }
      return true;
    });
  }, [eligibilityFilters, allReservations]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          Kolhapur ZP & PS Elections 2026
        </h1>
        <p className={styles.marathiTitle}>कोल्हापूर जि.प. व पं.स. निवडणूक २०२६</p>
        <p className={styles.disclaimer}>
          ⚠️ For Information Only | केवळ माहितीसाठी
          <br />
          <small>Source: Official Govt. Notification | स्रोत: अधिकृत शासन अधिसूचना</small>
        </p>
      </header>

      {/* Tab Navigation */}
      <nav className={styles.tabNav}>
        <button 
          className={`${styles.tab} ${activeTab === 'schedule' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <span className={styles.tabIcon}>🗓</span>
          <span className={styles.tabLabel}>Schedule</span>
          <span className={styles.tabLabelMr}>वेळापत्रक</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'reservations' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          <span className={styles.tabIcon}>📋</span>
          <span className={styles.tabLabel}>Reservations</span>
          <span className={styles.tabLabelMr}>आरक्षण</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'eligibility' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('eligibility')}
        >
          <span className={styles.tabIcon}>🎯</span>
          <span className={styles.tabLabel}>Candidate Eligibility</span>
          <span className={styles.tabLabelMr}>उमेदवार पात्रता</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'nomination' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('nomination')}
        >
          <span className={styles.tabIcon}>📝</span>
          <span className={styles.tabLabel}>Nomination</span>
          <span className={styles.tabLabelMr}>उमेदवारी</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'wardmap' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('wardmap')}
        >
          <span className={styles.tabIcon}>🗺️</span>
          <span className={styles.tabLabel}>Ward Map</span>
          <span className={styles.tabLabelMr}>प्रभाग रचना</span>
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'voterlookup' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('voterlookup')}
        >
          <span className={styles.tabIcon}>🪪</span>
          <span className={styles.tabLabel}>Voter Lookup</span>
          <span className={styles.tabLabelMr}>मतदार शोध</span>
        </button>
      </nav>

      {/* Tab Content */}
      <main className={styles.tabContent}>
        
        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className={styles.scheduleTab}>
            <h2 className={styles.sectionTitle}>निवडणूक कार्यक्रम / Election Schedule</h2>
            
            <div className={styles.scheduleList}>
              {electionSchedule.map((item, index) => (
                <div 
                  key={index} 
                  className={`${styles.scheduleItem} ${styles[item.status]}`}
                >
                  <div className={styles.scheduleDate}>
                    <span className={styles.dateEn}>{item.date}</span>
                    <span className={styles.dateMr}>{item.dateMr}</span>
                  </div>
                  <div className={styles.scheduleEvent}>
                    <span className={styles.eventEn}>{item.event}</span>
                    <span className={styles.eventMr}>{item.eventMr}</span>
                  </div>
                  {item.status === 'active' && (
                    <span className={styles.activeBadge}>IN PROGRESS / सुरू</span>
                  )}
                  {item.status === 'completed' && (
                    <span className={styles.completedBadge}>✓ COMPLETED / पूर्ण</span>
                  )}
                  {item.status === 'upcoming' && (
                    <span className={styles.upcomingBadge}>UPCOMING / आगामी</span>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.importantNote}>
              <strong>📍 Important Timings:</strong>
              <ul>
                <li>Withdrawal deadline: 27 Jan, 3:00 PM / माघार: २७ जाने, दु. ३ वाजेपर्यंत</li>
                <li>Polling: 7:30 AM - 5:30 PM / मतदान: सकाळी ७:३० ते संध्या. ५:३०</li>
                <li>Counting starts: 10:00 AM / मतमोजणी: सकाळी १० वाजता</li>
              </ul>
            </div>
          </div>
        )}

        {/* Eligibility Tab */}
        {activeTab === 'eligibility' && (
          <div className={styles.eligibilityTab}>
            <h2 className={styles.sectionTitle}>तुमची पात्रता तपासा / Check Your Eligibility</h2>
            
            <div className={styles.eligibilityForm}>
              <div className={styles.formGroup}>
                <label>Gender / लिंग</label>
                <select 
                  value={eligibilityFilters.gender || ''}
                  onChange={(e) => setEligibilityFilters(prev => ({...prev, gender: e.target.value as 'male' | 'female' || undefined}))}
                  className={styles.select}
                >
                  <option value="">Select / निवडा</option>
                  <option value="male">Male / पुरुष</option>
                  <option value="female">Female / महिला</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Category / प्रवर्ग</label>
                <select 
                  value={eligibilityFilters.category || ''}
                  onChange={(e) => setEligibilityFilters(prev => ({...prev, category: e.target.value as ReservationCategory || undefined}))}
                  className={styles.select}
                >
                  <option value="">Select / निवडा</option>
                  <option value="General">General / सर्वसाधारण</option>
                  <option value="SC">SC / अनुसूचित जाती</option>
                  <option value="ST">ST / अनुसूचित जमाती</option>
                  <option value="OBC">OBC / नागरिकांचा मागासवर्ग</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Taluka / तालुका</label>
                <select 
                  value={eligibilityFilters.taluka || ''}
                  onChange={(e) => setEligibilityFilters(prev => ({...prev, taluka: e.target.value || undefined}))}
                  className={styles.select}
                >
                  <option value="">All Talukas / सर्व तालुके</option>
                  {talukas.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {(eligibilityFilters.gender || eligibilityFilters.category) && (
              <>
                <div className={styles.eligibilityResult}>
                  <div className={styles.resultNumber}>{eligibleSeats.length}</div>
                  <div className={styles.resultLabel}>Seats you can contest / तुम्ही लढवू शकता अशा जागा</div>
                  <div className={styles.resultBreakdown}>
                    <span>🏛️ ZP / जि.प.: {eligibleSeats.filter(s => s.electionType === 'Zilla Parishad').length}</span>
                    <span>🏘️ PS / पं.स.: {eligibleSeats.filter(s => s.electionType === 'Panchayat Samiti').length}</span>
                  </div>
                </div>
                
                {eligibleSeats.length > 0 && (
                  <div className={styles.eligibleSeatsList}>
                    <h3 className={styles.seatsListTitle}>📍 Your Eligible Seats / तुमच्या पात्र जागा:</h3>
                    
                    {eligibleSeats.filter(s => s.electionType === 'Zilla Parishad').length > 0 && (
                      <div className={styles.seatsGroup}>
                        <h4 className={styles.seatsGroupTitle}>🏛️ Zilla Parishad / जिल्हा परिषद</h4>
                        <div className={styles.seatsChips}>
                          {eligibleSeats
                            .filter(s => s.electionType === 'Zilla Parishad')
                            .map((seat, idx) => (
                              <span key={idx} className={styles.seatChip}>
                                {seat.seatNumber}
                                {seat.taluka && <small> ({seat.taluka})</small>}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {eligibleSeats.filter(s => s.electionType === 'Panchayat Samiti').length > 0 && (
                      <div className={styles.seatsGroup}>
                        <h4 className={styles.seatsGroupTitle}>🏘️ Panchayat Samiti / पंचायत समिती</h4>
                        <div className={styles.seatsChips}>
                          {eligibleSeats
                            .filter(s => s.electionType === 'Panchayat Samiti')
                            .map((seat, idx) => (
                              <span key={idx} className={styles.seatChip}>
                                {seat.seatNumber}
                                {seat.divisionName && <small> ({seat.divisionName})</small>}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className={styles.reservationsTab}>
            {/* Village Search */}
            <div className={styles.villageSearchBox}>
              <div className={styles.searchHeader}>
                <span className={styles.searchIcon}>🔍</span>
                <h3>Find Your Constituency / तुमचा मतदारसंघ शोधा</h3>
              </div>
              <div className={styles.searchInputWrapper}>
                <input
                  type="text"
                  placeholder="गावाचे नाव टाका / Enter village name (भडगांव, महागांव, कागल...)"
                  value={villageSearch}
                  onChange={(e) => setVillageSearch(e.target.value)}
                  className={styles.villageSearchInput}
                />
                {villageSearch && (
                  <button 
                    className={styles.clearSearch}
                    onClick={() => setVillageSearch('')}
                  >
                    ✕
                  </button>
                )}
              </div>
              {villageSearch && (() => {
                const searchTerm = villageSearch.toLowerCase();
                const searchResults = allReservations.filter(seat => 
                  seat.seatNumber.toLowerCase().includes(searchTerm) ||
                  (seat.taluka && seat.taluka.toLowerCase().includes(searchTerm)) ||
                  (seat.divisionName && seat.divisionName.toLowerCase().includes(searchTerm))
                );
                return (
                <div className={styles.searchResults}>
                  {searchResults.length === 0 ? (
                    <p className={styles.noSearchResults}>
                      No results found / कोणताही परिणाम नाही
                      <br />
                      <small>Search in Marathi (e.g., भडगांव, कागल) for best results</small>
                    </p>
                  ) : (
                    <div className={styles.searchResultsList}>
                      <p className={styles.searchResultsCount}>
                        Found {searchResults.length} matching seat{searchResults.length > 1 ? 's' : ''}:
                      </p>
                      {searchResults.slice(0, 10).map((seat) => (
                        <div 
                          key={seat.id} 
                          className={styles.searchResultItem}
                          onClick={() => {
                            setSelectedSeat(seat);
                            setVillageSearch('');
                          }}
                        >
                          <div className={styles.searchResultMain}>
                            <span className={styles.searchResultType}>
                              {seat.electionType === 'Zilla Parishad' ? '🏛️ ZP' : '🏘️ PS'}
                            </span>
                            <span className={styles.searchResultName}>{seat.seatNumber}</span>
                          </div>
                          <div className={styles.searchResultMeta}>
                            <span 
                              className={styles.searchResultCategory}
                              style={{ background: getCategoryColor(seat.category) }}
                            >
                              {seat.category}
                            </span>
                            {seat.isWomenReserved && (
                              <span className={styles.searchResultWomen}>Women</span>
                            )}
                            {seat.taluka && (
                              <span className={styles.searchResultTaluka}>{seat.taluka}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {searchResults.length > 10 && (
                        <p className={styles.moreResults}>
                          + {searchResults.length - 10} more results. Use filters below to narrow down.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                );
              })()}
            </div>

            <div className={styles.filterHeader}>
              <h2 className={styles.sectionTitle}>जागानिहाय आरक्षण / Seat-wise Reservations</h2>
              <div className={styles.actionButtons}>
                <button 
                  className={styles.shareButton}
                  onClick={() => {
                    const text = `🗳️ *कोल्हापूर जि.प. व पं.स. निवडणूक 2026*

📋 *Nomination भरणाऱ्यांनी हे नक्की पहा!*
आरक्षणाबाबत खूप स्पष्ट माहिती आहे.

✅ ZP & PS आरक्षण यादी
✅ तालुकानिहाय माहिती  
✅ उमेदवार पात्रता तपासा
✅ निवडणूक वेळापत्रक

👉 https://kop-elections-2026.dspatil.in/

_Forward करा - प्रत्येक उमेदवाराला उपयोगी!_ 🙏

#KolhapurElections2026 #ZPElection #कोल्हापूर`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                >
                  📲 Share / शेअर
                </button>
                <button 
                  className={styles.exportButton}
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + "Seat,Election Type,Taluka,Category,Women Reserved\n"
                      + filteredReservations.map(s => 
                          `"${s.seatNumber}","${s.electionType}","${s.taluka || ''}","${s.category}","${s.isWomenReserved ? 'Yes' : 'No'}"`
                        ).join("\n");
                    const link = document.createElement("a");
                    link.setAttribute("href", encodeURI(csvContent));
                    link.setAttribute("download", "kolhapur_reservations.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  📥 Export CSV
                </button>
                <button 
                  className={styles.printButton}
                  onClick={() => window.print()}
                >
                  🖨️ Print
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div className={styles.filters}>
              <div className={styles.filterRow}>
                <select
                  value={filters.electionType || ''}
                  onChange={(e) => handleFilterChange('electionType', e.target.value)}
                  className={styles.select}
                >
                  <option value="">Election Type / निवडणूक प्रकार</option>
                  <option value="Zilla Parishad">Zilla Parishad / जिल्हा परिषद</option>
                  <option value="Panchayat Samiti">Panchayat Samiti / पंचायत समिती</option>
                </select>

                <select
                  value={filters.taluka || ''}
                  onChange={(e) => handleFilterChange('taluka', e.target.value)}
                  className={styles.select}
                >
                  <option value="">All Talukas / सर्व तालुके</option>
                  {talukas.map(taluka => (
                    <option key={taluka} value={taluka}>{taluka}</option>
                  ))}
                </select>

                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className={styles.select}
                >
                  <option value="">Category / प्रवर्ग</option>
                  <option value="General">General / सर्वसाधारण</option>
                  <option value="SC">SC / अनुसूचित जाती</option>
                  <option value="ST">ST / अनुसूचित जमाती</option>
                  <option value="OBC">OBC / नागरिकांचा मागासवर्ग</option>
                </select>

                <select
                  value={filters.isWomenReserved === undefined ? '' : filters.isWomenReserved ? 'true' : 'false'}
                  onChange={(e) => handleFilterChange('isWomenReserved', e.target.value === '' ? undefined : e.target.value === 'true')}
                  className={styles.select}
                >
                  <option value="">Women Reservation / महिला आरक्षण</option>
                  <option value="true">Yes / होय</option>
                  <option value="false">No / नाही</option>
                </select>
              </div>

              {(filters.electionType || filters.category || filters.isWomenReserved !== undefined || filters.taluka) && (
                <button onClick={clearFilters} className={styles.clearButton}>
                  Clear Filters / फिल्टर साफ करा
                </button>
              )}
            </div>

            {/* Stats Bar */}
            <div className={styles.statsBar}>
              <span className={styles.statItem}>📊 Total / एकूण: {stats.total}</span>
              <span className={styles.statItem}>🏛️ ZP / जि.प.: {stats.zp}</span>
              <span className={styles.statItem}>🏘️ PS / पं.स.: {stats.ps}</span>
              <span className={styles.statItem}>👩 Women / महिला: {stats.women}</span>
            </div>

            {/* Seats Grid */}
            {filteredReservations.length === 0 ? (
              <div className={styles.noResults}>
                <p>No seats found matching your criteria / तुमच्या निकषांशी जुळणारी जागा सापडली नाही</p>
              </div>
            ) : (
              <div className={styles.seatsGrid}>
                {filteredReservations.map((seat) => (
                  <div 
                    key={seat.id} 
                    className={styles.seatCard}
                    onClick={() => { setSeatAnalytics(null); setSeatAnalyticsNotFound(false); setSelectedSeat(seat); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setSeatAnalytics(null); setSeatAnalyticsNotFound(false); setSelectedSeat(seat); } }}
                  >
                    <div className={styles.seatHeader}>
                      <span 
                        className={styles.categoryBadge}
                        style={{ background: getCategoryColor(seat.category) }}
                      >
                        {seat.category === 'General' && 'General / सर्वसाधारण'}
                        {seat.category === 'SC' && 'SC / अनुसूचित जाती'}
                        {seat.category === 'ST' && 'ST / अनुसूचित जमाती'}
                        {seat.category === 'OBC' && 'OBC / मागासवर्ग'}
                      </span>
                      {seat.isWomenReserved && (
                        <span className={styles.womenBadge}>Women / महिला</span>
                      )}
                    </div>
                    <div className={styles.seatBody}>
                      <div className={styles.seatType}>
                        {seat.electionType === 'Zilla Parishad' ? '🏛️ ZP / जिल्हा परिषद' : '🏘️ PS / पंचायत समिती'}
                      </div>
                      {seat.taluka && <div className={styles.seatTaluka}>Taluka / तालुका: {seat.taluka}</div>}
                      <div className={styles.seatName}>{seat.seatNumber}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nomination Tab */}
        {activeTab === 'nomination' && (
          <div className={styles.nominationTab}>
            <h2 className={styles.sectionTitle}>📝 Nomination Checklist / उमेदवारी चेकलिस्ट</h2>
            
            <div className={styles.nominationAlert}>
              <span className={styles.alertIcon}>⚠️</span>
              <div>
                <strong>Nomination Period: 16 Jan - 21 Jan 2026</strong>
                <p>अर्ज दाखल करण्याचा कालावधी: १६ जाने - २१ जाने २०२६</p>
              </div>
            </div>

            {/* Official Forms - Must Have for Nomination */}
            <div className={styles.checklistSection}>
              <h3 className={styles.checklistTitle}>📋 Must-Have Forms for Nomination / नामांकनासाठी आवश्यक अर्ज</h3>
              <div className={styles.officialFormsList}>
                <div className={styles.formItem}>
                  <span className={styles.formNumber}>1</span>
                  <div>
                    <strong>Nomination Form / नामनिर्देशन पत्र</strong>
                    <p>Form 2-A (ZP) / Form 2-B (PS) - नमुना २-अ (जि.प.) / २-ब (पं.स.)</p>
                    <p className={styles.formTip}>📍 Available at Tahsildar Office / तहसीलदार कार्यालयात उपलब्ध</p>
                  </div>
                </div>
                <div className={styles.formItem}>
                  <span className={styles.formNumber}>2</span>
                  <div>
                    <strong>Affidavit (₹100 Stamp Paper)</strong>
                    <p>गुन्हेगारी पार्श्वभूमी, मालमत्ता व दायित्व शपथपत्र (₹१०० स्टॅम्प पेपर)</p>
                    <p className={styles.formTip}>📍 Criminal record, assets & liabilities declaration</p>
                  </div>
                </div>
                <div className={styles.formItem}>
                  <span className={styles.formNumber}>3</span>
                  <div>
                    <strong>Toilet Usage Declaration / शौचालय वापर प्रमाणपत्र</strong>
                    <p>Self-declaration or certificate from CEO/designated officer</p>
                    <a 
                      href="https://mahasec.maharashtra.gov.in/Upload/PDF/SEC%20Letter%20Dtd%20160724.pdf" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.formLink}
                    >
                      📄 View Official Format / अधिकृत नमुना पहा
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.checklistSection}>
              <h3 className={styles.checklistTitle}>📎 Required Documents / आवश्यक कागदपत्रे</h3>
              <div className={styles.checklistGrid}>
                <div className={styles.checklistItem}>
                  <span className={styles.checkIcon}>🪪</span>
                  <div>
                    <strong>Voter ID Card (EPIC)</strong>
                    <p>मतदार ओळखपत्र (त्याच मतदारसंघातील)</p>
                  </div>
                </div>
                <div className={styles.checklistItem}>
                  <span className={styles.checkIcon}>🎂</span>
                  <div>
                    <strong>Age Proof (21+ years)</strong>
                    <p>वयाचा पुरावा (२१+ वर्षे)</p>
                  </div>
                </div>
                <div className={styles.checklistItem}>
                  <span className={styles.checkIcon}>📸</span>
                  <div>
                    <strong>Passport Size Photos</strong>
                    <p>पासपोर्ट आकाराचे फोटो</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Deposit / Fees */}
            <div className={styles.checklistSection}>
              <h3 className={styles.checklistTitle}>💰 Security Deposit / अनामत रक्कम</h3>
              <div className={styles.feesTable}>
                <div className={styles.feeRow}>
                  <div className={styles.feeCategory}>
                    <strong>Zilla Parishad / जिल्हा परिषद</strong>
                  </div>
                  <div className={styles.feeAmounts}>
                    <div className={styles.feeItem}>
                      <span className={styles.feeLabel}>General / सर्वसाधारण:</span>
                      <span className={styles.feeAmount}>₹1,000</span>
                    </div>
                    <div className={styles.feeItem}>
                      <span className={styles.feeLabel}>SC/ST:</span>
                      <span className={styles.feeAmount}>₹500</span>
                    </div>
                  </div>
                </div>
                <div className={styles.feeRow}>
                  <div className={styles.feeCategory}>
                    <strong>Panchayat Samiti / पंचायत समिती</strong>
                  </div>
                  <div className={styles.feeAmounts}>
                    <div className={styles.feeItem}>
                      <span className={styles.feeLabel}>General / सर्वसाधारण:</span>
                      <span className={styles.feeAmount}>₹700</span>
                    </div>
                    <div className={styles.feeItem}>
                      <span className={styles.feeLabel}>SC/ST:</span>
                      <span className={styles.feeAmount}>₹350</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className={styles.feeNote}>* Deposit refunded if candidate gets more than 1/6th of valid votes polled</p>
            </div>

            {/* Election Expenditure Limit */}
            <div className={styles.checklistSection}>
              <h3 className={styles.checklistTitle}>📊 Election Expenditure Limit / निवडणूक खर्चाची मर्यादा</h3>
              <div className={styles.expenditureInfo}>
                <p className={styles.expenditureNote}>
                  Kolhapur has 68 ZP divisions (61-70 category) / कोल्हापूर जिल्ह्यात ६८ जि.प. विभाग आहेत
                </p>
                <div className={styles.expenditureTable}>
                  <div className={styles.expenditureRow}>
                    <div className={styles.expenditureCategory}>
                      <span className={styles.expenditureIcon}>🏛️</span>
                      <strong>Zilla Parishad / जिल्हा परिषद</strong>
                    </div>
                    <div className={styles.expenditureAmount}>
                      <span className={styles.amountValue}>₹7,50,000</span>
                      <span className={styles.amountLabel}>(साडेसात लाख)</span>
                    </div>
                  </div>
                  <div className={styles.expenditureRow}>
                    <div className={styles.expenditureCategory}>
                      <span className={styles.expenditureIcon}>🏘️</span>
                      <strong>Panchayat Samiti / पंचायत समिती</strong>
                    </div>
                    <div className={styles.expenditureAmount}>
                      <span className={styles.amountValue}>₹5,25,000</span>
                      <span className={styles.amountLabel}>(सव्वापाच लाख)</span>
                    </div>
                  </div>
                </div>
                <p className={styles.expenditureWarning}>
                  ⚠️ Candidates must maintain expenditure within this limit / उमेदवाराने या मर्यादेतच खर्च करावा
                </p>
              </div>
            </div>

            <div className={styles.checklistSection}>
              <h3 className={styles.checklistTitle}>📋 For Reserved Categories / आरक्षित प्रवर्गासाठी</h3>
              <div className={styles.checklistGrid}>
                <div className={styles.checklistItem}>
                  <span className={styles.checkIcon}>📃</span>
                  <div>
                    <strong>Caste Certificate</strong>
                    <p>जात प्रमाणपत्र (SC/ST/OBC साठी)</p>
                  </div>
                </div>
                <div className={styles.checklistItem}>
                  <span className={styles.checkIcon}>✅</span>
                  <div>
                    <strong>Caste Validity Certificate</strong>
                    <p>जात वैधता प्रमाणपत्र (SC/ST साठी अनिवार्य)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className={styles.contactSection}>
              <h3 className={styles.checklistTitle}>📞 Contact / संपर्क</h3>
              <div className={styles.contactGrid}>
                <div className={styles.contactItem}>
                  <span className={styles.contactIcon}>🏛️</span>
                  <div>
                    <strong>Returning Officer</strong>
                    <p>Tahsildar Office / तहसीलदार कार्यालय, संबंधित तालुका</p>
                  </div>
                </div>
                <div className={styles.contactItem}>
                  <span className={styles.contactIcon}>📧</span>
                  <div>
                    <strong>State Election Commission</strong>
                    <p>sec.zpps@mah.gov.in</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.handbookSection}>
              <div className={styles.handbookCard}>
                <span className={styles.handbookIcon}>📚</span>
                <div>
                  <strong>Official Handbook / अधिकृत माहितीपुस्तिका</strong>
                  <p>राजकीय पक्ष व उमेदवारांसाठी महत्वाच्या सूचना (SEC Maharashtra)</p>
                  <a 
                    href="https://mahasec.maharashtra.gov.in/Upload/PDF/NEW%20ZPPS%20%20Political%20Party%20&%20Candidate%20Handbook%2010012026.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.handbookLink}
                  >
                    📥 Download Official Handbook PDF
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.nominationNote}>
              <p className={styles.verifyNote}>
                ⚠️ Verify exact requirements with your local Returning Officer.
                <br />
                कृपया स्थानिक निवडणूक निर्णय अधिकाऱ्यांकडून अचूक आवश्यकता तपासा.
              </p>
            </div>
          </div>
        )}

        {/* Ward Map Tab */}
        {activeTab === 'wardmap' && (
          <div className={styles.wardMapTab}>
            <h2 className={styles.sectionTitle}>🗺️ Ward Composition / प्रभाग रचना</h2>
            <p className={styles.wardMapDesc}>
              Explore constituencies and see all villages in each division/ward. Click 📍 Map to view location.
              <br />
              <span className={styles.descMr}>प्रत्येक विभाग/गणातील सर्व गावे पहा. 📍 Map वर क्लिक करा.</span>
            </p>
            
            {/* Type Toggle */}
            <div className={styles.wardMapToggle}>
              <button 
                className={`${styles.toggleBtn} ${wardMapType === 'zp' ? styles.toggleActive : ''}`}
                onClick={() => { setWardMapType('zp'); setSelectedTaluka(''); setExpandedDivisions(new Set()); }}
              >
                🏛️ Zilla Parishad ({wardCompositionData.zp.totalDivisions} Divisions)
              </button>
              <button 
                className={`${styles.toggleBtn} ${wardMapType === 'ps' ? styles.toggleActive : ''}`}
                onClick={() => { setWardMapType('ps'); setSelectedTaluka(''); setExpandedDivisions(new Set()); setExpandedWards(new Set()); }}
              >
                🏘️ Panchayat Samiti ({wardCompositionData.ps.totalWards} Wards)
              </button>
            </div>

            {/* ZP View */}
            {wardMapType === 'zp' && (
              <div className={styles.wardMapContent}>
                {/* Taluka Filter for ZP */}
                <div className={styles.wardMapFilter}>
                  <label>Filter by Taluka / तालुका निवडा:</label>
                  <select 
                    value={selectedTaluka} 
                    onChange={(e) => setSelectedTaluka(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">All Talukas / सर्व तालुके ({wardCompositionData.zp.totalDivisions})</option>
                    {Array.from(new Set(wardCompositionData.zp.divisions.map(d => d.taluka))).sort((a, b) => a.localeCompare(b, 'mr')).map(taluka => {
                      const count = wardCompositionData.zp.divisions.filter(d => d.taluka === taluka).length;
                      return <option key={taluka} value={taluka}>{taluka} ({count})</option>;
                    })}
                  </select>
                </div>

                {/* ZP Divisions List */}
                <div className={styles.divisionsList}>
                  {wardCompositionData.zp.divisions
                    .filter(div => !selectedTaluka || div.taluka === selectedTaluka)
                    .map(division => (
                      <div key={division.number} className={styles.divisionItem}>
                        <div 
                          className={styles.divisionHeader}
                          onClick={() => {
                            const newExpanded = new Set(expandedDivisions);
                            if (newExpanded.has(division.number)) {
                              newExpanded.delete(division.number);
                            } else {
                              newExpanded.add(division.number);
                            }
                            setExpandedDivisions(newExpanded);
                          }}
                        >
                          <span className={styles.expandIcon}>
                            {expandedDivisions.has(division.number) ? '▼' : '▶'}
                          </span>
                          <div className={styles.divisionInfo}>
                            <span className={styles.divisionNumber}>{division.number}.</span>
                            <span className={styles.divisionName}>{division.name}</span>
                            <span className={styles.divisionTaluka}>({division.taluka})</span>
                          </div>
                          <div className={styles.divisionActions}>
                            <span className={styles.villageCount}>
                              {division.villages.length} villages
                            </span>
                            <button 
                              className={styles.viewMapBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMapModal({
                                  isOpen: true,
                                  title: division.name,
                                  taluka: division.taluka,
                                  villages: division.villages,
                                  currentVillage: division.villages[0]
                                });
                              }}
                            >
                              📍 Map
                            </button>
                          </div>
                        </div>
                        
                        {expandedDivisions.has(division.number) && (
                          <div className={styles.villagesList}>
                            <div className={styles.villagesGrid}>
                              {division.villages.map((village, idx) => (
                                <span key={idx} className={styles.villageChip}>{village}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* PS View */}
            {wardMapType === 'ps' && (
              <div className={styles.wardMapContent}>
                {/* Taluka Filter for PS */}
                <div className={styles.wardMapFilter}>
                  <label>Select Taluka / तालुका निवडा:</label>
                  <select 
                    value={selectedTaluka} 
                    onChange={(e) => { setSelectedTaluka(e.target.value); setExpandedDivisions(new Set()); setExpandedWards(new Set()); }}
                    className={styles.select}
                  >
                    <option value="">Choose a Taluka... / तालुका निवडा...</option>
                    {wardCompositionData.ps.talukas.map(t => {
                      const wardCount = t.divisions.reduce((sum, d) => sum + d.wards.length, 0);
                      return <option key={t.taluka} value={t.taluka}>{t.taluka} ({wardCount} wards)</option>;
                    })}
                  </select>
                </div>

                {/* PS Divisions & Wards */}
                {selectedTaluka ? (
                  <div className={styles.divisionsList}>
                    {wardCompositionData.ps.talukas
                      .find(t => t.taluka === selectedTaluka)?.divisions
                      .map(division => (
                        <div key={division.number} className={styles.divisionItem}>
                          <div 
                            className={styles.divisionHeader}
                            onClick={() => {
                              const newExpanded = new Set(expandedDivisions);
                              if (newExpanded.has(division.number)) {
                                newExpanded.delete(division.number);
                              } else {
                                newExpanded.add(division.number);
                              }
                              setExpandedDivisions(newExpanded);
                            }}
                          >
                            <span className={styles.expandIcon}>
                              {expandedDivisions.has(division.number) ? '▼' : '▶'}
                            </span>
                            <div className={styles.divisionInfo}>
                              <span className={styles.divisionNumber}>{division.number}.</span>
                              <span className={styles.divisionName}>{division.name}</span>
                            </div>
                            <div className={styles.divisionActions}>
                              <span className={styles.villageCount}>
                                {division.wards.length} wards
                              </span>
                              <button 
                                className={styles.viewMapBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const allVillages = division.wards.flatMap(w => w.villages);
                                  setMapModal({
                                    isOpen: true,
                                    title: division.name,
                                    taluka: selectedTaluka,
                                    villages: allVillages,
                                    currentVillage: allVillages[0]
                                  });
                                }}
                              >
                                📍 Map
                              </button>
                            </div>
                          </div>
                          
                          {expandedDivisions.has(division.number) && (
                            <div className={styles.wardsList}>
                              {division.wards.map(ward => {
                                const wardKey = `${division.number}-${ward.number}`;
                                return (
                                  <div key={ward.number} className={styles.wardItem}>
                                    <div 
                                      className={styles.wardHeader}
                                      onClick={() => {
                                        const newExpanded = new Set(expandedWards);
                                        if (newExpanded.has(wardKey)) {
                                          newExpanded.delete(wardKey);
                                        } else {
                                          newExpanded.add(wardKey);
                                        }
                                        setExpandedWards(newExpanded);
                                      }}
                                    >
<span className={styles.expandIcon}>
                                      {expandedWards.has(wardKey) ? '▼' : '▶'}
                                    </span>
                                      <div className={styles.wardInfo}>
                                        <span className={styles.wardNumber}>{ward.number}.</span>
                                        <span className={styles.wardName}>{ward.name}</span>
                                      </div>
                                      <div className={styles.divisionActions}>
                                        <span className={styles.villageCount}>
                                          {ward.villages.length} villages
                                        </span>
                                        <button 
                                          className={styles.viewMapBtn}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setMapModal({
                                              isOpen: true,
                                              title: ward.name,
                                              taluka: selectedTaluka,
                                              villages: ward.villages,
                                              currentVillage: ward.villages[0]
                                            });
                                          }}
                                        >
                                          📍 Map
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {expandedWards.has(wardKey) && (
                                      <div className={styles.villagesList}>
                                        <div className={styles.villagesGrid}>
                                          {ward.villages.map((village, idx) => (
                                            <span key={idx} className={styles.villageChip}>{village}</span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className={styles.selectTalukaPrompt}>
                    <span className={styles.promptIcon}>👆</span>
                    <p>Please select a Taluka to view PS wards</p>
                    <p className={styles.promptMr}>पंचायत समिती गण पाहण्यासाठी तालुका निवडा</p>
                  </div>
                )}
              </div>
            )}

            {/* Summary Stats */}
            <div className={styles.wardMapStats}>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>{wardCompositionData.zp.totalDivisions}</span>
                <span className={styles.statLabel}>ZP Divisions</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>{wardCompositionData.ps.totalWards}</span>
                <span className={styles.statLabel}>PS Wards</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>{Object.keys(wardCompositionData.villageIndex).length}</span>
                <span className={styles.statLabel}>Villages Indexed</span>
              </div>
            </div>
          </div>
        )}

        {/* Voter Lookup Tab */}
        {activeTab === 'voterlookup' && (
          <div className={styles.voterLookupTab}>
            <h2 className={styles.sectionTitle}>🪪 Voter Lookup / मतदार शोध</h2>
            
            <div className={styles.voterLookupMainBox}>
              {/* Search Type Toggle */}
              <div className={styles.searchTypeToggle}>
                <button 
                  className={`${styles.toggleBtn} ${voterSearchType === 'epic' ? styles.toggleActive : ''}`}
                  onClick={() => { setVoterSearchType('epic'); setVoterSearchError(null); setApiEpicResult(null); }}
                >
                  🪪 EPIC
                </button>
                <button 
                  className={`${styles.toggleBtn} ${voterSearchType === 'name' ? styles.toggleActive : ''}`}
                  onClick={() => { setVoterSearchType('name'); setVoterSearchError(null); setNameSearchResults([]); }}
                >
                  👤 Name
                </button>
                <button 
                  className={`${styles.toggleBtn} ${voterSearchType === 'village' ? styles.toggleActive : ''}`}
                  onClick={() => { 
                    setVoterSearchType('village'); 
                    setVoterSearchError(null); 
                    setSelectedVillageVoters(null);
                    if (villageList.length === 0) loadVillageList();
                  }}
                >
                  🏘️ Village
                </button>
              </div>

              {/* Division & Ward Filters for Name/Village search */}
              {(voterSearchType === 'name' || voterSearchType === 'village') && (
                <div className={styles.divisionFilter}>
                  <div className={styles.filterGroup}>
                    <label>Division / विभाग:</label>
                    <select 
                      value={searchDivisionFilter} 
                      onChange={(e) => {
                        const newDivision = e.target.value;
                        setSearchDivisionFilter(newDivision);
                        setSearchWardFilter(''); // Reset ward when division changes
                        if (voterSearchType === 'village') {
                          setVillageList([]);
                          // Fetch with new division value directly (state update is async)
                          setTimeout(async () => {
                            setVoterSearchLoading(true);
                            try {
                              let url = '/api/voters/village?list=true';
                              if (newDivision) {
                                url += `&division=${newDivision}`;
                              }
                              const response = await fetch(url);
                              const data = await response.json();
                              if (response.ok) {
                                setVillageList(data.villages || []);
                              }
                            } catch {
                              console.error('Failed to load villages');
                            } finally {
                              setVoterSearchLoading(false);
                            }
                          }, 50);
                        }
                      }}
                      className={styles.select}
                    >
                      <option value="">All / सर्व</option>
                      <option value="60">60 - कसबा नुल</option>
                      <option value="61">61 - हलकर्णी</option>
                      <option value="62">62 - भडगांव</option>
                      <option value="63">63 - गिजवणे</option>
                      <option value="64">64 - नेसरी</option>
                    </select>
                  </div>
                  
                  <div className={styles.filterGroup}>
                    <label>Ward/Gan / गण:</label>
                    <select 
                      value={searchWardFilter} 
                      onChange={(e) => {
                        const newWard = e.target.value;
                        setSearchWardFilter(newWard);
                        if (voterSearchType === 'village') {
                          setVillageList([]);
                          // Fetch with new ward value directly (state update is async)
                          setTimeout(async () => {
                            setVoterSearchLoading(true);
                            try {
                              let url = '/api/voters/village?list=true';
                              if (searchDivisionFilter) {
                                url += `&division=${searchDivisionFilter}`;
                              }
                              if (newWard) {
                                url += `&ward=${newWard}`;
                              }
                              const response = await fetch(url);
                              const data = await response.json();
                              if (response.ok) {
                                setVillageList(data.villages || []);
                              }
                            } catch {
                              console.error('Failed to load villages');
                            } finally {
                              setVoterSearchLoading(false);
                            }
                          }, 50);
                        }
                      }}
                      className={styles.select}
                      disabled={!searchDivisionFilter}
                    >
                      <option value="">All Wards / सर्व गण</option>
                      {searchDivisionFilter && getWardOptionsForDivision(searchDivisionFilter).map(ward => (
                        <option key={ward.no} value={ward.no}>{ward.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* EPIC Search */}
              {voterSearchType === 'epic' && (
                <>
                  <p className={styles.voterLookupIntro}>
                    Find voter details using EPIC (Voter ID) number.
                    <br />
                    EPIC क्रमांक वापरून मतदाराची माहिती शोधा.
                  </p>
                  
                  <div className={styles.voterLookupSearchBox}>
                    <input
                      type="text"
                      placeholder="Enter EPIC Number (e.g., AOP7398431)"
                      value={epicSearch}
                      onChange={(e) => {
                        setEpicSearch(e.target.value.toUpperCase());
                        setApiEpicResult(null);
                        setVoterSearchError(null);
                      }}
                      className={styles.epicSearchInput}
                      maxLength={15}
                    />
                    <button 
                      className={styles.epicSearchButton}
                      onClick={() => searchByEpicApi(epicSearch.trim().toUpperCase())}
                      disabled={epicSearch.length < 6 || voterSearchLoading}
                    >
                      {voterSearchLoading ? '⏳' : '🔍'} Search
                    </button>
                  </div>

                  {apiEpicResult && (
                    <div className={styles.epicResultCard} style={{ 
                      background: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)',
                      border: '2px solid #48bb78'
                    }}>
                      <h3 className={styles.epicResultTitle}>✅ Voter Found!</h3>
                      <div className={styles.epicResultGrid}>
                        {apiEpicResult.name && (
                          <div className={styles.epicResultItem}>
                            <div className={styles.epicResultIcon}>👤</div>
                            <div className={styles.epicResultContent}>
                              <div className={styles.epicResultLabel}>Name / नाव</div>
                              <div className={styles.epicResultValue}>{apiEpicResult.name}</div>
                            </div>
                          </div>
                        )}
                        {apiEpicResult.age && (
                          <div className={styles.epicResultItem}>
                            <div className={styles.epicResultIcon}>🎂</div>
                            <div className={styles.epicResultContent}>
                              <div className={styles.epicResultLabel}>Age & Gender</div>
                              <div className={styles.epicResultValue}>{apiEpicResult.age} yrs | {apiEpicResult.gender}</div>
                            </div>
                          </div>
                        )}
                        {apiEpicResult.village && (
                          <div className={styles.epicResultItem}>
                            <div className={styles.epicResultIcon}>🏠</div>
                            <div className={styles.epicResultContent}>
                              <div className={styles.epicResultLabel}>Village / गाव</div>
                              <div className={styles.epicResultValue}>{apiEpicResult.village}</div>
                            </div>
                          </div>
                        )}
                        <div className={styles.epicResultItem}>
                          <div className={styles.epicResultIcon}>🏛️</div>
                          <div className={styles.epicResultContent}>
                            <div className={styles.epicResultLabel}>ZP Division</div>
                            <div className={styles.epicResultValue}>{apiEpicResult.division}</div>
                          </div>
                        </div>
                        <div className={styles.epicResultItem}>
                          <div className={styles.epicResultIcon}>🏘️</div>
                          <div className={styles.epicResultContent}>
                            <div className={styles.epicResultLabel}>PS Ward</div>
                            <div className={styles.epicResultValue}>{apiEpicResult.ward}</div>
                          </div>
                        </div>
                        {apiEpicResult.serialNumber && (
                          <div className={styles.epicResultItem}>
                            <div className={styles.epicResultIcon}>🔢</div>
                            <div className={styles.epicResultContent}>
                              <div className={styles.epicResultLabel}>Serial Number / क्रमांक</div>
                              <div className={styles.epicResultValue}>{apiEpicResult.serialNumber}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {voterSearchError && voterSearchType === 'epic' && (
                    <div className={styles.epicResultCard} style={{ 
                      background: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                      border: '2px solid #f56565'
                    }}>
                      <h3 className={styles.epicResultTitle}>❌ {voterSearchError}</h3>
                      <p className={styles.epicLimitNote}>
                        <small>📋 Currently indexed: Gadhinglaj Taluka (Divisions 61-64)</small>
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Name Search */}
              {voterSearchType === 'name' && (
                <>
                  <p className={styles.voterLookupIntro}>
                    Search voters by name (partial match). Shows up to 50 results per page.
                    <br />
                    नावाने मतदार शोधा. प्रति पृष्ठ ५० परिणाम दाखवते.
                  </p>
                  
                  <div className={styles.voterLookupSearchBox}>
                    <input
                      type="text"
                      placeholder="Enter name / नाव टाका (e.g., पाटील, राम)"
                      value={nameSearch}
                      onChange={(e) => {
                        setNameSearch(e.target.value);
                        setVoterSearchError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && nameSearch.length >= 2) {
                          searchByName(nameSearch.trim());
                        }
                      }}
                      className={styles.epicSearchInput}
                      style={{ textTransform: 'none' }}
                    />
                    <button 
                      className={styles.epicSearchButton}
                      onClick={() => searchByName(nameSearch.trim())}
                      disabled={nameSearch.length < 2 || voterSearchLoading}
                    >
                      {voterSearchLoading ? '⏳' : '🔍'} Search
                    </button>
                  </div>

                  {nameSearchResults.length > 0 && (
                    <div className={styles.searchResultsList}>
                      <div className={styles.resultsHeader}>
                        <h4 className={styles.resultsTitle}>
                          🔍 Found {nameSearchTotal.toLocaleString()} voters 
                          {nameSearchTotal > 20 && ` (showing ${nameSearchResults.length})`}
                        </h4>
                        <button 
                          className={`${styles.exportButton} ${styles.exportButtonDisabled}`}
                          disabled
                          title="🔒 Premium feature - Get in touch to unlock"
                        >
                          📥 Export CSV 🔒
                        </button>
                      </div>
                      {nameSearchResults.map((voter, idx) => (
                        <div key={idx} className={styles.voterResultCard}>
                          <div className={styles.voterResultMain}>
                            <span className={styles.voterName}>{voter.name}</span>
                            <span className={styles.voterMeta}>{voter.age} yrs | {voter.gender}</span>
                          </div>
                          <div className={styles.voterResultDetails}>
                            <span>🏠 {voter.village}</span>
                            <span>🏛️ Div {voter.divisionNo}</span>
                            <span>🏘️ Ward {voter.wardNo}</span>
                          </div>
                          <div className={styles.voterEpic}>
                            <span>EPIC: {voter.epicId}</span>
                            {voter.serialNumber && <span style={{marginLeft: '1rem'}}>Sr: {voter.serialNumber}</span>}
                          </div>
                        </div>
                      ))}
                      
                      {nameSearchTotal > 20 && (
                        <div className={styles.pagination}>
                          <button 
                            disabled={nameSearchPage <= 1 || voterSearchLoading}
                            onClick={() => searchByName(nameSearch.trim(), nameSearchPage - 1)}
                          >
                            ← Prev
                          </button>
                          <span>Page {nameSearchPage} of {Math.ceil(nameSearchTotal / 50)}</span>
                          <button 
                            disabled={nameSearchPage >= Math.ceil(nameSearchTotal / 50) || voterSearchLoading}
                            onClick={() => searchByName(nameSearch.trim(), nameSearchPage + 1)}
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {voterSearchError && voterSearchType === 'name' && (
                    <div className={styles.searchError}>{voterSearchError}</div>
                  )}
                </>
              )}

              {/* Village Voters */}
              {voterSearchType === 'village' && (
                <>
                  <p className={styles.voterLookupIntro}>
                    Select a village to view all voters with statistics.
                    <br />
                    गावातील सर्व मतदारांची यादी पहा.
                  </p>
                  
                  {!selectedVillageVoters ? (
                    <>
                      {voterSearchLoading ? (
                        <div className={styles.loadingText}>⏳ Loading villages...</div>
                      ) : (
                        <div className={styles.villageGrid}>
                          {villageList.slice(0, 60).map((village, idx) => (
                            <div 
                              key={idx} 
                              className={styles.villageCard}
                              onClick={() => loadVillageVoters(village.name, 1, village.divisionNo, village.wardNo)}
                            >
                              <div className={styles.villageName}>{village.name}</div>
                              <div className={styles.villageStats}>
                                <span>👥 {village.total.toLocaleString()}</span>
                                <span>👨 {village.male}</span>
                                <span>👩 {village.female}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {villageList.length > 60 && (
                        <p className={styles.moreResults}>+ {villageList.length - 60} more villages. Use Division filter to narrow down.</p>
                      )}
                    </>
                  ) : (
                    <div className={styles.villageVotersList}>
                      <button 
                        className={styles.backButton}
                        onClick={() => setSelectedVillageVoters(null)}
                      >
                        ← Back to villages
                      </button>
                      
                      <div className={styles.villageHeader}>
                        <div className={styles.villageHeaderTop}>
                          <h3>🏘️ {selectedVillageVoters.village}</h3>
                          <button 
                            className={`${styles.exportButton} ${styles.exportButtonDisabled}`}
                            disabled
                            title="🔒 Premium feature - Get in touch to unlock"
                          >
                            📥 Export CSV 🔒
                          </button>
                        </div>
                        <div className={styles.villageStatsBar}>
                          <span>👥 Total: {selectedVillageVoters.stats.total.toLocaleString()}</span>
                          <span>👨 Male: {selectedVillageVoters.stats.male.toLocaleString()}</span>
                          <span>👩 Female: {selectedVillageVoters.stats.female.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className={styles.voterTable}>
                        <div className={styles.voterTableHeader}>
                          <span>Sr. No.</span>
                          <span>Name / नाव</span>
                          <span>Age</span>
                          <span>Gender</span>
                          <span>EPIC</span>
                        </div>
                        {selectedVillageVoters.voters.map((voter, idx) => (
                          <div key={idx} className={styles.voterTableRow}>
                            <span>{voter.serialNumber || '-'}</span>
                            <span>{voter.name}</span>
                            <span>{voter.age}</span>
                            <span>{voter.gender}</span>
                            <span>{voter.epicId}</span>
                          </div>
                        ))}
                        
                        {/* Blurred teaser rows */}
                        {selectedVillageVoters.stats.total > 20 && (
                          <div className={styles.blurredRows}>
                            <div className={styles.blurredRow}>
                              <span>██</span>
                              <span>██████ ████████ ██████</span>
                              <span>██</span>
                              <span>████</span>
                              <span>███████████</span>
                            </div>
                            <div className={styles.blurredRow}>
                              <span>██</span>
                              <span>████████ ██████ ████</span>
                              <span>██</span>
                              <span>████</span>
                              <span>███████████</span>
                            </div>
                            <div className={styles.blurredRow}>
                              <span>██</span>
                              <span>██████ ████ ██████████</span>
                              <span>██</span>
                              <span>████</span>
                              <span>███████████</span>
                            </div>
                            <div className={styles.blurOverlay}>
                              <span className={styles.blurLock}>🔒</span>
                              <span className={styles.blurText}>
                                +{(selectedVillageVoters.stats.total - 20).toLocaleString()} more voters
                              </span>
                              <a 
                                href="mailto:inbox.dpatil@gmail.com?subject=Unlock Voter Data - Village: ${selectedVillageVoters.village}"
                                className={styles.blurUnlock}
                              >
                                Unlock Full List →
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Campaign Insights Premium Card */}
                      <div className={styles.premiumCard}>
                        <div className={styles.premiumHeader}>
                          <span className={styles.premiumBadge}>🔒 Premium</span>
                          <h4>🎯 Campaign Insights</h4>
                        </div>
                        <div className={styles.premiumFeatures}>
                          <div className={styles.premiumFeature}>
                            <span>✨</span>
                            <span>First-time Voters (18-21)</span>
                            <span className={styles.premiumBlur}>████</span>
                          </div>
                          <div className={styles.premiumFeature}>
                            <span>👴</span>
                            <span>Senior Voters (60+)</span>
                            <span className={styles.premiumBlur}>████</span>
                          </div>
                          <div className={styles.premiumFeature}>
                            <span>📍</span>
                            <span>Section-wise Breakdown</span>
                            <span className={styles.premiumBlur}>████</span>
                          </div>
                          <div className={styles.premiumFeature}>
                            <span>📥</span>
                            <span>Export Full CSV/Excel</span>
                            <span className={styles.premiumBlur}>████</span>
                          </div>
                        </div>
                        <a 
                          href="mailto:inbox.dpatil@gmail.com?subject=Campaign Insights Request - Kolhapur Elections"
                          className={styles.premiumCta}
                        >
                          📩 Get in Touch for Full Access
                        </a>
                      </div>

                      {/* Pagination disabled - premium feature */}
                    </div>
                  )}
                </>
              )}

              <div className={styles.voterLookupInfo}>
                <h4>📋 Coverage / माहिती</h4>
                <ul>
                  <li>✅ Gadhinglaj Taluka - Divisions 60-64 ({(170193).toLocaleString()} voters)</li>
                  <li>⏳ Other talukas coming soon / इतर तालुके लवकरच</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Floating Campaign Data CTA - Desktop */}
      <a 
        href="mailto:inbox.dpatil@gmail.com?subject=Campaign Data Request - Kolhapur Elections&body=Hi,%0D%0A%0D%0AI am interested in getting voter data for my political campaign.%0D%0A%0D%0ATaluka/Division: %0D%0APurpose: %0D%0AContact Number: %0D%0A" 
        className={styles.floatingCampaign}
        title="Get voter data for campaigns"
      >
        <span className={styles.campaignIcon}>📊</span>
        <span className={styles.campaignText}>
          <span className={styles.campaignLine1}>Campaign Data?</span>
          <span className={styles.campaignLine2}>Get in Touch →</span>
        </span>
      </a>
      
      {/* Mobile Bottom Sticky CTA Bar */}
      <a 
        href="mailto:inbox.dpatil@gmail.com?subject=Campaign Data Request - Kolhapur Elections&body=Hi,%0D%0A%0D%0AI am interested in getting voter data for my political campaign.%0D%0A%0D%0ATaluka/Division: %0D%0APurpose: %0D%0AContact Number: %0D%0A" 
        className={styles.mobileBottomCta}
      >
        <span className={styles.mobileCtaIcon}>🎯</span>
        <span className={styles.mobileCtaText}>Need Campaign Data? Get in Touch</span>
        <span className={styles.mobileCtaArrow}>→</span>
      </a>

      {/* Floating Feedback Button */}
      <a 
        href="mailto:inbox.dpatil@gmail.com?subject=Kolhapur Elections App - Suggestion&body=Hi Deepak,%0D%0A%0D%0AMy suggestion/feature request:%0D%0A%0D%0A" 
        className={styles.floatingFeedback}
        title="Share your ideas!"
      >
        <span className={styles.feedbackIcon}>💡</span>
        <span className={styles.feedbackText}>
          <span className={styles.feedbackLine1}>Got an idea?</span>
          <span className={styles.feedbackLine2}>Request a feature!</span>
        </span>
      </a>

      {/* Voter Analytics Modal */}
      {selectedSeat && (
        <div className={styles.modalOverlay} onClick={() => { setSelectedSeat(null); setSeatAnalytics(null); setSeatAnalyticsNotFound(false); }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => { setSelectedSeat(null); setSeatAnalytics(null); setSeatAnalyticsNotFound(false); }}>
              ✕
            </button>
            
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                📍 {selectedSeat.seatNumber}
              </h2>
              <p className={styles.modalSubtitle}>
                {selectedSeat.electionType === 'Zilla Parishad' ? '🏛️ Zilla Parishad' : '🏘️ Panchayat Samiti'}
                {selectedSeat.taluka && ` | ${selectedSeat.taluka} Taluka`}
              </p>
              <div className={styles.modalBadges}>
                <span 
                  className={styles.modalBadge}
                  style={{ background: getCategoryColor(selectedSeat.category) }}
                >
                  {selectedSeat.category}
                </span>
                {selectedSeat.isWomenReserved && (
                  <span className={styles.modalBadgeWomen}>Women Reserved</span>
                )}
              </div>
              
              {/* Eligibility Info Banner */}
              <div className={styles.eligibilityBanner}>
                <div className={styles.bannerIcon}>🎯</div>
                <div className={styles.bannerContent}>
                  <div className={styles.bannerTitle}>Who Can Contest / कोण उमेदवारी भरू शकतो</div>
                  <div className={styles.bannerText}>
                    {selectedSeat.category === 'General' && !selectedSeat.isWomenReserved && (
                      <span>✅ All categories | सर्व वर्गातील उमेदवार</span>
                    )}
                    {selectedSeat.category === 'General' && selectedSeat.isWomenReserved && (
                      <span>✅ Women from all categories | सर्व वर्गातील महिला उमेदवार</span>
                    )}
                    {selectedSeat.category === 'SC' && !selectedSeat.isWomenReserved && (
                      <span>✅ Only SC category | केवळ अनुसूचित जाती वर्गातील उमेदवार</span>
                    )}
                    {selectedSeat.category === 'SC' && selectedSeat.isWomenReserved && (
                      <span>✅ Only SC Women | केवळ अनुसूचित जाती वर्गातील महिला उमेदवार</span>
                    )}
                    {selectedSeat.category === 'ST' && !selectedSeat.isWomenReserved && (
                      <span>✅ Only ST category | केवळ अनुसूचित जमाती वर्गातील उमेदवार</span>
                    )}
                    {selectedSeat.category === 'ST' && selectedSeat.isWomenReserved && (
                      <span>✅ Only ST Women | केवळ अनुसूचित जमाती वर्गातील महिला उमेदवार</span>
                    )}
                    {selectedSeat.category === 'OBC' && !selectedSeat.isWomenReserved && (
                      <span>✅ Only OBC category | केवळ मागासवर्ग उमेदवार</span>
                    )}
                    {selectedSeat.category === 'OBC' && selectedSeat.isWomenReserved && (
                      <span>✅ Only OBC Women | केवळ मागासवर्ग महिला उमेदवार</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalBody}>
              {/* Voter Analytics Section - Always from Neon API */}
              {(() => {
                // Fetch from API if not already fetched
                if (!seatAnalytics && !seatAnalyticsLoading && !seatAnalyticsNotFound) {
                  fetchSeatAnalytics(selectedSeat.seatNumber, selectedSeat.electionType);
                }
                
                if (seatAnalyticsLoading) {
                  return (
                    <div className={styles.comingSoonSection}>
                      <div className={styles.comingSoonIcon}>⏳</div>
                      <h3 className={styles.comingSoonTitle}>Loading Analytics...</h3>
                    </div>
                  );
                }
                
                if (seatAnalyticsNotFound) {
                  return (
                    <div className={styles.comingSoonSection}>
                      <div className={styles.comingSoonIcon}>📋</div>
                      <h3 className={styles.comingSoonTitle}>Data Not Available</h3>
                      <p className={styles.comingSoonText}>
                        या जागेसाठी मतदार यादी उपलब्ध नाही.
                      </p>
                      <p className={styles.requestDataText}>
                        Want voter analytics for this seat?
                      </p>
                      <a 
                        href={`mailto:inbox.dpatil@gmail.com?subject=Request%20Voter%20Data%20-%20${encodeURIComponent(selectedSeat.seatNumber)}`}
                        className={styles.requestDataButton}
                      >
                        📩 Request Data / डेटा विनंती करा
                      </a>
                    </div>
                  );
                }
                
                if (seatAnalytics) {
                  return (
                    <div className={styles.voterAnalytics}>
                      <div className={styles.draftNotice}>
                        📋 Draft Voter List / मसुदा मतदार यादी (08-10-2025)
                      </div>

                      <div className={styles.totalVotersCard}>
                        <div className={styles.totalVotersNumber}>{seatAnalytics.total.toLocaleString()}</div>
                        <div className={styles.totalVotersLabel}>Total Voters / एकूण मतदार</div>
                      </div>

                      <div className={styles.analyticsCard}>
                        <h4 className={styles.analyticsTitle}>👫 Gender Distribution / लिंग विभाजन</h4>
                        <div className={styles.genderStats}>
                          <div className={styles.genderBar}>
                            <div className={styles.genderBarMale} style={{ width: `${seatAnalytics.gender.malePercent}%` }} />
                            <div className={styles.genderBarFemale} style={{ width: `${seatAnalytics.gender.femalePercent}%` }} />
                            {seatAnalytics.gender.other > 0 && (
                              <div className={styles.genderBarOther} style={{ width: `${seatAnalytics.gender.otherPercent}%` }} />
                            )}
                          </div>
                          <div className={styles.genderLabels}>
                            <div className={styles.genderItem}>
                              <span className={styles.genderDotMale}>●</span>
                              <span>पुरुष / Male</span>
                              <strong>{seatAnalytics.gender.male.toLocaleString()} ({seatAnalytics.gender.malePercent}%)</strong>
                            </div>
                            <div className={styles.genderItem}>
                              <span className={styles.genderDotFemale}>●</span>
                              <span>स्त्री / Female</span>
                              <strong>{seatAnalytics.gender.female.toLocaleString()} ({seatAnalytics.gender.femalePercent}%)</strong>
                            </div>
                            {seatAnalytics.gender.other > 0 && (
                              <div className={styles.genderItem}>
                                <span className={styles.genderDotOther}>●</span>
                                <span>Unclassified</span>
                                <strong className={styles.unclassifiedText}>{seatAnalytics.gender.other.toLocaleString()} <small>(data missing)</small></strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {seatAnalytics.ageGroups && (
                        <div className={styles.analyticsCard}>
                          <h4 className={styles.analyticsTitle}>📊 Age Distribution / वयोगटानुसार</h4>
                          <div className={styles.ageGroupsList}>
                            {Object.entries(seatAnalytics.ageGroups).map(([range, count]) => {
                              const percent = ((count as number) / seatAnalytics.total * 100).toFixed(1);
                              return (
                                <div key={range} className={styles.ageGroupRow}>
                                  <div className={styles.ageGroupLabel}>{range}</div>
                                  <div className={styles.ageGroupBarContainer}>
                                    <div className={styles.ageGroupBar} style={{ width: `${percent}%` }} />
                                  </div>
                                  <div className={styles.ageGroupStats}>
                                    {(count as number).toLocaleString()} ({percent}%)
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {seatAnalytics.specialCategories?.firstTimeVoters && (
                            <div className={styles.firstTimeVoters}>
                              <span className={styles.firstTimeIcon}>✨</span>
                              <span>First-time Voters (18-21):</span>
                              <strong>{seatAnalytics.specialCategories.firstTimeVoters.toLocaleString()}</strong>
                            </div>
                          )}
                        </div>
                      )}

                      <p className={styles.dataSource}>
                        📋 Live data from Neon Database
                        <br />
                        <small>⚠️ Draft list / अंतिम यादीत बदल होऊ शकतात</small>
                      </p>

                      {/* Premium Upsell Teaser */}
                      <div className={styles.premiumTeaser}>
                        <div className={styles.premiumTeaserHeader}>
                          <span className={styles.premiumTeaserLock}>🔒</span>
                          <span>UNLOCK FULL DATA</span>
                        </div>
                        <ul className={styles.premiumTeaserList}>
                          <li>📋 Complete voter list with names</li>
                          <li>🏘️ Village-wise breakdown</li>
                          <li>📥 Export to CSV/Excel</li>
                          <li>🔢 Serial numbers & addresses</li>
                        </ul>
                        <a 
                          href={`mailto:inbox.dpatil@gmail.com?subject=Full Voter Data Request - ${selectedSeat.divisionName} (${selectedSeat.electionType})&body=Hi,%0D%0A%0D%0AI am interested in getting full voter data for:%0D%0A%0D%0ASeat: ${selectedSeat.divisionName} (${selectedSeat.seatNumber})%0D%0AElection: ${selectedSeat.electionType}%0D%0A%0D%0APurpose: %0D%0AContact Number: %0D%0A`}
                          className={styles.premiumTeaserButton}
                        >
                          📩 Get Full Access
                        </a>
                      </div>
                    </div>
                  );
                }
                
                return null;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerDisclaimer}>
          <strong>⚠️ Disclaimer:</strong>
          <p>
            This is an unofficial informational tool. Data sourced from official government notifications. 
            Always verify with official documents before taking any action. The developer is not responsible 
            for any decisions made based on this information.
          </p>
        </div>
        
        
        <p className={styles.copyright}>© {new Date().getFullYear()} dspatil. All rights reserved.</p>
        <p className={styles.madeWith}>Made with ❤️ for Kolhapur 🇮🇳</p>
      </footer>

      {/* Map Modal */}
      {mapModal.isOpen && (
        <div className={styles.mapModalOverlay} onClick={() => setMapModal({ ...mapModal, isOpen: false })}>
          <div className={styles.mapModalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.mapModalClose}
              onClick={() => setMapModal({ ...mapModal, isOpen: false })}
            >
              ✕
            </button>
            <div className={styles.mapModalHeader}>
              <h3>📍 {mapModal.title}</h3>
              <p>Viewing: <strong>{mapModal.currentVillage}</strong> ({mapModal.taluka})</p>
            </div>
            <div className={styles.mapModalBody}>
              <iframe
                key={mapModal.currentVillage}
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapModal.currentVillage + ' ' + mapModal.taluka + ' Kolhapur')}&output=embed`}
                width="100%"
                height="350"
                style={{ border: 0, borderRadius: '8px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className={styles.mapVillagesList}>
                <h4>🏘️ Click village to view on map ({mapModal.villages.length}):</h4>
                <div className={styles.mapVillagesGrid}>
                  {mapModal.villages.map((village, idx) => (
                    <button 
                      key={idx}
                      className={`${styles.mapVillageChip} ${mapModal.currentVillage === village ? styles.mapVillageActive : ''}`}
                      onClick={() => setMapModal({ ...mapModal, currentVillage: village })}
                    >
                      {village}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
