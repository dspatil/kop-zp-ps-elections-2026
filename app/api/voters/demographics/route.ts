import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import surnameMapping from '@/data/surname-mapping.json';

// Helper function to extract surname (first word of name)
function extractSurname(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') return '';
  const words = fullName.trim().split(/\s+/);
  return words[0] || '';
}

// Helper function to normalize surname for matching
function normalizeSurname(surname: string): string {
  if (!surname) return '';
  return surname.toLowerCase().trim();
}

// Create lookup map for faster surname matching
const surnameMap = new Map(
  surnameMapping.surnames.map(s => [
    normalizeSurname(s.surname),
    {
      religion: s.religion,
      religionMr: s.religionMr,
      community: s.community,
      communityMr: s.communityMr
    }
  ])
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const village = searchParams.get('village');
    const division = searchParams.get('division');
    const ward = searchParams.get('ward');

    if (!village) {
      return NextResponse.json(
        { error: 'Village parameter is required' },
        { status: 400 }
      );
    }

    // Build WHERE clause
    const conditions = ['LOWER(village) = LOWER($1)'];
    const params: any[] = [village];
    let paramIndex = 2;

    if (division) {
      conditions.push(`zp_division_no = $${paramIndex}`);
      params.push(division);
      paramIndex++;
    }

    if (ward) {
      conditions.push(`ps_ward_no = $${paramIndex}`);
      params.push(ward);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Fetch all voters for this village
    const votersQuery = `
      SELECT name
      FROM voters
      WHERE ${whereClause}
    `;

    const result = await query(votersQuery, params);
    const voters = result.rows;

    if (voters.length === 0) {
      return NextResponse.json({
        religion: [],
        community: []
      });
    }

    // Analyze religion distribution
    const religionCount = new Map<string, { count: number; marathi: string }>();
    
    // Analyze community distribution
    const communityCount = new Map<string, { count: number; marathi: string }>();

    voters.forEach((voter: any) => {
      // Skip if no name
      if (!voter.name) return;

      const surname = extractSurname(voter.name);
      if (!surname) return; // Skip if no surname extracted
      
      const normalizedSurname = normalizeSurname(surname);
      const mapping = surnameMap.get(normalizedSurname);

      // Religion analysis
      if (mapping) {
        const religion = mapping.religion;
        const religionMr = mapping.religionMr;
        const current = religionCount.get(religion) || { count: 0, marathi: religionMr };
        religionCount.set(religion, { count: current.count + 1, marathi: religionMr });

        // Community analysis
        const community = mapping.community;
        const communityMr = mapping.communityMr;
        const currentComm = communityCount.get(community) || { count: 0, marathi: communityMr };
        communityCount.set(community, { count: currentComm.count + 1, marathi: communityMr });
      } else {
        // Unknown
        const unknownRel = religionCount.get('Unknown') || { count: 0, marathi: 'अज्ञात' };
        religionCount.set('Unknown', { count: unknownRel.count + 1, marathi: 'अज्ञात' });

        const unknownComm = communityCount.get('Unknown') || { count: 0, marathi: 'अज्ञात' };
        communityCount.set('Unknown', { count: unknownComm.count + 1, marathi: 'अज्ञात' });
      }
    });

    // Convert to arrays and calculate percentages
    const totalVoters = voters.length;

    const religionData = Array.from(religionCount.entries())
      .map(([name, data]) => ({
        name,
        nameMr: data.marathi,
        count: data.count,
        percentage: parseFloat(((data.count / totalVoters) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count);

    const communityData = Array.from(communityCount.entries())
      .map(([name, data]) => ({
        name,
        nameMr: data.marathi,
        count: data.count,
        percentage: parseFloat(((data.count / totalVoters) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 communities

    return NextResponse.json({
      religion: religionData,
      community: communityData,
      totalVoters
    });

  } catch (error) {
    console.error('Demographics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demographics data' },
      { status: 500 }
    );
  }
}

