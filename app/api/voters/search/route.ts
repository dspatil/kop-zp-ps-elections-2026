import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const village = searchParams.get('village');
    const division = searchParams.get('division');
    const ward = searchParams.get('ward');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Default 50, max 100
    const offset = (page - 1) * limit;

    if (!name && !village) {
      return NextResponse.json(
        { error: 'Please provide name or village to search' },
        { status: 400 }
      );
    }

    // Build dynamic query
    let conditions: string[] = [];
    let values: any[] = [];
    let paramIndex = 1;

    if (name) {
      conditions.push(`name ILIKE $${paramIndex}`);
      values.push(`%${name}%`);
      paramIndex++;
    }

    if (village) {
      conditions.push(`village ILIKE $${paramIndex}`);
      values.push(`%${village}%`);
      paramIndex++;
    }

    if (division) {
      conditions.push(`zp_division_no = $${paramIndex}`);
      values.push(parseInt(division));
      paramIndex++;
    }

    if (ward) {
      conditions.push(`ps_ward_no = $${paramIndex}`);
      values.push(parseInt(ward));
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM voters ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const result = await query(
      `SELECT 
        epic_id, name, age, gender, village,
        zp_division, zp_division_no, ps_ward, ps_ward_no, taluka, serial_number
      FROM voters 
      ${whereClause}
      ORDER BY name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return NextResponse.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      voters: result.rows.map((v: any) => ({
        epicId: v.epic_id,
        name: v.name,
        age: v.age,
        gender: v.gender,
        village: v.village,
        division: v.zp_division,
        divisionNo: v.zp_division_no,
        ward: v.ps_ward,
        wardNo: v.ps_ward_no,
        taluka: v.taluka,
        serialNumber: v.serial_number
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}

