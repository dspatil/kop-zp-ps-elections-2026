import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const village = searchParams.get('village');
  const division = searchParams.get('division');
  const ward = searchParams.get('ward');

  if (!village) {
    return NextResponse.json({ error: 'Village name required' }, { status: 400 });
  }

  try {
    // Build WHERE clause
    let whereClause = 'WHERE village = $1';
    const params: any[] = [village];
    let paramIndex = 2;

    if (division) {
      whereClause += ` AND zp_division_no = $${paramIndex}`;
      params.push(parseInt(division));
      paramIndex++;
    }
    if (ward) {
      whereClause += ` AND ps_ward_no = $${paramIndex}`;
      params.push(parseInt(ward));
    }

    // 1. Top Surnames (last word of name)
    const surnamesResult = await query(`
      SELECT 
        TRIM(SPLIT_PART(name, ' ', 
          ARRAY_LENGTH(STRING_TO_ARRAY(TRIM(name), ' '), 1)
        )) as surname,
        COUNT(*) as count
      FROM voters
      ${whereClause}
      AND name IS NOT NULL 
      AND name != ''
      GROUP BY surname
      HAVING COUNT(*) >= 3
      ORDER BY count DESC
      LIMIT 10
    `, params);

    // 2. Age Statistics with Gender Breakdown
    const ageStatsResult = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN age BETWEEN 18 AND 21 THEN 1 ELSE 0 END) as first_time_voters,
        SUM(CASE WHEN age BETWEEN 18 AND 21 AND gender = 'पुरुष' THEN 1 ELSE 0 END) as first_time_male,
        SUM(CASE WHEN age BETWEEN 18 AND 21 AND gender = 'स्त्री' THEN 1 ELSE 0 END) as first_time_female,
        
        SUM(CASE WHEN age BETWEEN 22 AND 25 THEN 1 ELSE 0 END) as young_22_25,
        SUM(CASE WHEN age BETWEEN 22 AND 25 AND gender = 'पुरुष' THEN 1 ELSE 0 END) as young_22_25_male,
        SUM(CASE WHEN age BETWEEN 22 AND 25 AND gender = 'स्त्री' THEN 1 ELSE 0 END) as young_22_25_female,
        
        SUM(CASE WHEN age BETWEEN 26 AND 35 THEN 1 ELSE 0 END) as age_26_35,
        SUM(CASE WHEN age BETWEEN 26 AND 35 AND gender = 'पुरुष' THEN 1 ELSE 0 END) as age_26_35_male,
        SUM(CASE WHEN age BETWEEN 26 AND 35 AND gender = 'स्त्री' THEN 1 ELSE 0 END) as age_26_35_female,
        
        SUM(CASE WHEN age BETWEEN 36 AND 45 THEN 1 ELSE 0 END) as age_36_45,
        SUM(CASE WHEN age BETWEEN 36 AND 45 AND gender = 'पुरुष' THEN 1 ELSE 0 END) as age_36_45_male,
        SUM(CASE WHEN age BETWEEN 36 AND 45 AND gender = 'स्त्री' THEN 1 ELSE 0 END) as age_36_45_female,
        
        SUM(CASE WHEN age BETWEEN 46 AND 60 THEN 1 ELSE 0 END) as age_46_60,
        SUM(CASE WHEN age BETWEEN 46 AND 60 AND gender = 'पुरुष' THEN 1 ELSE 0 END) as age_46_60_male,
        SUM(CASE WHEN age BETWEEN 46 AND 60 AND gender = 'स्त्री' THEN 1 ELSE 0 END) as age_46_60_female,
        
        SUM(CASE WHEN age > 60 THEN 1 ELSE 0 END) as senior_citizens,
        SUM(CASE WHEN age > 60 AND gender = 'पुरुष' THEN 1 ELSE 0 END) as senior_male,
        SUM(CASE WHEN age > 60 AND gender = 'स्त्री' THEN 1 ELSE 0 END) as senior_female,
        
        SUM(CASE WHEN age >= 80 THEN 1 ELSE 0 END) as super_seniors,
        ROUND(AVG(age)::numeric, 1) as avg_age,
        MIN(age) as min_age,
        MAX(age) as max_age
      FROM voters
      ${whereClause}
      AND age IS NOT NULL
    `, params);

    // 3. Gender Distribution
    const genderResult = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN gender = 'पुरुष' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN gender = 'स्त्री' THEN 1 ELSE 0 END) as female,
        SUM(CASE WHEN gender NOT IN ('पुरुष', 'स्त्री') OR gender IS NULL THEN 1 ELSE 0 END) as other
      FROM voters
      ${whereClause}
    `, params);

    // 4. Common First Names
    const firstNamesResult = await query(`
      SELECT 
        TRIM(SPLIT_PART(name, ' ', 1)) as first_name,
        COUNT(*) as count
      FROM voters
      ${whereClause}
      AND name IS NOT NULL 
      AND name != ''
      GROUP BY first_name
      HAVING COUNT(*) >= 3
      ORDER BY count DESC
      LIMIT 10
    `, params);

    // 5. First-time voters by gender
    const firstTimeByGenderResult = await query(`
      SELECT 
        gender,
        COUNT(*) as count
      FROM voters
      ${whereClause}
      AND age BETWEEN 18 AND 21
      GROUP BY gender
    `, params);

    // 6. Senior voters by gender
    const seniorByGenderResult = await query(`
      SELECT 
        gender,
        COUNT(*) as count
      FROM voters
      ${whereClause}
      AND age > 60
      GROUP BY gender
    `, params);

    const ageStats = ageStatsResult.rows[0] || {};
    const genderStats = genderResult.rows[0] || {};
    const total = parseInt(genderStats.total) || 0;

    // Process surnames
    const surnames = surnamesResult.rows.map((r: any) => ({
      name: r.surname,
      count: parseInt(r.count),
      percentage: total > 0 ? ((parseInt(r.count) / total) * 100).toFixed(1) : 0
    }));

    // Process first names
    const firstNames = firstNamesResult.rows.map((r: any) => ({
      name: r.first_name,
      count: parseInt(r.count),
      percentage: total > 0 ? ((parseInt(r.count) / total) * 100).toFixed(1) : 0
    }));

    // Process first-time voters by gender
    const firstTimeByGender: { [key: string]: number } = {};
    firstTimeByGenderResult.rows.forEach((r: any) => {
      firstTimeByGender[r.gender || 'other'] = parseInt(r.count);
    });

    // Process senior voters by gender
    const seniorByGender: { [key: string]: number } = {};
    seniorByGenderResult.rows.forEach((r: any) => {
      seniorByGender[r.gender || 'other'] = parseInt(r.count);
    });

    return NextResponse.json({
      village,
      total,
      
      // Surname Analysis
      topSurnames: surnames,
      
      // Age Statistics with Gender Breakdown
      ageStats: {
        avgAge: parseFloat(ageStats.avg_age) || 0,
        minAge: parseInt(ageStats.min_age) || 0,
        maxAge: parseInt(ageStats.max_age) || 0,
        firstTimeVoters: parseInt(ageStats.first_time_voters) || 0,
        young22to25: parseInt(ageStats.young_22_25) || 0,
        age26to35: parseInt(ageStats.age_26_35) || 0,
        age36to45: parseInt(ageStats.age_36_45) || 0,
        age46to60: parseInt(ageStats.age_46_60) || 0,
        seniorCitizens: parseInt(ageStats.senior_citizens) || 0,
        superSeniors: parseInt(ageStats.super_seniors) || 0,
      },
      
      // Age Groups by Gender (for stacked bars)
      ageGroupsByGender: {
        age18_21: {
          male: parseInt(ageStats.first_time_male) || 0,
          female: parseInt(ageStats.first_time_female) || 0
        },
        age22_25: {
          male: parseInt(ageStats.young_22_25_male) || 0,
          female: parseInt(ageStats.young_22_25_female) || 0
        },
        age26_35: {
          male: parseInt(ageStats.age_26_35_male) || 0,
          female: parseInt(ageStats.age_26_35_female) || 0
        },
        age36_45: {
          male: parseInt(ageStats.age_36_45_male) || 0,
          female: parseInt(ageStats.age_36_45_female) || 0
        },
        age46_60: {
          male: parseInt(ageStats.age_46_60_male) || 0,
          female: parseInt(ageStats.age_46_60_female) || 0
        },
        age60plus: {
          male: parseInt(ageStats.senior_male) || 0,
          female: parseInt(ageStats.senior_female) || 0
        }
      },
      
      // Gender Stats
      genderStats: {
        male: parseInt(genderStats.male) || 0,
        female: parseInt(genderStats.female) || 0,
        other: parseInt(genderStats.other) || 0,
      },
      
      // First Names
      topFirstNames: firstNames,
      
      // Special Groups by Gender
      firstTimeVotersByGender: {
        male: firstTimeByGender['पुरुष'] || 0,
        female: firstTimeByGender['स्त्री'] || 0,
      },
      seniorVotersByGender: {
        male: seniorByGender['पुरुष'] || 0,
        female: seniorByGender['स्त्री'] || 0,
      }
    });

  } catch (error) {
    console.error('Village analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

