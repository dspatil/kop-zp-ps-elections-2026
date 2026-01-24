import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// GET /api/voters/village?name=शैंद्री - Get all voters in a village
// GET /api/voters/village?list=true - Get list of all villages with counts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const villageName = searchParams.get('name');
    const listOnly = searchParams.get('list') === 'true';
    const division = searchParams.get('division');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = (page - 1) * limit;

    // If list=true, return list of villages with counts
    if (listOnly) {
      let villageQuery = `
        SELECT 
          village,
          zp_division_no,
          ps_ward_no,
          COUNT(*) as total,
          SUM(CASE WHEN gender = 'पुरुष' THEN 1 ELSE 0 END) as male,
          SUM(CASE WHEN gender = 'स्त्री' THEN 1 ELSE 0 END) as female
        FROM voters
        WHERE village IS NOT NULL AND village != ''
      `;
      
      const values: any[] = [];
      let paramIndex = 1;
      
      if (division) {
        villageQuery += ` AND zp_division_no = $${paramIndex}`;
        values.push(parseInt(division));
        paramIndex++;
      }
      
      const ward = searchParams.get('ward');
      if (ward) {
        villageQuery += ` AND ps_ward_no = $${paramIndex}`;
        values.push(parseInt(ward));
        paramIndex++;
      }
      
      villageQuery += `
        GROUP BY village, zp_division_no, ps_ward_no
        ORDER BY total DESC
      `;

      const result = await query(villageQuery, values);

      return NextResponse.json({
        total: result.rows.length,
        villages: result.rows.map((v: any) => ({
          name: v.village,
          divisionNo: v.zp_division_no,
          wardNo: v.ps_ward_no,
          total: parseInt(v.total),
          male: parseInt(v.male),
          female: parseInt(v.female)
        }))
      });
    }

    // Get voters for a specific village
    if (!villageName) {
      return NextResponse.json(
        { error: 'Please provide village name' },
        { status: 400 }
      );
    }

    // Build query with optional division/ward filters
    const ward = searchParams.get('ward');
    let whereClause = 'WHERE village = $1';
    const countValues: any[] = [villageName];
    let paramIdx = 2;
    
    if (division) {
      whereClause += ` AND zp_division_no = $${paramIdx}`;
      countValues.push(parseInt(division));
      paramIdx++;
    }
    if (ward) {
      whereClause += ` AND ps_ward_no = $${paramIdx}`;
      countValues.push(parseInt(ward));
      paramIdx++;
    }

    // Get total count for village (with filters)
    const countResult = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN gender = 'पुरुष' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN gender = 'स्त्री' THEN 1 ELSE 0 END) as female
      FROM voters 
      ${whereClause}`,
      countValues
    );

    const stats = countResult.rows[0];
    const total = parseInt(stats.total);

    // Get paginated voter list (with filters)
    const listValues = [...countValues, limit, offset];
    const result = await query(
      `SELECT 
        epic_id, name, age, gender,
        zp_division, ps_ward, serial_number
      FROM voters 
      ${whereClause}
      ORDER BY name
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      listValues
    );

    return NextResponse.json({
      village: villageName,
      stats: {
        total,
        male: parseInt(stats.male),
        female: parseInt(stats.female)
      },
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      voters: result.rows.map((v: any) => ({
        epicId: v.epic_id,
        name: v.name,
        age: v.age,
        gender: v.gender,
        division: v.zp_division,
        ward: v.ps_ward,
        serialNumber: v.serial_number
      }))
    });
  } catch (error) {
    console.error('Village query error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}

