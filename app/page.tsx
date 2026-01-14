'use client';

import { useState, useMemo } from 'react';
import { SeatReservation, ReservationCategory, ElectionType } from '@/types/reservation';
import { getAllReservations, filterReservations, getMetadata } from '@/data/sample-data';
import styles from './page.module.css';

type TabType = 'schedule' | 'eligibility' | 'reservations';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  
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

  // Election Schedule - Official dates
  const electionSchedule = [
    { event: 'Nomination Start', eventMr: 'अर्ज सुरू', date: '16 Jan', dateMr: '१६ जाने', status: 'active' },
    { event: 'Nomination End', eventMr: 'अर्ज शेवट', date: '21 Jan', dateMr: '२१ जाने', status: 'upcoming' },
    { event: 'Scrutiny', eventMr: 'छाननी', date: '22 Jan', dateMr: '२२ जाने', status: 'upcoming' },
    { event: 'Withdrawal', eventMr: 'माघार', date: '27 Jan', dateMr: '२७ जाने', status: 'upcoming' },
    { event: 'Polling', eventMr: 'मतदान', date: '5 Feb', dateMr: '५ फेब्रु', status: 'upcoming' },
    { event: 'Counting', eventMr: 'मतमोजणी', date: '7 Feb', dateMr: '७ फेब्रु', status: 'upcoming' },
  ];

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
                    <span className={styles.activeBadge}>NOW</span>
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
            <div className={styles.filterHeader}>
              <h2 className={styles.sectionTitle}>जागानिहाय आरक्षण / Seat-wise Reservations</h2>
              <button 
                className={styles.printButton}
                onClick={() => window.print()}
              >
                🖨️ Print / प्रिंट
              </button>
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
                  <div key={seat.id} className={styles.seatCard}>
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
        <p className={styles.copyright}>© {new Date().getFullYear()} Deepak Shivaji Patil. All rights reserved.</p>
        <p className={styles.madeWith}>Made with ❤️ for Kolhapur 🇮🇳</p>
      </footer>
    </div>
  );
}
