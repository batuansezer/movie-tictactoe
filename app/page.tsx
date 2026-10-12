'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [boardNumber, setBoardNumber] = useState<number>(0);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<string[]>([]);
  
  const [activeCell, setActiveCell] = useState<{ row: string, col: string, rowIndex: number, colIndex: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [grid, setGrid] = useState<any[][]>(Array(3).fill(null).map(() => Array(3).fill(null)));
  const [score, setScore] = useState(0);

  useEffect(() => {
    const initializeGame = async () => {
      try {
        const res = await fetch('/api/board');
        const data = await res.json();
        setColumns(data.columns);
        setRows(data.rows);
        setBoardNumber(data.boardNumber);

        const savedData = localStorage.getItem(`cinetactoe_grid_${data.boardNumber}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setGrid(parsedData.grid);
          setScore(parsedData.score);
        }
      } catch (error) {
        console.error("Tablo yüklenemedi:", error);
      }
    };
    initializeGame();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?query=${searchQuery}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Arama hatası:", error);
    }
    setIsSearching(false);
  };

  const handleMovieSelect = async (movie: any) => {
    if (!activeCell) return;

    // KURAL 1: Aynı filmi tekrar kullanmayı yasakla
    const isAlreadyUsed = grid.flat().some(cell => cell && cell.id === movie.id);
    if (isAlreadyUsed) {
      alert(`❌ "${movie.title}" filmini zaten tahtada kullandın! Başka bir film seçmelisin.`);
      return;
    }

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: movie.id,
          rowCriterion: activeCell.row,
          colCriterion: activeCell.col
        })
      });

      const validationData = await res.json();

      if (validationData.isValid) {
        const newGrid = [...grid];
        newGrid[activeCell.rowIndex][activeCell.colIndex] = {
          id: movie.id, // ID'yi kaydediyoruz
          title: validationData.movieTitle,
          poster_path: validationData.poster_path
        };
        const newScore = score + 1;
        
        setGrid(newGrid);
        setScore(newScore);

        localStorage.setItem(`cinetactoe_grid_${boardNumber}`, JSON.stringify({
          grid: newGrid,
          score: newScore
        }));
        
        setActiveCell(null);
        setSearchResults([]);
        setSearchQuery('');
      } else {
        alert(validationData.message || `❌ Yanlış Cevap!\nSeçtiğin Film: ${movie.title}\nBu film "${activeCell.row}" ve "${activeCell.col}" kesişimini sağlamıyor.`);
      }

    } catch (error) {
      console.error("Doğrulama hatası:", error);
    }
  };

  // TEST İÇİN HAFIZAYI SIFIRLAMA FONKSİYONU
  const clearLocalStorage = () => {
    localStorage.removeItem(`cinetactoe_grid_${boardNumber}`);
    window.location.reload();
  };

  if (columns.length === 0 || rows.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-yellow-400 flex flex-col items-center justify-center font-bold text-2xl">
        <span className="animate-pulse">🎬 Günlük Tablo Yaratılıyor...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-12 px-4 relative">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 tracking-wider mb-2">
          🎬 CINE-TAC-TOE
        </h1>
        <p className="text-gray-400 font-semibold mb-2">Grid #{boardNumber}</p>
        <p className="text-yellow-500 font-bold text-lg">Skor: {score} / 9</p>
        
        {/* SIFIRLA BUTONU */}
        <button 
          onClick={clearLocalStorage} 
          className="mt-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
        >
          Tabloyu Sıfırla (Test)
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 w-full max-w-3xl">
        <div className="p-4"></div>
        {columns.map((col, index) => (
          <div key={`col-${index}`} className="p-3 bg-gray-800 rounded-lg flex items-center justify-center font-bold text-center text-sm md:text-base border border-gray-700">
            {col}
          </div>
        ))}

        {rows.map((row, rowIndex) => (
          <div className="contents" key={`row-group-${rowIndex}`}>
            <div className="p-3 bg-gray-800 rounded-lg flex items-center justify-center font-bold text-center text-sm md:text-base border border-gray-700">
              {row}
            </div>

            {[0, 1, 2].map((colIndex) => {
              const cellData = grid[rowIndex][colIndex];
              return (
                <button
                  key={`cell-${rowIndex}-${colIndex}`}
                  className={`aspect-square bg-gray-800/50 rounded-lg flex flex-col items-center justify-center transition-all border-2 overflow-hidden ${
                    cellData ? 'border-green-500 cursor-default' : 'border-dashed border-gray-600 hover:border-yellow-400 hover:bg-gray-700 group cursor-pointer'
                  }`}
                  onClick={() => !cellData && setActiveCell({ row, col: columns[colIndex], rowIndex, colIndex })}
                  disabled={!!cellData}
                >
                  {cellData ? (
                    cellData.poster_path ? (
                         <img src={`https://image.tmdb.org/t/p/w154${cellData.poster_path}`} alt={cellData.title} className="w-full h-full object-cover opacity-90" />
                      ) : (
                         <span className="text-sm text-center p-2 font-bold">{cellData.title}</span>
                      )
                  ) : (
                    <span className="text-gray-500 text-4xl group-hover:text-yellow-400 transition-colors opacity-50">+</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {activeCell && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-yellow-400">Film Seç</h3>
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-white">{activeCell.row}</span> & <span className="font-semibold text-white">{activeCell.col}</span>
                </p>
              </div>
              <button onClick={() => { setActiveCell(null); setSearchResults([]); setSearchQuery(''); }} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input type="text" placeholder="Film adı yazın..." className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-400" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
              <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-4 py-2 rounded-lg transition-colors">Ara</button>
            </form>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {isSearching ? <p className="text-center text-gray-400 py-4">Aranıyor...</p> : 
                searchResults.length > 0 ? searchResults.map((movie) => (
                  <div key={movie.id} onClick={() => handleMovieSelect(movie)} className="flex items-center gap-3 p-2 bg-gray-900 rounded-lg hover:bg-gray-700 cursor-pointer border border-transparent hover:border-yellow-400 transition-all">
                    {movie.poster_path ? <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt={movie.title} className="w-10 h-14 object-cover rounded" /> : <div className="w-10 h-14 bg-gray-800 rounded flex items-center justify-center text-xs text-center p-1 text-gray-500">Afiş Yok</div>}
                    <div><h4 className="font-bold text-sm">{movie.title}</h4><p className="text-xs text-gray-400">{movie.release_date?.split('-')[0]}</p></div>
                  </div>
                )) : searchQuery && !isSearching ? <p className="text-center text-gray-400 py-4">Film bulunamadı.</p> : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}