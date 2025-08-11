import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Call backend API untuk pertanyaan random
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/pertanyaan/random`);
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching random pertanyaan:', error);
    return NextResponse.json(
      { 
        sukses: false, 
        pesan: 'Terjadi kesalahan saat mengambil pertanyaan random' 
      },
      { status: 500 }
    );
  }
} 