import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pertanyaan, pilihanJawaban, jawabanBenar, kategori, tingkatKesulitan } = body;
    
    // Validasi input
    if (!pertanyaan || !pilihanJawaban || !jawabanBenar || !kategori || !tingkatKesulitan) {
      return NextResponse.json(
        { 
          sukses: false, 
          pesan: 'Semua field harus diisi!' 
        },
        { status: 400 }
      );
    }
    
    // Validasi pilihan jawaban
    if (!pilihanJawaban.a || !pilihanJawaban.b || !pilihanJawaban.c || !pilihanJawaban.d) {
      return NextResponse.json(
        { 
          sukses: false, 
          pesan: 'Semua pilihan jawaban harus diisi!' 
        },
        { status: 400 }
      );
    }
    
    // Validasi jawaban benar
    if (!['a', 'b', 'c', 'd'].includes(jawabanBenar)) {
      return NextResponse.json(
        { 
          sukses: false, 
          pesan: 'Jawaban benar harus a, b, c, atau d!' 
        },
        { status: 400 }
      );
    }
    
    // Call backend API untuk menambah ke Google Sheets
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/pertanyaan/sheets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pertanyaan,
        pilihanJawaban,
        jawabanBenar,
        kategori,
        tingkatKesulitan
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.pesan || `Backend responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      sukses: true,
      pesan: 'Pertanyaan berhasil ditambahkan ke Google Sheets!',
      data: data.data
    });
    
  } catch (error) {
    console.error('Error adding pertanyaan to sheets:', error);
    return NextResponse.json(
      { 
        sukses: false, 
        pesan: error instanceof Error ? error.message : 'Terjadi kesalahan saat menambah pertanyaan ke Google Sheets' 
      },
      { status: 500 }
    );
  }
} 