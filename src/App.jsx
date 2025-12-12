import React, { useState, useRef, useEffect } from 'react';
import PlayerControls from './components/PlayerControls';
import SongList from './components/SongList';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Search from './components/Search';
import YourLibrary from './components/Library';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songs, setSongs] = useState([
    { id: 1, title: 'Lost in the City', artist: 'Neon Dreams', duration: '3:45', cover: 'https://placehold.co/300x300/181818/1db954?text=LC' },
    { id: 2, title: 'Midnight Drive', artist: 'Synthwave Boy', duration: '4:20', cover: 'https://placehold.co/300x300/282828/1db954?text=MD' },
    { id: 3, title: 'Cyberpunk Soul', artist: 'Future Glitch', duration: '2:55', cover: 'https://placehold.co/300x300/333333/1db954?text=CS' },
    { id: 4, title: 'Ethereal Vibes', artist: 'Chillhop Master', duration: '3:10', cover: 'https://placehold.co/300x300/111111/1db954?text=EV' },
    { id: 5, title: 'Bass Drop', artist: 'Dubstep King', duration: '3:30', cover: 'https://placehold.co/300x300/000000/1db954?text=BD' }
  ]);

  // Placeholder for audio element
  const audioRef = useRef(new Audio());

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Logic to play/pause audioRef
  };

  const handleSongSelect = (song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    // Logic to set audio source
  };

  return (
    <div className="flex h-screen bg-primary text-white overflow-hidden">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />

      <div className="flex-1 flex flex-col relative">
        <Header />

        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-bg-highlight to-bg-primary">
          {currentView === 'home' && (
            <>
              <h2 className="text-2xl font-bold mb-6">Good evening</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Featured Cards / "Jump Back In" */}
                {songs.slice(0, 3).map(song => (
                  <div key={song.id} className="flex items-center bg-bg-highlight bg-opacity-50 hover:bg-opacity-100 transition rounded-md overflow-hidden cursor-pointer group" onClick={() => handleSongSelect(song)}>
                    <img src={song.cover} alt={song.title} className="w-20 h-20 object-cover shadow-lg" />
                    <div className="p-4 flex-1 font-bold truncate">{song.title}</div>
                    <div className="mr-4 opacity-0 group-hover:opacity-100 transition shadow-xl bg-accent rounded-full p-3 flex items-center justify-center">
                      <span className="text-black">▶</span>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-bold mb-4">Recommended for you</h3>
              <SongList songs={songs} currentSong={currentSong} onSelect={handleSongSelect} isPlaying={isPlaying} />
            </>
          )}

          {currentView === 'search' && <Search />}
          {currentView === 'library' && <YourLibrary />}
        </main>

        {/* Player Bar */}
        <div className="h-24 bg-bg-secondary border-t border-bg-highlight px-4 flex items-center justify-between z-10">
          <PlayerControls
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
