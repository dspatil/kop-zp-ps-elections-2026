import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

// GET /api/voters/village/export?name=... - Get ALL voters for export
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const villageName = searchParams.get('name');
    const division = searchParams.get('division');
    const ward = searchParams.get('ward');

    if (!villageName) {
      return NextResponse.json({ error: 'Village name required' }, { status: 400 });
    }

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

    // Fetch ALL voters (limit 20000 as safety cap)
    // Ordered by serial number for consistent lists
    const result = await query(
      `SELECT 
        serial_number, name, age, gender, epic_id, 
        zp_division_no, ps_ward_no
      FROM voters 
      ${whereClause}
      ORDER BY 
        CASE WHEN serial_number IS NULL THEN 1 ELSE 0 END, 
        CAST(REGEXP_REPLACE(serial_number, '[^0-9]', '', 'g') AS INTEGER),
        name ASC
      LIMIT 20000`,
      values
    );

    return NextResponse.json({
      village: villageName,
      count: result.rows.length,
      voters: result.rows.map((v: any) => ({
        serialNumber: v.serial_number,
        name: v.name,
        age: v.age,
        gender: v.gender,
        epicId: v.epic_id,
        division: v.zp_division_no,
        ward: v.ps_ward_no
      }))
    });
  } catch (error) {
    console.error('Export API Error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
