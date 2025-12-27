import React, { useState, useRef, useEffect } from 'react';
import EditSongModal from './components/EditSongModal';
import SettingsModal from './components/SettingsModal';

import PlayerControls from './components/PlayerControls';
import SongList from './components/SongList';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Search from './components/Search';
import YourLibrary from './components/Library';
import LyricsView from './components/LyricsView';
import Visualizer from './components/Visualizer';
import Equalizer from './components/Equalizer';
import { Upload, Music, ArrowLeft, Heart, Play, Sliders } from 'lucide-react';
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
  const [isSleepTimerActive, setIsSleepTimerActive] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [history, setHistory] = useState([]);
  const [queue, setQueue] = useState([]);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [eqGains, setEqGains] = useState([0, 0, 0, 0, 0]);
  const filtersRef = useRef([]);
  const [isDragging, setIsDragging] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const sleepTimerRef = useRef(null);

  const handleUpdateSongData = async (songId, newData) => {
    // Update local state
    const updatedSongs = songs.map(s => s.id === songId ? { ...s, ...newData } : s);
    setSongs(updatedSongs);

    // Update current song if it's the one being edited
    if (currentSong && currentSong.id === songId) {
      setCurrentSong(prev => ({ ...prev, ...newData }));
    }

    // Save to DB
    const songToUpdate = updatedSongs.find(s => s.id === songId);
    if (songToUpdate) {
      await saveSong(songToUpdate);
    }

    setEditingSong(null);
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

  const handleSetSleepTimer = (minutes) => {
    // Clear existing timer
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    if (minutes === 0) {
      setIsSleepTimerActive(false);
      return;
    }

    setIsSleepTimerActive(true);

    sleepTimerRef.current = setTimeout(() => {
      setIsPlaying(false);
      setIsSleepTimerActive(false);
      sleepTimerRef.current = null;
    }, minutes * 60 * 1000);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('audio/'));
    if (files.length > 0) {
      await handleFileUpload({ target: { files } });
    }
  };

  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Audio Context & Visualizer
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  const setupAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (!analyserRef.current) {
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    }

    // Initialize Filters if not passed
    if (filtersRef.current.length === 0) {
      const frequencies = [60, 230, 910, 3600, 14000];
      filtersRef.current = frequencies.map(freq => {
        const filter = audioContextRef.current.createBiquadFilter();
        filter.type = 'peaking'; // Good general purpose EQ type
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = 0;
        return filter;
      });

      // Change first to low-shelf and last to high-shelf for better control
      filtersRef.current[0].type = 'lowshelf';
      filtersRef.current[4].type = 'highshelf';
    }

    if (audioRef.current && !sourceRef.current) {
      try {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);

        // Chain: Source -> Filter 1 -> ... -> Filter 5 -> Analyser -> Destination
        // Disconnect first to avoid loop or error on re-init
        try { sourceRef.current.disconnect(); } catch (e) { }

        let prevNode = sourceRef.current;

        filtersRef.current.forEach(filter => {
          prevNode.connect(filter);
          prevNode = filter;
        });

        prevNode.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      } catch (e) {
        console.error("Audio context setup error", e);
      }
    }

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handleUpdateEqGain = (index, value) => {
    const newGains = [...eqGains];
    newGains[index] = value;
    setEqGains(newGains);

    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = value;
    }
  };

  // ... (content remains same, no changes needed here if analysis holds) (keeping existing refs)

  // ...



  // Initialize Audio on mount
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = "anonymous"; // Needed for some visualizer setups if external
  }, []);

  // Load songs & playlists from DB on mount
  // Load songs & playlists from DB on mount
  const refreshLibrary = async () => {
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

      // --- RESUME PLAYBACK LOGIC ---
      const lastSongId = localStorage.getItem('lastPlayedSongId');
      const lastTime = parseFloat(localStorage.getItem('lastPlayedTime'));

      if (lastSongId && songsWithUrls.length > 0) {
        // Need to check if currentSong is already set, or just set it if null?
        // Since this runs on mount/restore, likely better to set it.
        const songToResume = songsWithUrls.find(s => s.id === (Number(lastSongId) || lastSongId)); // weak match
        if (songToResume && !currentSong) {
          setCurrentSong(songToResume);
          if (audioRef.current) {
            audioRef.current.src = songToResume.src;
            audioRef.current.currentTime = lastTime || 0;
            setCurrentTime(lastTime || 0);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  useEffect(() => {
    refreshLibrary();
  }, []);

  // Save Playback State
  useEffect(() => {
    if (currentSong) {
      localStorage.setItem('lastPlayedSongId', currentSong.id);
    }
  }, [currentSong]);

  useEffect(() => {
    // throttle saving time to avoid blasting localStorage
    const interval = setInterval(() => {
      if (isPlaying && audioRef.current) {
        localStorage.setItem('lastPlayedTime', audioRef.current.currentTime);
      }
    }, 5000); // Save every 5 seconds
    return () => clearInterval(interval);
  }, [isPlaying]);


  // --- SMART FADING LOGIC ---
  const fadeOut = (callback) => {
    if (!audioRef.current) return;
    const fadeAudio = audioRef.current;
    const startVolume = fadeAudio.volume;
    const fadeDuration = 300; // ms
    const fadeStep = 50; // ms
    const stepValue = startVolume / (fadeDuration / fadeStep);

    let currentStep = 0;
    const fadeInterval = setInterval(() => {
      currentStep++;
      if (fadeAudio.volume > stepValue) {
        fadeAudio.volume = Math.max(0, fadeAudio.volume - stepValue);
      } else {
        fadeAudio.volume = 0;
        clearInterval(fadeInterval);
        if (callback) callback();
      }
    }, fadeStep);
  };

  const fadeIn = () => {
    if (!audioRef.current) return;
    const fadeAudio = audioRef.current;
    fadeAudio.volume = 0;
    const targetVolume = isMuted ? 0 : volume;
    const fadeDuration = 500; // ms
    const fadeStep = 50; // ms
    const stepValue = targetVolume / (fadeDuration / fadeStep);

    let currentStep = 0;
    const fadeInterval = setInterval(() => {
      currentStep++;
      if (fadeAudio.volume < targetVolume - stepValue) {
        fadeAudio.volume += stepValue;
      } else {
        fadeAudio.volume = targetVolume;
        clearInterval(fadeInterval);
      }
    }, fadeStep);
  };

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
        album: metadata.album || 'Unknown Album',
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
    if (queue.length > 0) {
      const nextSong = queue[0];
      setQueue(prev => prev.slice(1));
      handleSongSelect(nextSong);
      return;
    }

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
      setupAudioContext();
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
    if (isPlaying) {
      // Fade out then pause
      fadeOut(() => {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
      });
    } else {
      // Play then fade in
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          fadeIn();
          setIsPlaying(true);
          setupAudioContext(); // Ensure/resume context
        }).catch(e => console.error(e));
      }
    }
  };

  const handleSongSelect = (song) => {
    if (currentSong) {
      // Fade out old song first
      fadeOut(() => {
        __playSong(song);
      });
    } else {
      __playSong(song);
    }
  };

  const __playSong = (song) => {
    if (currentSong) {
      setHistory(prev => {
        const newHistory = [currentSong, ...prev];
        // Unique history based on ID
        const uniqueHistory = newHistory.filter((item, index, self) =>
          index === self.findIndex((t) => (
            t.id === item.id
          ))
        );
        return uniqueHistory.slice(0, 10);
      });
    }

    setCurrentSong(song);
    if (audioRef.current) {
      audioRef.current.src = song.src; // Use local blob URL
      audioRef.current.play().then(() => {
        fadeIn(); // Fade in new song
        setIsPlaying(true);
        setupAudioContext();
        // Auto-open lyrics sidebar ONLY on desktop
        if (window.innerWidth >= 768) {
          setShowLyrics(true);
        }
      }).catch(e => console.error("Error playing:", e));
    } else {
      setIsPlaying(true);
      setShowLyrics(true); // Auto-open sidebar
    }
  };

  const __handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  }

  const handleToggleLike = async (song) => {
    if (!song) return;

    const newIsLiked = !song.isLiked;
    const updatedSongs = songs.map(s => s.id === song.id ? { ...s, isLiked: newIsLiked } : s);
    setSongs(updatedSongs);

    // Update current song if it's the one being toggled
    if (currentSong && currentSong.id === song.id) {
      setCurrentSong(prev => ({ ...prev, isLiked: newIsLiked }));
    }

    // Save to DB
    const songToUpdate = updatedSongs.find(s => s.id === song.id);
    if (songToUpdate) {
      await saveSong(songToUpdate);
    }
  };

  const handleAddToQueue = (songId) => {
    const song = songs.find(s => s.id === songId);
    if (song) {
      setQueue(prev => [...prev, song]);
      alert("Added to queue");
    }
  };

  const handlePlayNext = (songId) => {
    const song = songs.find(s => s.id === songId);
    if (song) {
      setQueue(prev => [song, ...prev]);
      alert("Playing next");
    }
  };

  // --- MEDIA SESSION API ---
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist || 'Unknown Artist',
        album: 'Music Player',
        artwork: [
          { src: currentSong.cover && !currentSong.cover.includes('placehold.co') ? currentSong.cover : 'https://placehold.co/512x512/333/fff?text=Music', sizes: '512x512', type: 'image/png' }
        ]
      });
    }

    navigator.mediaSession.setActionHandler('play', () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          fadeIn();
          setIsPlaying(true);
          setupAudioContext();
        }).catch(console.error);
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', skipPrev);
    navigator.mediaSession.setActionHandler('nexttrack', skipNext);
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && audioRef.current) {
        audioRef.current.currentTime = details.seekTime;
        setCurrentTime(details.seekTime);
      }
    });

    return () => {
      // Optional: clear handlers on unmount? usually not needed for single page app
    };
  }, [currentSong, isPlaying, skipNext, skipPrev]);

  return (
    <div
      className="flex h-screen bg-primary text-white overflow-hidden relative"
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
        onNavigate={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }}
        onAddMusic={() => { fileInputRef.current.click(); setIsMobileMenuOpen(false); }}
        onCreatePlaylist={handleCreatePlaylist}
        isMobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenSettings={() => { setShowSettings(true); setIsMobileMenuOpen(false); }}
      />

      <div className="flex-1 flex flex-col relative w-full">
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

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

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {/* Featured Cards / "Good Evening" Style */}
                  {
                    playlists.slice(0, 6).map(playlist => {
                      const firstSongId = playlist.songIds[0];
                      const firstSong = firstSongId ? songs.find(s => s.id === firstSongId) : null;
                      const cover = firstSong ? firstSong.cover : null;

                      return (
                        <div key={playlist.id} className="flex items-center bg-white/10 hover:bg-white/20 transition rounded-md overflow-hidden cursor-pointer group relative shadow-md" onClick={() => { setActivePlaylist(playlist); setCurrentView('playlist-detail'); }}>
                          {cover && !cover.includes('placehold.co') ? (
                            <img src={cover} alt={playlist.name} className="w-20 h-20 min-w-[5rem] object-cover shadow-lg" />
                          ) : (
                            <div className="w-20 h-20 min-w-[5rem] bg-bg-card flex items-center justify-center text-text-secondary shadow-lg">
                              <Music size={32} />
                            </div>
                          )}
                          <div className="px-4 flex-1 font-bold truncate text-sm md:text-base">{playlist.name}</div>

                          {/* Play Button (Hover) */}
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
                  onDelete={handleDeleteSong}
                  onClearAll={handleClearAllSongs}
                  onAddToPlaylist={handleAddToPlaylist}
                  onSort={handleSort}
                  onAddToQueue={handleAddToQueue}
                  onPlayNext={handlePlayNext}
                />
              </>
            )}

            {currentView === 'search' && <Search songs={songs} onPlay={handleSongSelect} />}

            {currentView === 'library' && (
              <YourLibrary
                playlists={playlists}
                songs={songs}
                onSelect={handleSongSelect}
                onCreatePlaylist={handleCreatePlaylist}
                onSelectPlaylist={handleSelectPlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                currentSong={currentSong}
                isPlaying={isPlaying}
              />
            )}

            {currentView === 'liked' && (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white rounded shadow-lg">
                    <Heart size={64} fill="white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase mb-2">Playlist</p>
                    <h2 className="text-5xl font-bold mb-4">Liked Songs</h2>
                    <p className="text-sm text-text-secondary">
                      {songs.filter(s => s.isLiked).length} songs
                    </p>
                  </div>
                </div>

                <SongList
                  songs={songs.filter(s => s.isLiked)}
                  currentSong={currentSong}
                  onSelect={handleSongSelect}
                  isPlaying={isPlaying}
                  onDelete={handleDeleteSong}
                  onAddToPlaylist={handleAddToPlaylist}
                  onSort={handleSort}
                  onAddToQueue={handleAddToQueue}
                  onPlayNext={handlePlayNext}
                />
              </div>
            )}

            {currentView === 'queue' && (
              <div className="flex flex-col h-full">
                <h2 className="text-3xl font-bold mb-6">Queue</h2>

                <h3 className="text-xl font-bold mb-4 text-text-secondary">Now Playing</h3>
                {currentSong && (
                  <div className="mb-8">
                    <SongList
                      songs={[currentSong]}
                      currentSong={currentSong}
                      onSelect={() => { }} // No-op for now playing
                      isPlaying={isPlaying}
                      onAddToPlaylist={handleAddToPlaylist}
                      onAddToQueue={handleAddToQueue}
                      onPlayNext={handlePlayNext}
                    />
                  </div>
                )}

                <h3 className="text-xl font-bold mb-4 text-text-secondary">Next In Queue</h3>
                {queue.length === 0 ? (
                  <p className="text-text-secondary">Queue is empty</p>
                ) : (
                  <SongList
                    songs={queue}
                    currentSong={null} // Don't highlight any as current in the upcoming list
                    onSelect={handleSongSelect} // Allow playing from queue
                    isPlaying={false}
                    onAddToPlaylist={handleAddToPlaylist}
                    onAddToQueue={handleAddToQueue}
                    onPlayNext={handlePlayNext}
                    onDelete={(id) => setQueue(prev => prev.filter(s => s.id !== id))} // Allow removing from queue
                  />
                )}

                {history.length > 0 && (
                  <>
                    <h3 className="text-xl font-bold mb-4 text-text-secondary mt-8">Recently Played</h3>
                    <SongList
                      songs={history.slice(0, 5)}
                      currentSong={null}
                      onSelect={handleSongSelect}
                      isPlaying={false}
                      onAddToPlaylist={handleAddToPlaylist}
                      onAddToQueue={handleAddToQueue}
                      onPlayNext={handlePlayNext}
                    />
                  </>
                )}
              </div>
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
                  onAddToQueue={handleAddToQueue}
                  onPlayNext={handlePlayNext}
                />
              </div>
            )}

            {currentView === 'visualizer' && (
              <Visualizer
                analyser={analyserRef.current}
                isPlaying={isPlaying}
                currentSong={currentSong}
                onSaveLyrics={handleSaveLyrics}
                currentTime={currentTime}
              />
            )}
          </div>

          {/* Edit Song Modal */}
          {editingSong && (
            <EditSongModal
              song={editingSong}
              onSave={handleUpdateSongData}
              onClose={() => setEditingSong(null)}
            />
          )}

          {/* Lyrics Panel - Hide in Visualizer to avoid duplicate panels */}
          {showLyrics && currentView !== 'visualizer' && (
            <div className="absolute inset-x-0 bottom-24 top-0 md:static md:w-1/4 md:min-w-[250px] border-l border-white/10 bg-[#121212] z-50 flex-shrink-0 transition-all duration-300">
              <LyricsView
                song={currentSong}
                onClose={() => setShowLyrics(false)}
                onSaveLyrics={handleSaveLyrics}
              />
            </div>
          )}
        </main>

        {/* Player Bar */}
        <div className="h-24 bg-bg-secondary border-t border-bg-highlight px-4 flex items-center justify-between z-50 relative">
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
            onToggleRepeat={() => setRepeatMode((prev) => (prev + 1) % 3)}
            onToggleLyrics={() => setShowLyrics(!showLyrics)}
            isLyricsOpen={showLyrics}
            isSleepTimerActive={isSleepTimerActive}
            onSetSleepTimer={handleSetSleepTimer}
            onToggleLike={() => handleToggleLike(currentSong)}
            onToggleQueue={() => setCurrentView(prev => prev === 'queue' ? 'home' : 'queue')}
            onToggleEqualizer={() => setShowEqualizer(!showEqualizer)}
          />

          {/* Equalizer Modal */}
          {showEqualizer && (
            <Equalizer
              gains={eqGains}
              onUpdateGain={handleUpdateEqGain}
              onClose={() => setShowEqualizer(false)}
            />
          )}

          {/* Edit Song Modal */}
          {editingSong && (
            <EditSongModal
              song={editingSong}
              onSave={handleUpdateSongData}
              onClose={() => setEditingSong(null)}
            />
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



      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onDataRestored={() => {
            refreshLibrary();
            showToast('Library Restored Successfully');
          }}
        />
      )}

      {/* Playlist Selector Modal */}
      {showPlaylistSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-gray-700 p-6 rounded-lg w-full max-w-md shadow-2xl relative">
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
