import React, { useState, useRef, useEffect } from 'react';
import PlayerControls from './components/PlayerControls';
import SongList from './components/SongList';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Search from './components/Search';
import YourLibrary from './components/Library';

import { Upload, Music } from 'lucide-react';
import { saveSong, getAllSongs, deleteSong, clearAllSongs } from './services/db';
import { formatDuration, getAudioDuration, getSongMetadata } from './utils/audioUtils';

function App() {
  const [token, setTokenState] = useState(null); // Keep for compatibility if needed, but unused now
  const [currentView, setCurrentView] = useState('home');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songs, setSongs] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(0.5);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  const fileInputRef = useRef(null);

  // Load songs from DB on mount
  useEffect(() => {
    const loadSongs = async () => {
      const savedSongs = await getAllSongs();
      const songsWithUrls = savedSongs.map(song => ({
        ...song,
        src: URL.createObjectURL(song.file) // Create fresh URL for blob                                
      }));
      setSongs(songsWithUrls);
    };
    loadSongs();
  }, []);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    const existingTitles = new Set(songs.map(s => s.title));
    let addedCount = 0;

    // Process each file
    for (const file of files) {
      // Get Duration & Metadata
      const durationSeconds = await getAudioDuration(file);
      const formattedDuration = formatDuration(durationSeconds);
      const metadata = await getSongMetadata(file);

      // Check duplicates using metadata title or filename
      const titleToCheck = metadata.title || file.name.replace(/\.[^/.]+$/, "");

      if (existingTitles.has(titleToCheck)) {
        console.warn(`Duplicate song skipped: ${titleToCheck}`);
        continue;
      }

      // Add to set to prevent duplicates within the same batch
      existingTitles.add(titleToCheck);

      const id = Date.now() + Math.random();
      const newSong = {
        id,
        title: metadata.title || titleToCheck,
        artist: metadata.artist || 'Unknown Artist',
        duration: formattedDuration,
        cover: metadata.cover || 'https://placehold.co/300x300/333333/ffffff?text=MP3',
        file: file, // Store actual blob in DB
        createdAt: Date.now()
      };

      // Save to DB
      await saveSong(newSong);

      // Update state with object URL
      const songForState = {
        ...newSong,
        src: URL.createObjectURL(file)
      };

      setSongs(prev => [...prev, songForState]);
      addedCount++;
    }

    if (addedCount < files.length) {
      alert(`Uploaded ${addedCount} songs. ${files.length - addedCount} duplicates were skipped.`);
    }
  };

  const handleDeleteSong = async (songId) => {
    // Find song title for confirmation
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    if (window.confirm(`Are you sure you want to delete "${song.title}"?`)) {
      try {
        await deleteSong(songId);

        // Revoke URL to free memory
        if (song.src) {
          URL.revokeObjectURL(song.src);
        }

        setSongs(prev => prev.filter(s => s.id !== songId));

        // If deleted song was playing, stop playback
        if (currentSong?.id === songId) {
          setCurrentSong(null);
          setIsPlaying(false);
          audioRef.current.pause();
          audioRef.current.src = "";
        }
      } catch (error) {
        console.error("Failed to delete song:", error);
        alert("Failed to delete song");
      }
    }
  };

  const handleClearAllSongs = async () => {
    if (songs.length === 0) return;

    if (window.confirm("Are you sure you want to delete ALL songs? This cannot be undone.")) {
      try {
        await clearAllSongs();

        // Revoke all URLs
        songs.forEach(song => {
          if (song.src) URL.revokeObjectURL(song.src);
        });

        setSongs([]);
        setCurrentSong(null);
        setIsPlaying(false);
        audioRef.current.pause();
        audioRef.current.src = "";
      } catch (error) {
        console.error("Failed to clear library:", error);
        alert("Failed to clear library");
      }
    }
  };

  const handleSearch = (query) => {
    // Local search is handled in Search component now, or we can filter here if needed globally.
    // For now, let's just make sure Search component receives the full list.
  };

  // Placeholder for audio element
  const audioRef = useRef(new Audio());

  const skipNext = () => {
    if (songs.length === 0) return;

    let nextIndex;
    const currentIndex = songs.findIndex(s => s.id === currentSong?.id);

    if (isShuffle) {
      // Pick random index different from current
      do {
        nextIndex = Math.floor(Math.random() * songs.length);
      } while (songs.length > 1 && nextIndex === currentIndex);
    } else {
      // Sequential
      nextIndex = (currentIndex + 1) % songs.length;
    }

    const nextSong = songs[nextIndex];
    handleSongSelect(nextSong);
  };

  const skipPrev = () => {
    if (songs.length === 0) return;

    const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;

    const prevSong = songs[prevIndex];
    handleSongSelect(prevSong);
  };

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => {
      // Don't auto-stop, just go next. 
      // If we seek to next, handleSongSelect sets isPlaying=true.
      // But if we just call skipNext, it updates currentSong.
      skipNext();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    }
  }, [currentSong, isShuffle, songs]); // Added songs dependency for skipNext closure

  // Sync isPlaying state with audio Play/Pause AND auto-play on song change
  useEffect(() => {
    if (isPlaying && currentSong) { // Ensure there is a song
      // Small timeout to ensure DOM/Audio element is ready if needed, 
      // but usually direct play works if src is set.
      // We wrap in a promise handling to avoid the "play() request was interrupted" error
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.error("Playback failed or interrupted:", e);
          // If user interaction is required, we might set isPlaying to false
          // setIsPlaying(false); 
        });
      }
    } else if (!isPlaying) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong]); // Depend on currentSong to trigger play when song changes

  // Set volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolumeRef.current || 0.5);
    } else {
      prevVolumeRef.current = volume;
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSongSelect = (song) => {
    setCurrentSong(song);
    audioRef.current.src = song.src; // Use local blob URL
    setIsPlaying(true);
  };

  const __handleSeek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }

  return (
    <div className="flex h-screen bg-primary text-white overflow-hidden">
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }}
        onAddMusic={() => { fileInputRef.current.click(); setIsMobileMenuOpen(false); }}
        isMobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col relative w-full">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-bg-highlight to-bg-primary">
          <>
            {currentView === 'home' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Good evening</h2>
                  <div>
                    <input
                      type="file"
                      accept="audio/*"
                      multiple
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="flex items-center gap-2 bg-accent text-black font-bold py-2 px-4 rounded-full hover:scale-105 transition"
                    >
                      <Upload size={18} />
                      Add Music
                    </button>
                  </div>
                </div>

                {songs.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-text-secondary border-2 border-dashed border-bg-highlight rounded-lg">
                    <p className="mb-4 text-xl">No music yet</p>
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="bg-white text-black font-bold py-2 px-6 rounded-full hover:bg-gray-200 transition"
                    >
                      Upload MP3s
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {/* Featured Cards / "Jump Back In" */}
                  {songs.slice(0, 3).map(song => (
                    <div key={song.id} className="flex items-center bg-bg-highlight bg-opacity-50 hover:bg-opacity-100 transition rounded-md overflow-hidden cursor-pointer group" onClick={() => handleSongSelect(song)}>
                      {song.cover && song.cover.includes('placehold.co') ? (
                        <div className="w-20 h-20 min-w-20 min-h-20 bg-bg-card flex items-center justify-center text-text-secondary shadow-lg">
                          <Music size={32} />
                        </div>
                      ) : (
                        <img src={song.cover} alt={song.title} className="w-20 h-20 object-cover shadow-lg" />
                      )}
                      <div className="p-4 flex-1 font-bold truncate">{song.title}</div>
                      <div className="mr-4 opacity-0 group-hover:opacity-100 transition shadow-xl bg-accent rounded-full p-3 flex items-center justify-center">
                        <span className="text-black">▶</span>
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="text-xl font-bold mb-4">Recommended for you</h3>
                <SongList
                  songs={songs}
                  currentSong={currentSong}
                  onSelect={handleSongSelect}
                  isPlaying={isPlaying}
                  onDelete={handleDeleteSong}
                  onClearAll={handleClearAllSongs}
                />
              </>
            )}

            {currentView === 'search' && <Search songs={songs} onPlay={handleSongSelect} />}
            {currentView === 'library' && <YourLibrary />}
          </>
        </main>

        {/* Player Bar */}
        <div className="h-24 bg-bg-secondary border-t border-bg-highlight px-4 flex items-center justify-between z-10">
          <PlayerControls
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            currentTime={currentTime}
            duration={duration}
            onSeek={__handleSeek}
            onSkipNext={skipNext}
            onSkipPrev={skipPrev}
            isShuffle={isShuffle}
            onToggleShuffle={() => setIsShuffle(!isShuffle)}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
