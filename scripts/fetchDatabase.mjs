import fs from 'fs';
import path from 'path';

// TMDB API Okuma Erişim Jetonunu (Bearer Token) buraya yapıştır
const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1YzdkNGIxZjQ2NzRjNzZkNzU5MDQ1NGYyYjQ1ZjEzNSIsIm5iZiI6MTc5MTgyMzk3OS4xOTkwMDAxLCJzdWIiOiI2YWNkMTA2YmJmMDU3M2VlY2ExNTVhMmMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.MdVx1vj595bzAk3DPjAoPos47YQR86qu3PYzQYl0diQ";

const TOTAL_PAGES = 25; // 25 sayfa * 20 film = 500 elit film (Oyun havuzu için mükemmel)
const DELAY_MS = 100; // Saniyede 50 istek limitine (rate limit) takılmamak için

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function buildDatabase() {
  console.log(`🎬 TMDB'den En Popüler ${TOTAL_PAGES * 20} Film Çekiliyor...`);
  let allMovies = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    console.log(`📥 Sayfa ${page}/${TOTAL_PAGES} analiz ediliyor...`);
    
    try {
      // 1. O sayfadaki popüler filmleri al
      const listRes = await fetch(`https://api.themoviedb.org/3/movie/popular?language=tr-TR&page=${page}`, {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}` }
      });
      const listData = await listRes.json();
      
      // 2. Her filmin detayını (oyuncu kadrosu ve türler dahil) tek tek çek
      for (const movie of listData.results) {
        try {
          // append_to_response=credits ile tek istekte hem filmi hem kadroyu alıyoruz
          const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?language=tr-TR&append_to_response=credits`, {
            headers: { Authorization: `Bearer ${TMDB_TOKEN}` }
          });
          const detailData = await detailRes.json();

          // Sadece oyunda kullanacağımız verileri alıp JSON boyutunu küçültüyoruz
          const processedMovie = {
            id: detailData.id,
            title: detailData.title,
            poster_path: detailData.poster_path,
            release_year: detailData.release_date?.split('-')[0] || "",
            genres: detailData.genres?.map(g => g.name) || [],
            // Sadece ana kadroyu alıyoruz (Figüranları eliyoruz)
            actors: detailData.credits?.cast?.slice(0, 15).map(a => a.name) || [],
            directors: detailData.credits?.crew?.filter(c => c.job === 'Director').map(c => c.name) || []
          };

          allMovies.push(processedMovie);
          
          // TMDB engelini aşmak için bekle
          await sleep(DELAY_MS);
        } catch (err) {
          console.error(`❌ Hata: ${movie.title} çekilemedi.`);
        }
      }
    } catch (err) {
      console.error(`❌ Sayfa ${page} alınamadı.`);
    }
  }

  // Veriyi projeye kaydetmek için 'data' klasörü oluştur
  const dir = './data';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  
  // JSON olarak yazdır
  fs.writeFileSync('./data/movies.json', JSON.stringify(allMovies, null, 2));
  console.log(`\n✅ İŞLEM TAMAMLANDI!`);
  console.log(`Toplam ${allMovies.length} film "data/movies.json" dosyasına başarıyla kaydedildi.`);
}

buildDatabase();