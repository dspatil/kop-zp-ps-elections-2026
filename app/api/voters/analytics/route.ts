import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// GET /api/voters/analytics - Overall stats
// GET /api/voters/analytics?division=60 - Division stats
// GET /api/voters/analytics?ward=119 - Ward stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const division = searchParams.get('division');
    const ward = searchParams.get('ward');

    let whereClause = '';
    const values: any[] = [];

    if (ward) {
      whereClause = 'WHERE ps_ward_no = $1';
      values.push(parseInt(ward));
    } else if (division) {
      whereClause = 'WHERE zp_division_no = $1';
      values.push(parseInt(division));
    }

    // Main stats query
    // Note: For "other" we need to handle NULL and non-standard gender values
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN gender = 'पुरुष' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN gender = 'स्त्री' THEN 1 ELSE 0 END) as female,
        SUM(CASE WHEN gender IS NULL OR gender NOT IN ('पुरुष', 'स्त्री') THEN 1 ELSE 0 END) as other,
        SUM(CASE WHEN age BETWEEN 18 AND 25 THEN 1 ELSE 0 END) as age_18_25,
        SUM(CASE WHEN age BETWEEN 26 AND 40 THEN 1 ELSE 0 END) as age_26_40,
        SUM(CASE WHEN age BETWEEN 41 AND 60 THEN 1 ELSE 0 END) as age_41_60,
        SUM(CASE WHEN age > 60 THEN 1 ELSE 0 END) as age_60_plus,
        SUM(CASE WHEN age BETWEEN 18 AND 21 THEN 1 ELSE 0 END) as first_time_voters,
        SUM(CASE WHEN age >= 60 THEN 1 ELSE 0 END) as senior_voters
      FROM voters
      ${whereClause}`,
      values
    );

    const stats = statsResult.rows[0];
    const total = parseInt(stats.total);

    if (total === 0) {
      return NextResponse.json(
        { error: 'No data found for the specified criteria' },
        { status: 404 }
      );
    }

    // Get village breakdown if division or ward specified
    let villages = null;
    if (division || ward) {
      const villageResult = await query(
        `SELECT 
          village,
          COUNT(*) as total,
          SUM(CASE WHEN gender = 'पुरुष' THEN 1 ELSE 0 END) as male,
          SUM(CASE WHEN gender = 'स्त्री' THEN 1 ELSE 0 END) as female
        FROM voters
        ${whereClause}
        GROUP BY village
        ORDER BY total DESC`,
        values
      );

      villages = villageResult.rows.map(v => ({
        name: v.village,
        total: parseInt(v.total),
        male: parseInt(v.male),
        female: parseInt(v.female)
      }));
    }

    // Calculate percentages
    const malePercent = ((parseInt(stats.male) / total) * 100).toFixed(1);
    const femalePercent = ((parseInt(stats.female) / total) * 100).toFixed(1);
    const otherPercent = ((parseInt(stats.other) / total) * 100).toFixed(1);

    return NextResponse.json({
      total,
      gender: {
        male: parseInt(stats.male),
        female: parseInt(stats.female),
        other: parseInt(stats.other),
        malePercent: parseFloat(malePercent),
        femalePercent: parseFloat(femalePercent),
        otherPercent: parseFloat(otherPercent)
      },
      ageGroups: {
        '18-25': parseInt(stats.age_18_25),
        '26-40': parseInt(stats.age_26_40),
        '41-60': parseInt(stats.age_41_60),
        '60+': parseInt(stats.age_60_plus)
      },
      specialCategories: {
        firstTimeVoters: parseInt(stats.first_time_voters),
        seniorVoters: parseInt(stats.senior_voters)
      },
      villages
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}

