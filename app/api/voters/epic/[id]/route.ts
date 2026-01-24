import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const epicId = params.id.toUpperCase().trim();
    
    if (!epicId || epicId.length < 5) {
      return NextResponse.json(
        { error: 'Invalid EPIC ID' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT 
        epic_id, name, age, gender, village,
        zp_division, zp_division_no, ps_ward, ps_ward_no, taluka, serial_number
      FROM voters 
      WHERE epic_id = $1
      LIMIT 1`,
      [epicId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { found: false, message: 'Voter not found' },
        { status: 404 }
      );
    }

    const voter = result.rows[0];
    return NextResponse.json({
      found: true,
      voter: {
        epicId: voter.epic_id,
        name: voter.name,
        age: voter.age,
        gender: voter.gender,
        village: voter.village,
        division: voter.zp_division,
        divisionNo: voter.zp_division_no,
        ward: voter.ps_ward,
        wardNo: voter.ps_ward_no,
        taluka: voter.taluka,
        serialNumber: voter.serial_number
      }
    });
  } catch (error) {
    console.error('EPIC lookup error:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}

