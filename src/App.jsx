import React, { useState, useRef, useEffect } from 'react';
import PlayerControls from './components/PlayerControls';
import SongList from './components/SongList';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Search from './components/Search';
import YourLibrary from './components/Library';
import LyricsView from './components/LyricsView';

import { Upload, Music, ArrowLeft } from 'lucide-react';
import { saveSong, getAllSongs, deleteSong, clearAllSongs, savePlaylist, getAllPlaylists, deletePlaylist } from './services/db';
import { formatDuration, getAudioDuration, getSongMetadata } from './utils/audioUtils';

function App() {
  console.log("App rendering");
  const [token, setTokenState] = useState(null); // Keep for compatibility if needed, but unused now
  const [currentView, setCurrentView] = useState('home');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(0.5);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [songToAdd, setSongToAdd] = useState(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: Off, 1: All, 2: One
  const [showLyrics, setShowLyrics] = useState(false);

  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize Audio on mount
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = "anonymous"; // Needed for some visualizer setups if external
  }, []);

  // Load songs & playlists from DB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load Songs
        const savedSongs = await getAllSongs();
        const songsWithUrls = savedSongs.map(song => {
          try {
            return {
              ...song,
              src: song.file ? URL.createObjectURL(song.file) : ''
            };
          } catch (e) {
            console.error("Error creating URL for song:", song, e);
            return null;
          }
        }).filter(s => s !== null);

        setSongs(songsWithUrls);

        // Load Playlists
        const savedPlaylists = await getAllPlaylists();
        setPlaylists(savedPlaylists);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, []);

  const handleCreatePlaylist = async () => {
    const name = prompt("Enter playlist name:");
    if (!name) return;

    const newPlaylist = {
      id: Date.now(),
      name,
      songIds: [],
      createdAt: Date.now()
    };

    await savePlaylist(newPlaylist);
    setPlaylists(prev => [...prev, newPlaylist]);
  };

  const handleDeletePlaylist = async (id) => {
    await deletePlaylist(id);
    setPlaylists(prev => prev.filter(p => p.id !== id));
    if (activePlaylist?.id === id) {
      setActivePlaylist(null);
      setCurrentView('library');
    }
  };

  const handleSelectPlaylist = (playlist) => {
    setActivePlaylist(playlist);
    setCurrentView('playlist-detail');
  };

  const handleAddToPlaylist = (songId) => {
    setSongToAdd(songId);
    setShowPlaylistSelector(true);
  };

  const confirmAddToPlaylist = async (playlist) => {
    if (!songToAdd) return;

    if (playlist.songIds.includes(songToAdd)) {
      alert("Song already in playlist");
      return;
    }

    const updatedPlaylist = {
      ...playlist,
      songIds: [...playlist.songIds, songToAdd]
    };

    await savePlaylist(updatedPlaylist);
    setPlaylists(prev => prev.map(p => p.id === playlist.id ? updatedPlaylist : p));

    setShowPlaylistSelector(false);
    setSongToAdd(null);
    alert(`Added to ${playlist.name}`);
  };

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

  const handleRemoveFromPlaylist = async (songId) => {
    if (!activePlaylist) return;

    const updatedPlaylist = {
      ...activePlaylist,
      songIds: activePlaylist.songIds.filter(id => id !== songId)
    };

    await savePlaylist(updatedPlaylist);
    setPlaylists(prev => prev.map(p => p.id === activePlaylist.id ? updatedPlaylist : p));
    setActivePlaylist(updatedPlaylist);
  };

  const handleDeleteSong = async (songId) => {
    // Find song title for confirmation
    const song = songs.find(s => s.id == songId); // Loosen equality check
    if (!song) {
      console.error("Song not found for deletion:", songId);
      alert("Error: Song not found in library.");
      return;
    }

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
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
          }
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
        if (audioRef.current) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
          }
        }
      } catch (error) {
        console.error("Failed to clear library:", error);
        alert("Failed to clear library");
      }
    }
  };

  const handleSort = (type) => {
    const sortedSongs = [...songs];
    if (type === 'title') {
      sortedSongs.sort((a, b) => a.title.localeCompare(b.title));
    } else if (type === 'date') {
      // Newest first
      sortedSongs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    setSongs(sortedSongs);
  };



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

  const toggleRepeat = () => {
    setRepeatMode(prev => (prev + 1) % 3);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => {
      if (repeatMode === 2) { // Repeat One
        audio.currentTime = 0;
        audio.play();
        return;
      }

      const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
      if (repeatMode === 0 && currentIndex === songs.length - 1) { // Repeat Off & Last Song
        setIsPlaying(false);
        return;
      }

      // Repeat All (1) or Normal Next
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
  }, [currentSong, isShuffle, songs, repeatMode]); // Added repeatMode dependency

  useEffect(() => {
    if (isPlaying && currentSong && audioRef.current) { // Ensure there is a song
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
    } else if (!isPlaying && audioRef.current) {
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

  const handleSaveLyrics = async (songId, newLyrics) => {
    // Update local state
    const updatedSongs = songs.map(s => s.id === songId ? { ...s, lyrics: newLyrics } : s);
    setSongs(updatedSongs);

    // Update current song if it's the one being edited
    if (currentSong && currentSong.id === songId) {
      setCurrentSong(prev => ({ ...prev, lyrics: newLyrics }));
    }

    // Save to DB
    const songToUpdate = updatedSongs.find(s => s.id === songId);
    if (songToUpdate) {
      await saveSong(songToUpdate);
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if input is focused (e.g. searching, creating playlist)
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (audioRef.current) {
            const newTime = Math.min(audioRef.current.currentTime + 5, audioRef.current.duration || 0);
            __handleSeek(newTime);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (audioRef.current) {
            const newTime = Math.max(audioRef.current.currentTime - 5, 0);
            __handleSeek(newTime);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(prev + 0.1, 1));
          setIsMuted(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(prev - 0.1, 0));
          break;
        case 'KeyM':
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isMuted]); // Note: handlePlayPause, __handleSeek, toggleMute are likely stable or closured, check deps.

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSongSelect = (song) => {
    setCurrentSong(song);
    if (audioRef.current) {
      audioRef.current.src = song.src; // Use local blob URL
    }
    setIsPlaying(true);
  };

  const __handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  }

  return (
    <div className="flex h-screen bg-primary text-white overflow-hidden">
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }}
        onAddMusic={() => { fileInputRef.current.click(); setIsMobileMenuOpen(false); }}
        onCreatePlaylist={handleCreatePlaylist}
        isMobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col relative w-full">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-bg-highlight to-bg-primary">

            {currentView === 'home' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Good evening</h2>
                  <div>
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
                  onAddToPlaylist={handleAddToPlaylist}
                  onSort={handleSort}
                />
              </>
            )}

            {currentView === 'search' && <Search songs={songs} onPlay={handleSongSelect} />}

            {currentView === 'library' && (
              <YourLibrary
                playlists={playlists}
                onCreatePlaylist={handleCreatePlaylist}
                onSelectPlaylist={handleSelectPlaylist}
                onDeletePlaylist={handleDeletePlaylist}
              />
            )}

            {currentView === 'playlist-detail' && activePlaylist && (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setCurrentView('library')} className="hover:text-white text-text-secondary">
                    <ArrowLeft size={24} />
                  </button>
                  <div className="w-16 h-16 bg-bg-card flex items-center justify-center text-text-secondary rounded shadow-lg">
                    <Music size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{activePlaylist.name}</h2>
                    <p className="text-sm text-text-secondary">{activePlaylist.songIds.length} songs</p>
                  </div>
                </div>

                <SongList
                  songs={songs.filter(s => activePlaylist.songIds.includes(s.id))}
                  currentSong={currentSong}
                  onSelect={handleSongSelect}
                  isPlaying={isPlaying}
                  onDelete={handleRemoveFromPlaylist}
                  onAddToPlaylist={handleAddToPlaylist}
                />
              </div>
            )}
          </div>

          {/* Lyrics Panel */}
          {showLyrics && (
            <div className="w-1/4 min-w-[250px] border-l border-bg-highlight bg-bg-card z-20 flex-shrink-0 transition-all duration-300">
              <LyricsView
                song={currentSong}
                onClose={() => setShowLyrics(false)}
                onSaveLyrics={handleSaveLyrics}
              />
            </div>
          )}
        </main>

        {/* Player Bar */}
        <div className="h-24 bg-bg-secondary border-t border-bg-highlight px-4 flex items-center justify-between z-10 relative overflow-hidden">
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
            repeatMode={repeatMode}
            onToggleRepeat={toggleRepeat}
            onToggleLyrics={() => setShowLyrics(!showLyrics)}
            isLyricsOpen={showLyrics}
          />
        </div>
      </div>

      <input
        type="file"
        accept="audio/*"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
      />



      {/* Playlist Selector Modal */}
      {showPlaylistSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card p-6 rounded-lg w-full max-w-md shadow-2xl relative">
            <h3 className="text-xl font-bold mb-4">Add to Playlist</h3>
            <button
              className="absolute top-4 right-4 text-text-secondary hover:text-white"
              onClick={() => {
                setShowPlaylistSelector(false);
                setSongToAdd(null);
              }}
            >
              ✕
            </button>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-4">
              {playlists.length === 0 ? (
                <p className="text-text-secondary">No playlists found.</p>
              ) : (
                playlists.map(p => (
                  <button
                    key={p.id}
                    onClick={() => confirmAddToPlaylist(p)}
                    className="flex items-center p-3 hover:bg-bg-highlight rounded transition text-left"
                  >
                    <Music size={20} className="mr-3 text-accent" />
                    <span className="font-bold">{p.name}</span>
                    <span className="ml-auto text-sm text-text-secondary">{p.songIds.length} songs</span>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setShowPlaylistSelector(false);
                handleCreatePlaylist();
              }}
              className="w-full bg-bg-highlight hover:bg-opacity-80 text-white py-2 rounded font-bold"
            >
              + Create New Playlist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
