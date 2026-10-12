import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  if (!query) return NextResponse.json({ results: [] });

  const TMDB_TOKEN = process.env.TMDB_API_TOKEN;
  
  // FİLM YA DA KİŞİ SEÇMİYORUZ, "MULTI" (ÇOKLU) ARAMA YAPIYORUZ
  const res = await fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=tr-TR`, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}` }
  });
  const data = await res.json();

  // Sadece Film ve Kişileri (Oyuncu/Yönetmen) al. Dizileri (TV) listeden çıkar.
  const filteredResults = (data.results || []).filter(
    (item: any) => item.media_type === 'movie' || item.media_type === 'person'
  );

  return NextResponse.json({ results: filteredResults });
}