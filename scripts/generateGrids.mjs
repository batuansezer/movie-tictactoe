import fs from 'fs';

const rawData = fs.readFileSync('./data/movies.json', 'utf-8');
const movies = JSON.parse(rawData);

const actorsMap = {};
const directorsMap = {};
const genresMap = {};

movies.forEach(movie => {
  movie.actors.forEach(a => { actorsMap[a] = actorsMap[a] || []; actorsMap[a].push(movie.id); });
  movie.directors.forEach(d => { directorsMap[d] = directorsMap[d] || []; directorsMap[d].push(movie.id); });
  movie.genres.forEach(g => { genresMap[g] = genresMap[g] || []; genresMap[g].push(movie.id); });
});

// Kategorileri kesin sınırlarla ayır
const validGenres = Object.keys(genresMap).filter(g => genresMap[g].length >= 15);
const validDirectors = Object.keys(directorsMap).filter(d => directorsMap[d].length >= 5);
const validStars = Object.keys(actorsMap).filter(a => actorsMap[a].length >= 10);

const validRowCandidates = Object.keys(actorsMap).filter(a => actorsMap[a].length >= 3);
const criteriaMap = { ...actorsMap, ...directorsMap, ...genresMap };
const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

const TARGET_GRIDS = 50;
const generatedGrids = [];
let attempts = 0;

console.log("🧠 Akıllı İnşa Algoritması Başlatıldı (Kilitli Kategoriler)...");

while (generatedGrids.length < TARGET_GRIDS && attempts < 20000) {
  attempts++;

  // KURAL: Sütunlar HER ZAMAN [1 Tür, 1 Yönetmen, 1 Mega Star] formatında olacak.
  const randomGenre = shuffle(validGenres)[0];
  const randomDirector = shuffle(validDirectors)[0];
  const randomStar = shuffle(validStars)[0];
  
  const cols = [randomGenre, randomDirector, randomStar];

 const matchingPeople = validRowCandidates.filter(person => {
    if (person === randomStar) return false;

    const personMovies = criteriaMap[person];
    
    // KURAL: Kesişen filmleri SAYIYORUZ (Sadece var mı diye bakmıyoruz)
    const genreMatches = personMovies.filter(id => criteriaMap[randomGenre].includes(id));
    const directorMatches = personMovies.filter(id => criteriaMap[randomDirector].includes(id));
    const starMatches = personMovies.filter(id => criteriaMap[randomStar].includes(id));

    // Her kesişimde EN AZ 2 ORTAK FİLM olmak zorunda! 
    // Böylece oyuncu birini başka kutuda kullansa bile yedeği kalır.
    return genreMatches.length >= 2 && directorMatches.length >= 2 && starMatches.length >= 2;
  });

  if (matchingPeople.length >= 3) {
    const rows = shuffle(matchingPeople).slice(0, 3);
    
    generatedGrids.push({
      id: generatedGrids.length + 1,
      rows: rows,
      columns: cols
    });
    console.log(`✅ Tablo #${generatedGrids.length} Üretildi: [${cols.join(' | ')}]`);
  }
}

fs.writeFileSync('./data/grids.json', JSON.stringify(generatedGrids, null, 2));

console.log(`\n🎉 İŞLEM BİTTİ!`);
console.log(`${attempts} denemede ${generatedGrids.length} adet kategori-kilitli tablo oluşturuldu.`);