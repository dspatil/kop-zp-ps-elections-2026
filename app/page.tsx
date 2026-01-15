'use client';

import { useState, useMemo } from 'react';
import { SeatReservation, ReservationCategory, ElectionType } from '@/types/reservation';
import { getAllReservations, filterReservations, getMetadata } from '@/data/sample-data';
import wardCompositionData from '@/data/ward-composition.json';
import styles from './page.module.css';

type TabType = 'schedule' | 'eligibility' | 'reservations' | 'nomination' | 'wardmap';

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
  
  // Ward Map state
  const [wardMapType, setWardMapType] = useState<'zp' | 'ps'>('zp');
  const [selectedTaluka, setSelectedTaluka] = useState<string>('');
  const [expandedDivisions, setExpandedDivisions] = useState<Set<number>>(new Set());
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
                    onClick={() => setSelectedSeat(seat)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedSeat(seat)}
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
              Explore constituencies and see all villages in each division/ward.
              <br />
              <span className={styles.descMr}>प्रत्येक विभाग/गणातील सर्व गावे पहा.</span>
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
                          <span className={styles.villageCount}>
                            {division.villages.length} villages
                          </span>
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
                            <span className={styles.villageCount}>
                              {division.wards.length} wards
                            </span>
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
                                      <span className={styles.villageCount}>
                                        {ward.villages.length} villages
                                      </span>
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

      </main>

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
        <div className={styles.modalOverlay} onClick={() => setSelectedSeat(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelectedSeat(null)}>
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
              {/* Coming Soon Section */}
              <div className={styles.comingSoonSection}>
                <div className={styles.comingSoonIcon}>📊</div>
                <h3 className={styles.comingSoonTitle}>Voter Analytics Coming Soon!</h3>
                <p className={styles.comingSoonText}>
                  We're working on bringing you detailed voter statistics including:
                </p>
                <ul className={styles.comingSoonList}>
                  <li>✅ Total voter count</li>
                  <li>✅ Gender-wise distribution</li>
                  <li>✅ Age group analytics</li>
                  <li>✅ Visual charts & insights</li>
                </ul>
                <p className={styles.comingSoonNote}>
                  Data will be updated once official statistics are released by the Election Commission.
                  <br />
                  <strong>Stay tuned!</strong> 🚀
                </p>
              </div>
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
    </div>
  );
}
