import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// GET /api/voters/family-stats?village=उत्तुर - Get family/surname clustering stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const villageName = searchParams.get('village');
    const division = searchParams.get('division');
    const ward = searchParams.get('ward');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!villageName) {
      return NextResponse.json(
        { error: 'Please provide village name' },
        { status: 400 }
      );
    }

    // Build WHERE clause
    let whereClause = 'WHERE village = $1';
    const values: any[] = [villageName];
    let paramIdx = 2;
    
    if (division) {
      whereClause += ` AND zp_division_no = $${paramIdx}`;
      values.push(parseInt(division));
      paramIdx++;
    }
    if (ward) {
      whereClause += ` AND ps_ward_no = $${paramIdx}`;
      values.push(parseInt(ward));
      paramIdx++;
    }

    // Extract surname (FIRST word in name for Marathi format) and group by it
    const familyQuery = `
      WITH surname_extraction AS (
        SELECT 
          *,
          CASE 
            WHEN name ~ '[[:space:]]' THEN 
              SPLIT_PART(name, ' ', 1)
            ELSE 
              name
          END as surname
        FROM voters
        ${whereClause}
      )
      SELECT 
        surname,
        COUNT(*) as voter_count,
        COUNT(DISTINCT SUBSTRING(serial_number FROM 1 FOR POSITION('/' IN serial_number || '/'))) as household_estimate,
        ROUND(AVG(age)) as avg_age,
        SUM(CASE WHEN gender = 'पुरुष' THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN gender = 'स्त्री' THEN 1 ELSE 0 END) as female_count,
        MIN(age) as youngest,
        MAX(age) as oldest
      FROM surname_extraction
      WHERE surname IS NOT NULL AND surname != ''
      GROUP BY surname
      HAVING COUNT(*) >= 2
      ORDER BY voter_count DESC
      LIMIT $${paramIdx}
    `;

    values.push(limit);

    const result = await query(familyQuery, values);

    return NextResponse.json({
      village: villageName,
      totalFamilies: result.rows.length,
      families: result.rows.map((row: any) => ({
        surname: row.surname,
        voterCount: parseInt(row.voter_count),
        householdEstimate: parseInt(row.household_estimate),
        avgAge: parseInt(row.avg_age),
        maleCount: parseInt(row.male_count),
        femaleCount: parseInt(row.female_count),
        youngest: parseInt(row.youngest),
        oldest: parseInt(row.oldest)
      }))
    });

  } catch (error) {
    console.error('Family stats query error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}
