'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './village-analytics.module.css';
import { ReligionPieChart, CommunityBarChart, GenderPieChart, AgeBarChart, SurnameDonutChart, FocusGroupChart, QuickStatsCard } from '@/app/components/VillageCharts';

interface VillageDemographics {
  religion?: Array<{ name: string; nameMr: string; count: number; percentage: number }>;
  community?: Array<{ name: string; nameMr: string; count: number; percentage: number }>;
  gender?: { male: number; female: number; other: number };
  ageGroups?: {
    avgAge: number;
    firstTimeVoters: number;
    young22to25: number;
    age26to35: number;
    age36to45: number;
    age46to60: number;
    seniorCitizens: number;
  };
  topSurnames?: Array<{ name: string; count: number; percentage: string }>;
  topFirstNames?: Array<{ name: string; count: number; percentage: string }>;
  focusGroups?: {
    firstTimeVoters: { male: number; female: number };
    seniorVoters: { male: number; female: number };
  };
  totalVoters?: number;
}

export default function VillageAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const village = params.village as string;
  const decodedVillage = decodeURIComponent(village);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [demographics, setDemographics] = useState<VillageDemographics | null>(null);

  // Check authentication
  useEffect(() => {
    // Check for access token (same as main app)
    const accessToken = localStorage.getItem('election_access_token');
    console.log('Access token found:', accessToken ? 'Yes' : 'No'); // Debug
    
    if (!accessToken) {
      console.log('No access token found, redirecting...');
      // Redirect to main page with message
      alert('Please log in first to access premium analytics');
      window.location.href = '/?tab=voterlookup';
      return;
    }
    
    // Verify the token with API
    fetch(`/api/auth/validate-code?token=${encodeURIComponent(accessToken)}`)
    .then(res => res.json())
    .then(data => {
      console.log('Validation result:', data);
      if (data.valid) {
        setIsAuthenticated(true);
        loadDemographics();
      } else {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('election_access_token');
        window.location.href = '/?tab=voterlookup';
      }
    })
    .catch(err => {
      console.error('Validation error:', err);
      alert('Error verifying access. Please try again.');
      window.location.href = '/?tab=voterlookup';
    });
  }, [village]);

  const loadDemographics = async () => {
    try {
      // Fetch complete analytics data
      const analyticsRes = await fetch(`/api/voters/village-analytics?village=${encodeURIComponent(decodedVillage)}`);
      const analyticsData = await analyticsRes.json();
      
      // Fetch religion & community data
      const demoRes = await fetch(`/api/voters/demographics?village=${encodeURIComponent(decodedVillage)}`);
      const demoData = await demoRes.json();
      
      // Combine both datasets
      setDemographics({
        gender: analyticsData.genderStats,
        ageGroups: analyticsData.ageStats,
        topSurnames: analyticsData.topFirstNames,  // SWAPPED - API returns them reversed
        topFirstNames: analyticsData.topSurnames,  // SWAPPED - API returns them reversed
        focusGroups: {
          firstTimeVoters: analyticsData.firstTimeVotersByGender,
          seniorVoters: analyticsData.seniorVotersByGender
        },
        religion: demoData.religion,
        community: demoData.community,
        totalVoters: analyticsData.total
      });
    } catch (error) {
      console.error('Failed to load demographics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}>🔐 Verifying access...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>📊 Premium Analytics</h1>
          <h2 className={styles.villageName}>{decodedVillage}</h2>
          <p className={styles.subtitle}>समाज विश्लेषण / Community Insights</p>
        </div>
      </div>

      {demographics ? (
        <div className={styles.analyticsGrid}>
          {/* Gender Distribution */}
          {demographics.gender && (
            <div className={styles.analyticsCard}>
              <h3>⚥ Gender Distribution / लिंग वितरण</h3>
              <GenderPieChart 
                male={demographics.gender.male} 
                female={demographics.gender.female} 
                other={demographics.gender.other} 
              />
            </div>
          )}

          {/* Age Distribution */}
          {demographics.ageGroups && (
            <div className={styles.analyticsCard}>
              <h3>📊 Age Distribution / वय वितरण</h3>
              <AgeBarChart {...demographics.ageGroups} />
            </div>
          )}

          {/* Top Surnames */}
          {demographics.topSurnames && demographics.topSurnames.length > 0 && (
            <div className={styles.analyticsCard}>
              <h3>📛 Top Surnames / प्रमुख आडनावे</h3>
              <SurnameDonutChart surnames={demographics.topSurnames} />
            </div>
          )}

          {/* Focus Groups */}
          {demographics.focusGroups && (
            <div className={styles.analyticsCard}>
              <h3>🎯 Focus Groups / लक्ष्य गट</h3>
              <FocusGroupChart 
                firstTimeVoters={demographics.focusGroups.firstTimeVoters}
                seniorVoters={demographics.focusGroups.seniorVoters}
              />
            </div>
          )}

          {/* Top First Names */}
          {demographics.topFirstNames && demographics.topFirstNames.length > 0 && (
            <div className={styles.analyticsCard}>
              <h3>📇 Common First Names / सामान्य नावे</h3>
              <div className={styles.namesList}>
                {demographics.topFirstNames.slice(0, 5).map((name, idx) => (
                  <div key={idx} className={styles.nameItem}>
                    <span className={styles.nameRank}>#{idx + 1}</span>
                    <span className={styles.nameText}>{name.name}</span>
                    <span className={styles.nameCount}>{name.count} ({name.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats Summary */}
          {demographics.gender && demographics.ageGroups && demographics.totalVoters && (
            <div className={styles.analyticsCard}>
              <h3>📊 Quick Stats / त्वरित आकडेवारी</h3>
              <QuickStatsCard
                totalVoters={demographics.totalVoters}
                avgAge={demographics.ageGroups.avgAge || 0}
                genderRatio={0}
                firstTimeVoters={demographics.ageGroups.firstTimeVoters}
                seniorCitizens={demographics.ageGroups.seniorCitizens}
              />
            </div>
          )}
        </div>
      ) : (
        <div className={styles.noData}>
          <p>No analytics data available for this village.</p>
        </div>
      )}

      {/* Important Disclaimer - Before Religion/Community Charts */}
      {demographics && (demographics.religion || demographics.community) && (
        <div className={styles.disclaimer}>
          <span className={styles.disclaimerIcon}>ℹ️</span>
          <div className={styles.disclaimerContent}>
            <strong>Data Accuracy Notice:</strong>
            <p>
              Religion and community data are probabilistic estimates from surname analysis, not official records. Use for reference only.
            </p>
            <p className={styles.disclaimerMr}>
              धर्म व समाज डेटा आडनावावरून अंदाजे आहे, अधिकृत नाही. फक्त संदर्भासाठी वापरा.
            </p>
          </div>
        </div>
      )}

      {/* Religion & Community Charts */}
      {demographics && (
        <div className={styles.analyticsGrid}>
          {/* Religion Distribution */}
          {demographics.religion && demographics.religion.length > 0 && (
            <div className={styles.analyticsCard}>
              <div className={styles.cardHeader}>
                <h3>🕉️ Religion Distribution / धर्म वितरण</h3>
                <span className={styles.estimateBadge} title="Estimated from surname data">
                  📊 Estimated
                </span>
              </div>
              <ReligionPieChart data={demographics.religion} />
              <div className={styles.cardFooter}>
                <small>* Based on surname analysis</small>
              </div>
            </div>
          )}

          {/* Community Distribution */}
          {demographics.community && demographics.community.length > 0 && (
            <div className={styles.analyticsCard}>
              <div className={styles.cardHeader}>
                <h3>👥 Community Distribution / समाज वितरण</h3>
                <span className={styles.estimateBadge} title="Estimated from surname data">
                  📊 Estimated
                </span>
              </div>
              <CommunityBarChart data={demographics.community} />
              <div className={styles.cardFooter}>
                <small>* Based on surname analysis, not official records</small>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <p>© 2026 dspatil. All rights reserved.</p>
        <p>Made with ❤️ for Kolhapur 🇮🇳</p>
      </div>
    </div>
  );
}

