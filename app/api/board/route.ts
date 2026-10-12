import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'grids.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const grids = JSON.parse(rawData);

    // --- TEST MODU: GÜNLÜK MANTIĞI İPTAL ETTİK ---
    // Her istekte (F5) havuzdan rastgele bir tablo çekecek.
    const randomIndex = Math.floor(Math.random() * grids.length);
    const randomGrid = grids[randomIndex];

    return NextResponse.json({
      boardNumber: randomGrid.id, // Hangi tabloyu çektiğini numaradan anlayabilirsin
      ...randomGrid
    });

  } catch (error) {
    console.error("Board okuma hatası:", error);
    return NextResponse.json({ error: 'Tablo yüklenemedi' }, { status: 500 });
  }
}