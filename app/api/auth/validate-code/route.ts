import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 });
    }
    
    const normalizedCode = code.trim().toUpperCase();
    
    // Query database for the access code
    const result = await query(
      `SELECT id, code, name, customer_name, division_access, ward_access, 
              expiry_date, max_uses, current_uses, is_active 
       FROM access_codes 
       WHERE UPPER(code) = $1`,
      [normalizedCode]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid access code' 
      }, { status: 401 });
    }
    
    const accessInfo = result.rows[0];
    
    // Check if active
    if (!accessInfo.is_active) {
      return NextResponse.json({ 
        valid: false, 
        error: 'This access code has been deactivated' 
      }, { status: 401 });
    }
    
    // Check expiry
    if (accessInfo.expiry_date) {
      const expiryDate = new Date(accessInfo.expiry_date);
      if (new Date() > expiryDate) {
        return NextResponse.json({ 
          valid: false, 
          error: 'This access code has expired' 
        }, { status: 401 });
      }
    }
    
    // Check max uses
    if (accessInfo.max_uses !== null && accessInfo.current_uses >= accessInfo.max_uses) {
      return NextResponse.json({ 
        valid: false, 
        error: 'This access code has reached its usage limit' 
      }, { status: 401 });
    }
    
    // Update usage count and last_used_at
    await query(
      `UPDATE access_codes 
       SET current_uses = current_uses + 1, last_used_at = NOW() 
       WHERE id = $1`,
      [accessInfo.id]
    );
    
    // Create token with code ID for verification
    const token = Buffer.from(`${accessInfo.id}:${normalizedCode}:${Date.now()}`).toString('base64');
    
    // Build display name
    const displayName = accessInfo.customer_name 
      ? `${accessInfo.name} - ${accessInfo.customer_name}`
      : accessInfo.name;
    
    return NextResponse.json({ 
      valid: true, 
      token,
      name: displayName,
      divisionAccess: accessInfo.division_access,
      wardAccess: accessInfo.ward_access,
      expiresAt: accessInfo.expiry_date,
      usesRemaining: accessInfo.max_uses ? (accessInfo.max_uses - accessInfo.current_uses - 1) : null
    });
    
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Server error' 
    }, { status: 500 });
  }
}

// Endpoint to verify if a stored token is still valid
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ valid: false });
  }
  
  try {
    // Decode and verify the token
    const decoded = Buffer.from(token, 'base64').toString();
    const [idStr, code] = decoded.split(':');
    const id = parseInt(idStr);
    
    if (!id || !code) {
      return NextResponse.json({ valid: false });
    }
    
    // Query database for the access code
    const result = await query(
      `SELECT id, name, customer_name, division_access, ward_access, 
              expiry_date, max_uses, current_uses, is_active 
       FROM access_codes 
       WHERE id = $1 AND UPPER(code) = $2`,
      [id, code.toUpperCase()]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ valid: false });
    }
    
    const accessInfo = result.rows[0];
    
    // Check if still active
    if (!accessInfo.is_active) {
      return NextResponse.json({ valid: false, deactivated: true });
    }
    
    // Check expiry
    if (accessInfo.expiry_date) {
      const expiryDate = new Date(accessInfo.expiry_date);
      if (new Date() > expiryDate) {
        return NextResponse.json({ valid: false, expired: true });
      }
    }
    
    // Check max uses (don't increment on verify, only on login)
    if (accessInfo.max_uses !== null && accessInfo.current_uses >= accessInfo.max_uses) {
      return NextResponse.json({ valid: false, usageLimitReached: true });
    }
    
    const displayName = accessInfo.customer_name 
      ? `${accessInfo.name} - ${accessInfo.customer_name}`
      : accessInfo.name;
    
    return NextResponse.json({ 
      valid: true, 
      name: displayName,
      divisionAccess: accessInfo.division_access,
      wardAccess: accessInfo.ward_access,
      usesRemaining: accessInfo.max_uses ? (accessInfo.max_uses - accessInfo.current_uses) : null
    });
    
  } catch (error) {
    console.error('Token verify error:', error);
    return NextResponse.json({ valid: false });
  }
}

