import React, { useState, useRef, useEffect } from 'react';
import EditSongModal from './components/EditSongModal';
import SettingsModal from './components/SettingsModal';
import CreatePlaylistModal from './components/CreatePlaylistModal';
import LoginModal from './components/LoginModal';

import PlayerControls from './components/PlayerControls';
import SongList from './components/SongList';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Search from './components/Search';
import YourLibrary from './components/Library';
import LyricsView from './components/LyricsView';
import Visualizer from './components/Visualizer';
import Equalizer from './components/Equalizer';
import { Upload, Music, Heart, Play, Sliders, ArrowLeft } from 'lucide-react';

import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useLibrary } from './hooks/useLibrary';

function App() {
  console.log("App rendering (Refactored)");

  // --- Hooks ---
  const { 
    songs, 
    playlists, 
    isLoading: isLibraryLoading, 
    addNewSong, 
    updateSong, 
    removeSong, 
    clearLibrary,
    createPlaylist,
    removePlaylist,
    addToPlaylist,
    updatePlaylist,
    processFiles,
    syncLocalFolder,
    sortSongs
  } = useLibrary();

  // Local UI State
  const [currentView, setCurrentView] = useState('home');
  const [currentSong, setCurrentSong] = useState(null);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [playbackContext, setPlaybackContext] = useState([]);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Navigation History State
  const [viewHistory, setViewHistory] = useState(['home']);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // UI Toggles
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [songToAdd, setSongToAdd] = useState(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  
  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [accentColor, setAccentColor] = useState(localStorage.getItem('accentColor') || '#1db954');
  
  // Sleep Timer
  const [isSleepTimerActive, setIsSleepTimerActive] = useState(false);
  const sleepTimerRef = useRef(null);
  
  const fileInputRef = useRef(null);

  // --- Audio Hook ---
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    eqGains,
    isNormalizationEnabled,
    analyser,
    play: playerPlay,
    pause: playerPause,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    updateEqGain,
    toggleNormalization,
    activePlayer,
    audioRef1,
    audioRef2,
    setupAudioContext
  } = useAudioPlayer(currentSong, songs);


  // --- Toast Helper ---
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // --- Effects ---

  // Auth Init
  useEffect(() => {
    const savedUser = localStorage.getItem('music_player_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Theme Init
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') root.classList.add('light-theme');
    else root.classList.remove('light-theme');
    root.style.setProperty('--color-accent', accentColor);
    localStorage.setItem('theme', theme);
    localStorage.setItem('accentColor', accentColor);
  }, [theme, accentColor]);


  // Audio Actions wrapper to handle syncing state with internal player
  const handlePlayPause = () => {
    if (isPlaying) playerPause();
    else playerPlay();
  };

  const playSong = async (song, shouldPlay = true) => {
    // Handle File Permissions for Local Files
    let songSrc = song.src;
    if (song.type === 'local' && song.fileHandle) {
      try {
        const startStatus = await song.fileHandle.queryPermission({ mode: 'read' });
        if (startStatus !== 'granted') {
          const requestStatus = await song.fileHandle.requestPermission({ mode: 'read' });
          if (requestStatus !== 'granted') {
            showToast("Izin akses file ditolak.");
            return;
          }
        }
        const file = await song.fileHandle.getFile();
        songSrc = URL.createObjectURL(file);
      } catch (e) {
        console.error("Failed to access local file:", e);
        showToast("Gagal mengakses file lokal.");
        return;
      }
    }

    setCurrentSong({ ...song, src: songSrc });
    
    // Direct manipulation of audio ref src to ensure immediate switch
    const audio = activePlayer.current === 1 ? audioRef1.current : audioRef2.current;
    if (audio) {
        audio.src = songSrc;
        if (shouldPlay) {
            setupAudioContext();
            audio.play().catch(e => console.error(e));
             // showLyrics if desktop
            if (window.innerWidth >= 768) setShowLyrics(true);
        }
    }
    
    // Update Play Count
    updateSong(song.id, { playCount: (song.playCount || 0) + 1 });
    
    // History
    setHistory(prev => [song, ...prev.filter(s => s.id !== song.id)].slice(0, 50));
  };


  const handleSongSelect = (song, context = null) => {
    if (context) setPlaybackContext(context);
    else if (playbackContext.length === 0) setPlaybackContext(songs);

    if (currentSong && currentSong.id === song.id) {
        handlePlayPause();
        return;
    }
    playSong(song);
  };

  const skipNext = () => {
    if (queue.length > 0) {
      const nextSong = queue[0];
      setQueue(prev => prev.slice(1));
      playSong(nextSong);
      return;
    }

    const context = playbackContext.length > 0 ? playbackContext : songs;
    if (context.length === 0) return;

    let nextIndex;
    const currentIndex = context.findIndex(s => s.id === currentSong?.id);

    if (isShuffle) {
      do {
        nextIndex = Math.floor(Math.random() * context.length);
      } while (context.length > 1 && nextIndex === currentIndex);
    } else {
      nextIndex = (currentIndex + 1) % context.length;
    }
    playSong(context[nextIndex]);
  };

  const skipPrev = () => {
    // If > 3 seconds in, restart song
    if (currentTime > 3) {
      seek(0);
      return;
    }

    const context = playbackContext.length > 0 ? playbackContext : songs;
    if (context.length === 0) return;

    const currentIndex = context.findIndex(s => s.id === currentSong?.id);
    const prevIndex = (currentIndex - 1 + context.length) % context.length;
    playSong(context[prevIndex]);
  };

  // Navigation Handlers
  const handleNavigate = (view) => {
    // If going to the same view, do nothing
    if (view === currentView) return;

    const newHistory = viewHistory.slice(0, historyIndex + 1);
    newHistory.push(view);
    
    setViewHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentView(viewHistory[newIndex]);
    }
  };

  const handleForward = () => {
    if (historyIndex < viewHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentView(viewHistory[newIndex]);
    }
  };


  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    
    showToast(`Processing ${files.length} files...`);
    const added = await processFiles(files);
    
    if (added > 0) showToast(`Added ${added} songs.`);
    else showToast("No new songs added (duplicates).");
    if (event.target) event.target.value = '';
  };

  const handleSyncWrapper = async () => {
    try {
        const result = await syncLocalFolder();
        if (result) {
            showToast(result.added > 0 
                ? `Synced ${result.added} new songs from ${result.folderName}` 
                : `${result.folderName} is up to date.`);
        }
    } catch (e) {
        alert(e.message);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
    if (files.length > 0) {
        showToast(`Processing ${files.length} dropped files...`);
        await processFiles(files);
        showToast("Import complete.");
    }
  };

  // Login / Logout
  const handleLogin = (name) => {
    const newUser = { name, joinedAt: Date.now() };
    setUser(newUser);
    localStorage.setItem('music_player_user', JSON.stringify(newUser));
    showToast(`Welcome back, ${name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('music_player_user');
    showToast('Logged out.');
  };

  // Sleep Timer
  const handleSetSleepTimer = (minutes) => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    if (minutes === 0) {
      setIsSleepTimerActive(false);
      return;
    }
    setIsSleepTimerActive(true);
    sleepTimerRef.current = setTimeout(() => {
      playerPause();
      setIsSleepTimerActive(false);
    }, minutes * 60 * 1000);
  };
  
  // Auto-play next song when ended (Listener)
  useEffect(() => {
    const audio = activePlayer.current === 1 ? audioRef1.current : audioRef2.current;
    if (!audio) return;
    
    const onEnded = () => {
        if (repeatMode === 2) { // Repeat One
            seek(0);
            playerPlay();
        } else if (repeatMode === 0 && songs.findIndex(s => s.id === currentSong?.id) === songs.length - 1 && queue.length === 0) {
            // End of list
            playerPause();
        } else {
            skipNext();
        }
    };
    
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [currentSong, queue, repeatMode, isShuffle, songs]); // Deps important for skipNext closure


  // --- Render ---

  return (
    <div
      className="flex h-screen bg-bg-primary text-text-primary overflow-hidden relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div
          className="absolute inset-0 bg-accent/20 z-[100] border-4 border-dashed border-accent flex items-center justify-center pointer-events-none backdrop-blur-sm"
          onDragLeave={handleDragLeave}
        >
          <div className="text-4xl font-bold text-accent animate-pulse flex flex-col items-center gap-4">
            <Upload size={64} />
            Drop MP3s to Upload
          </div>
        </div>
      )}

      <Sidebar
        currentView={currentView}
        onNavigate={(view) => { handleNavigate(view); }}
        onAddMusic={() => { fileInputRef.current.click(); setIsMobileMenuOpen(false); }}
        onSyncFolder={() => { handleSyncWrapper(); setIsMobileMenuOpen(false); }}
        onCreatePlaylist={() => setShowCreatePlaylistModal(true)}
        isMobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenSettings={() => { setShowSettings(true); setIsMobileMenuOpen(false); }}
        playlists={playlists}
        onSelectPlaylist={(p) => { setActivePlaylist(p); handleNavigate('playlist-detail'); }}
      />

      <div className="flex-1 flex flex-col relative w-full">
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          user={user}
          onLogin={() => setShowLoginModal(true)}
          onLogout={handleLogout}
          onBack={handleBack}
          onForward={handleForward}
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < viewHistory.length - 1}
        />

        <main className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-bg-highlight to-bg-primary relative">

            {currentView === 'home' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Good evening{user ? `, ${user.name}` : ''}</h2>
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

                {songs.length === 0 && !isLibraryLoading && (
                  <div className="flex flex-col items-center justify-center h-64 text-text-secondary border-2 border-dashed border-bg-highlight rounded-lg">
                    <p className="mb-4 text-xl">No music yet</p>
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="bg-text-primary text-bg-primary font-bold py-2 px-6 rounded-full hover:scale-105 transition"
                    >
                      Upload MP3s
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {playlists.slice(0, 6).map(playlist => {
                      const firstSong = playlist.songIds[0] ? songs.find(s => s.id === playlist.songIds[0]) : null;
                      return (
                        <div key={playlist.id} className="flex items-center bg-bg-card hover:bg-bg-highlight transition rounded-md overflow-hidden cursor-pointer group relative shadow-md" onClick={() => { setActivePlaylist(playlist); handleNavigate('playlist-detail'); }}>
                          {firstSong?.cover && !firstSong.cover.includes('placehold.co') ? (
                            <img src={firstSong.cover} alt={playlist.name} className="w-20 h-20 min-w-[5rem] object-cover shadow-lg" />
                          ) : (
                            <div className="w-20 h-20 min-w-[5rem] bg-bg-card flex items-center justify-center text-text-secondary shadow-lg"><Music size={32} /></div>
                          )}
                          <div className="px-4 flex-1 font-bold truncate text-sm md:text-base">{playlist.name}</div>
                          <div className="opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 absolute right-4 shadow-xl bg-accent rounded-full p-3 flex items-center justify-center hover:scale-105">
                            <Play fill="black" className="text-black" size={20} />
                          </div>
                        </div>
                      );
                    })
                  }
                </div>

                <h3 className="text-xl font-bold mb-4">Recommended for you</h3>
                <SongList
                  songs={songs}
                  currentSong={currentSong}
                  onSelect={handleSongSelect}
                  isPlaying={isPlaying}
                  onDelete={(id) => removeSong(id)}
                  onDeleteAll={clearLibrary}
                  onAddToPlaylist={(id) => { setSongToAdd(id); setShowPlaylistSelector(true); }}
                  onSort={sortSongs}
                  onAddToQueue={(id) => { const s = songs.find(x => x.id === id); if(s) setQueue(p => [...p, s]); }}
                  onPlayNext={(id) => { const s = songs.find(x => x.id === id); if(s) setQueue(p => [s, ...p]); }}
                />
              </>
            )}

            {currentView === 'search' && <Search songs={songs} onPlay={handleSongSelect} />}

            {currentView === 'library' && (
              <YourLibrary
                playlists={playlists}
                songs={songs}
                onSelect={handleSongSelect}
                onAddMusic={() => fileInputRef.current.click()}
                onCreatePlaylist={() => setShowCreatePlaylistModal(true)}
                onSelectPlaylist={(p) => { setActivePlaylist(p); handleNavigate('playlist-detail'); }}
                onDeletePlaylist={removePlaylist}
                currentSong={currentSong}
                isPlaying={isPlaying}
              />
            )}

            {currentView === 'playlist-detail' && activePlaylist && (
               <div className="flex flex-col h-full">
                   <div className="flex items-center gap-4 mb-6">
                   <button onClick={() => handleNavigate('library')} className="hover:text-white text-text-secondary"><ArrowLeft size={24} /></button>
                   <h2 className="text-3xl font-bold">{activePlaylist.name}</h2>
                 </div>
                 <SongList 
                    songs={songs.filter(s => activePlaylist.songIds.includes(s.id))}
                    currentSong={currentSong}
                    onSelect={(s) => handleSongSelect(s, songs.filter(x => activePlaylist.songIds.includes(x.id)))}
                    isPlaying={isPlaying}
                    onDelete={(sid) => {
                        const updated = { ...activePlaylist, songIds: activePlaylist.songIds.filter(id => id !== sid) };
                        updatePlaylist(updated);
                        setActivePlaylist(updated);
                    }}
                 />
               </div>
            )}

            {currentView === 'visualizer' && (
              <Visualizer
                analyser={analyser}
                isPlaying={isPlaying}
                currentSong={currentSong}
                onSaveLyrics={(id, l) => updateSong(id, { lyrics: l })}
                currentTime={currentTime}
              />
            )}
          </div>

          {editingSong && (
            <EditSongModal
              song={editingSong}
              onSave={updateSong}
              onClose={() => setEditingSong(null)}
            />
          )}

          {showLyrics && currentView !== 'visualizer' && (
            <div className="absolute inset-x-0 bottom-24 top-0 md:static md:w-1/4 md:min-w-[250px] border-l border-bg-highlight bg-bg-secondary z-50 flex-shrink-0 transition-all duration-300">
              <LyricsView
                song={currentSong}
                onClose={() => setShowLyrics(false)}
                onSaveLyrics={(id, l) => updateSong(id, { lyrics: l })}
              />
            </div>
          )}
        </main>

        <div className="h-24 bg-bg-card border-t border-bg-highlight px-4 flex items-center justify-between z-50 relative">
          <PlayerControls
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            currentTime={currentTime}
            duration={duration}
            onSeek={seek}
            onSkipNext={skipNext}
            onSkipPrev={skipPrev}
            isShuffle={isShuffle}
            onToggleShuffle={toggleShuffle}
            volume={volume}
            onVolumeChange={setVolume}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            repeatMode={repeatMode}
            onToggleRepeat={toggleRepeat}
            onToggleLyrics={() => setShowLyrics(!showLyrics)}
            isLyricsOpen={showLyrics}
            isSleepTimerActive={isSleepTimerActive}
            onSetSleepTimer={handleSetSleepTimer}
            onToggleLike={() => updateSong(currentSong.id, { isLiked: !currentSong.isLiked })}
            onToggleQueue={() => handleNavigate(currentView === 'queue' ? 'home' : 'queue')}
            onToggleEqualizer={() => setShowEqualizer(!showEqualizer)}
          />

          {showEqualizer && (
            <Equalizer
              gains={eqGains}
              onUpdateGain={updateEqGain}
              onClose={() => setShowEqualizer(false)}
            />
          )}
          
           {showCreatePlaylistModal && (
            <CreatePlaylistModal
              onClose={() => setShowCreatePlaylistModal(false)}
              onCreate={(name) => { createPlaylist(name); setShowCreatePlaylistModal(false); }}
            />
          )}
          
          {showLoginModal && (
            <LoginModal onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
          )}

           {showPlaylistSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="bg-neutral-900 border border-gray-700 p-6 rounded-lg w-full max-w-md shadow-2xl relative">
                <button className="absolute top-4 right-4" onClick={() => setShowPlaylistSelector(false)}>✕</button>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-4">
                  {playlists.map(p => (
                    <button key={p.id} onClick={() => { addToPlaylist(p.id, songToAdd); setShowPlaylistSelector(false); showToast(`Added to ${p.name}`); }} className="p-3 hover:bg-bg-highlight rounded text-left">
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

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
      
       {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onDataRestored={() => { window.location.reload(); }}
          theme={theme}
          setTheme={setTheme}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          onSetSleepTimer={handleSetSleepTimer}
          isSleepTimerActive={isSleepTimerActive}
          isNormalizationEnabled={isNormalizationEnabled}
          onToggleNormalization={toggleNormalization}
        />
      )}
    </div>
  );
}

export default App;
