import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const kategori = searchParams.get('kategori');
    const tingkatKesulitan = searchParams.get('tingkatKesulitan');
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (kategori) queryParams.append('kategori', kategori);
    if (tingkatKesulitan) queryParams.append('tingkatKesulitan', tingkatKesulitan);
    
    // Call backend API untuk Google Sheets
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/pertanyaan/sheets?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching pertanyaan from sheets:', error);
    return NextResponse.json(
      { 
        sukses: false, 
        pesan: 'Terjadi kesalahan saat mengambil data pertanyaan dari Google Sheets' 
      },
      { status: 500 }
    );
  }
} 