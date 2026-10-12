import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { itemId, itemType, itemName, itemImage, rowCriterion, colCriterion } = await request.json();

    let isRowValid = false;
    let isColValid = false;

    if (itemType === 'movie') {
      // 1. SENARYO: KULLANICI FİLM GİRDİ
      const TMDB_TOKEN = process.env.TMDB_API_TOKEN;
      const headers = { accept: 'application/json', Authorization: `Bearer ${TMDB_TOKEN}` };

      const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${itemId}/credits`, { headers });
      const creditsData = await creditsRes.json();
      const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${itemId}?language=tr-TR`, { headers });
      const detailsData = await detailsRes.json();

      const checkMovieCriterion = (criterion: string) => {
        if (creditsData.cast?.some((p: any) => p.name.toLowerCase() === criterion.toLowerCase())) return true;
        if (creditsData.crew?.some((p: any) => p.job === 'Director' && p.name.toLowerCase() === criterion.toLowerCase())) return true;
        const normalized = criterion.toLowerCase().replace(/\s/g, '');
        if (detailsData.genres?.some((g: any) => g.name.toLowerCase().replace(/\s/g, '') === normalized)) return true;
        const collectionName = detailsData.belongs_to_collection?.name?.replace(/ Koleksiyonu| Serisi| Collection/gi, "").trim().toLowerCase();
        if (collectionName && collectionName.includes(criterion.toLowerCase())) return true;
        return false;
      };

      isRowValid = checkMovieCriterion(rowCriterion);
      isColValid = checkMovieCriterion(colCriterion);

    } else if (itemType === 'person') {
      // 2. SENARYO: KULLANICI OYUNCU VEYA YÖNETMEN GİRDİ
      // Kişinin doğrulaması için detaylı veritabanımızı (movies.json) kullanıyoruz
      const filePath = path.join(process.cwd(), 'data', 'movies.json');
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const movies = JSON.parse(rawData);

      // Oyuncunun bizim sistemdeki filmlerini bul
      const personMovies = movies.filter((m: any) => 
        m.actors.some((a: string) => a.toLowerCase() === itemName.toLowerCase()) ||
        m.directors.some((d: string) => d.toLowerCase() === itemName.toLowerCase())
      );

      const checkPersonCriterion = (criterion: string) => {
        return personMovies.some((m: any) => {
          if (m.actors.some((a: string) => a.toLowerCase() === criterion.toLowerCase())) return true;
          if (m.directors.some((d: string) => d.toLowerCase() === criterion.toLowerCase())) return true;
          const normalized = criterion.toLowerCase().replace(/\s/g, '');
          if (m.genres.some((g: string) => g.toLowerCase().replace(/\s/g, '') === normalized)) return true;
          if (m.franchise && m.franchise.toLowerCase().includes(criterion.toLowerCase())) return true;
          return false;
        });
      };

      isRowValid = checkPersonCriterion(rowCriterion);
      isColValid = checkPersonCriterion(colCriterion);
    }

    const isValid = isRowValid && isColValid;

    if (isValid) {
      return NextResponse.json({ isValid: true, title: itemName, poster_path: itemImage });
    } else {
      return NextResponse.json({ isValid: false, message: `❌ Yanlış Cevap.\n${itemName}, "${rowCriterion}" ve "${colCriterion}" kesişimini sağlamıyor.` });
    }

  } catch (error) {
    console.error("Doğrulama Hatası:", error);
    return NextResponse.json({ error: 'Doğrulama hatası' }, { status: 500 });
  }
}