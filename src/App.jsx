import React, { useState, useRef, useEffect } from 'react';
import EditSongModal from './components/EditSongModal';
import SettingsModal from './components/SettingsModal';
import CreatePlaylistModal from './components/CreatePlaylistModal';

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
import { saveSong, getAllSongs, deleteSong, clearAllSongs, savePlaylist, getAllPlaylists, deletePlaylist, saveFolderHandle, getAllFolders } from './services/db';
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
  const [playbackContext, setPlaybackContext] = useState([]); // Context for Next/Prev (e.g. current playlist)

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
  const [isNormalizationEnabled, setIsNormalizationEnabled] = useState(() => {
    return localStorage.getItem('isNormalizationEnabled') === 'true';
  });
  const filtersRef = useRef([]);
  const [isDragging, setIsDragging] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [accentColor, setAccentColor] = useState(localStorage.getItem('accentColor') || '#1db954');
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const sleepTimerRef = useRef(null);

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // Apply Theme & Accent
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
    root.style.setProperty('--color-accent', accentColor);

    // Save to local storage
    localStorage.setItem('theme', theme);
    localStorage.setItem('accentColor', accentColor);
  }, [theme, accentColor]);

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

  // Dual Audio Players for Crossfading
  const audioRef1 = useRef(null);
  const audioRef2 = useRef(null);
  const [activePlayer, setActivePlayer] = useState(1); // 1 or 2

  // Audio Context & Visualizer
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef1 = useRef(null);
  const sourceRef2 = useRef(null);
  const gainNode1 = useRef(null);
  const gainNode2 = useRef(null);
  const compressorRef = useRef(null);

  const setupAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (!analyserRef.current) {
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    }

    if (!compressorRef.current) {
      compressorRef.current = audioContextRef.current.createDynamicsCompressor();
      // Default normalization settings
      compressorRef.current.threshold.value = -24;
      compressorRef.current.knee.value = 30;
      compressorRef.current.ratio.value = 12;
      compressorRef.current.attack.value = 0.003;
      compressorRef.current.release.value = 0.25;
    }

    // Initialize Filters if not passed
    if (filtersRef.current.length === 0) {
      const frequencies = [60, 230, 910, 3600, 14000];
      filtersRef.current = frequencies.map(freq => {
        const filter = audioContextRef.current.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = 0;
        return filter;
      });

      filtersRef.current[0].type = 'lowshelf';
      filtersRef.current[4].type = 'highshelf';
    }

    // Connect Player 1
    if (audioRef1.current && !sourceRef1.current) {
      try {
        sourceRef1.current = audioContextRef.current.createMediaElementSource(audioRef1.current);
        gainNode1.current = audioContextRef.current.createGain();
        sourceRef1.current.connect(gainNode1.current);
        gainNode1.current.connect(analyserRef.current);
      } catch (e) { console.error("Source 1 setup error", e); }
    }

    // Connect Player 2
    if (audioRef2.current && !sourceRef2.current) {
      try {
        sourceRef2.current = audioContextRef.current.createMediaElementSource(audioRef2.current);
        gainNode2.current = audioContextRef.current.createGain();
        sourceRef2.current.connect(gainNode2.current);
        gainNode2.current.connect(analyserRef.current);
      } catch (e) { console.error("Source 2 setup error", e); }
    }

    // Connect common chain: Analyser -> Filters -> Destination
    if (analyserRef.current && filtersRef.current.length > 0) {
      try {
        analyserRef.current.disconnect();
      } catch (e) { }

      let prevNode = analyserRef.current;
      filtersRef.current.forEach(filter => {
        try { prevNode.disconnect(); } catch (e) { }
        prevNode.connect(filter);
        prevNode = filter;
      });

      // Normalization check
      try { prevNode.disconnect(); } catch (e) { }
      if (isNormalizationEnabled) {
        prevNode.connect(compressorRef.current);
        compressorRef.current.connect(audioContextRef.current.destination);
      } else {
        prevNode.connect(audioContextRef.current.destination);
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

  const toggleNormalization = () => {
    const newValue = !isNormalizationEnabled;
    setIsNormalizationEnabled(newValue);
    localStorage.setItem('isNormalizationEnabled', newValue);

    // Re-connect chain to apply/remove compressor
    if (audioContextRef.current) {
      setupAudioContext();
    }
  };



  // Initialize Audio on mount
  useEffect(() => {
    audioRef1.current = new Audio();
    audioRef1.current.crossOrigin = "anonymous";
    audioRef2.current = new Audio();
    audioRef2.current.crossOrigin = "anonymous";
  }, []);

  // Load songs & playlists from DB on mount
  // Load songs & playlists from DB on mount
  const refreshLibrary = async () => {
    try {
      const savedSongs = await getAllSongs();
      const songsWithUrls = savedSongs.map(song => {
        if (song.file) {
          try {
            return { ...song, src: URL.createObjectURL(song.file) };
          } catch (e) {
            console.error("Error creating URL for song:", song.title, e);
            return song;
          }
        }
        return song;
      });
      setSongs(songsWithUrls);
    } catch (e) {
      console.error("Refresh library failed:", e);
    }
  };

  // Load songs, playlists & synced folders from DB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedSongs = await getAllSongs();
        const storedPlaylists = await getAllPlaylists();
        const storedFolders = await getAllFolders();

        const songsWithUrls = storedSongs.map(song => {
          if (song.file) {
            try {
              return { ...song, src: URL.createObjectURL(song.file) };
            } catch (e) {
              return song;
            }
          }
          return song;
        });

        setSongs(songsWithUrls);
        setPlaylists(storedPlaylists);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    loadData();
  }, []);





  const handleNavigate = (view) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const handleSyncFolder = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert("Browser Anda tidak mendukung File System Access API. Silakan gunakan Chrome atau Edge.");
      return;
    }

    try {
      const folderHandle = await window.showDirectoryPicker();
      await saveFolderHandle({ path: folderHandle.name, handle: folderHandle });

      showToast(`Mulai memindai folder: ${folderHandle.name}...`);

      const audioFiles = [];
      const scan = async (handle, path = '') => {
        for await (const entry of handle.values()) {
          if (entry.kind === 'directory') {
            await scan(entry, `${path}/${entry.name}`);
          } else if (entry.kind === 'file') {
            if (/\.(mp3|wav|m4a|flac|ogg)$/i.test(entry.name)) {
              audioFiles.push({ handle: entry, path: `${path}/${entry.name}` });
            }
          }
        }
      };

      await scan(folderHandle);

      let processedCount = 0;
      const newSongs = [];

      const existingSongs = [...songs];
      const titlesInBatch = new Set();

      for (const fileObj of audioFiles) {
        const { handle, path } = fileObj;
        const file = await handle.getFile();

        const metadata = await getSongMetadata(file);
        const title = metadata.title || file.name.replace(/\.[^/.]+$/, "");
        const artist = metadata.artist || "Unknown Artist";

        // Skip if already in library
        const isDuplicate = existingSongs.some(s =>
          (s.title === title && s.artist === artist) ||
          (s.title === file.name.replace(/\.[^/.]+$/, "") && s.size === file.size)
        ) || titlesInBatch.has(`${title}-${artist}`);

        if (isDuplicate) {
          continue;
        }

        const durationSeconds = await getAudioDuration(file);
        const formattedDuration = formatDuration(durationSeconds);

        const songData = {
          id: Date.now() + Math.random(),
          title,
          artist,
          album: metadata.album || "Unknown Album",
          cover: metadata.cover,
          duration: formattedDuration,
          size: file.size,
          type: 'local',
          fileHandle: handle,
          path: path,
          createdAt: Date.now(),
          playCount: 0,
          isLiked: false
        };

        await saveSong(songData);
        newSongs.push(songData);
        titlesInBatch.add(`${title}-${artist}`);
        processedCount++;

        if (processedCount % 5 === 0) {
          showToast(`Indexing: ${processedCount}/${audioFiles.length} lagu...`);
        }
      }

      if (newSongs.length > 0) {
        setSongs(prev => [...prev, ...newSongs]);
        showToast(`Sinkronisasi selesai! Berhasil menambahkan ${newSongs.length} lagu.`);
      } else {
        showToast("Folder sudah sinkron. Tidak ada lagu baru.");
      }

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Folder sync failed:", error);
        alert("Gagal sinkronisasi folder: " + error.message);
      }
    }
  };

  const handleCreatePlaylist = () => {
    setShowCreatePlaylistModal(true);
  };

  const finalizeCreatePlaylist = async (name) => {
    const newPlaylist = {
      id: Date.now(),
      name,
      songIds: [],
      createdAt: Date.now()
    };

    await savePlaylist(newPlaylist);
    setPlaylists(prev => [...prev, newPlaylist]);
    setShowCreatePlaylistModal(false);
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
    if (files.length === 0) return;

    const existingTitles = new Set(songs.map(s => s.title));
    let addedCount = 0;

    showToast(`Memproses ${files.length} lagu...`);

    try {
      // Process each file
      for (const file of files) {
        try {
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
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
        }
      }

      if (addedCount > 0) {
        showToast(`Berhasil menambahkan ${addedCount} lagu.`);
      } else if (files.length > 0) {
        showToast("Tidak ada lagu baru yang ditambahkan (mungkin duplikat).");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Gagal mengunggah lagu: " + error.message);
    } finally {
      // Clear the input so the same file can be selected again
      if (event.target) event.target.value = '';
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

  const handleReorderQueue = (fromIndex, toIndex) => {
    setQueue(prevQueue => {
      const result = [...prevQueue];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  };

  const handleDeleteAllSongs = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus SEMUA lagu dari library? Tindakan ini tidak dapat dibatalkan.")) {
      try {
        await clearAllSongs();
        setSongs([]);
        showToast("Seluruh library telah dihapus.");
        if (isPlaying) {
          setIsPlaying(false);
          setCurrentSong(null);
        }
      } catch (error) {
        console.error("Failed to delete all songs:", error);
        alert("Gagal menghapus library.");
      }
    }
  };

  const handleReorderPlaylist = async (fromIndex, toIndex) => {
    if (!activePlaylist) return;
    const updatedIds = [...activePlaylist.songIds];
    const [removed] = updatedIds.splice(fromIndex, 1);
    updatedIds.splice(toIndex, 0, removed);

    const updatedPlaylist = { ...activePlaylist, songIds: updatedIds };
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
          const activeAudio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
          if (activeAudio) {
            activeAudio.pause();
            activeAudio.src = "";
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
        const audio1 = audioRef1.current;
        const audio2 = audioRef2.current;
        if (audio1) { audio1.pause(); audio1.src = ""; }
        if (audio2) { audio2.pause(); audio2.src = ""; }
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



  const skipNext = (forceNoCrossfade = false) => {
    if (queue.length > 0) {
      const nextSong = queue[0];
      setQueue(prev => prev.slice(1));
      handleSongSelect(nextSong, null, forceNoCrossfade);
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

    const nextSong = context[nextIndex];
    handleSongSelect(nextSong, null, forceNoCrossfade);
  };

  const skipPrev = (forceNoCrossfade = false) => {
    const context = playbackContext.length > 0 ? playbackContext : songs;
    if (context.length === 0) return;

    const currentIndex = context.findIndex(s => s.id === currentSong?.id);
    const prevIndex = (currentIndex - 1 + context.length) % context.length;

    const prevSong = context[prevIndex];
    handleSongSelect(prevSong, null, forceNoCrossfade);
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input
      const isInput = document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable;
      if (isInput) return;

      switch (e.key.toLowerCase()) {
        case ' ': // Space
          e.preventDefault();
          handlePlayPause();
          break;
        case 'arrowright':
          e.preventDefault();
          skipNext();
          break;
        case 'arrowleft':
          e.preventDefault();
          skipPrev();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.05));
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.05));
          break;
        case 'm':
          setIsMuted(prev => !prev);
          break;
        case 'l':
          if (currentSong) handleToggleLike(currentSong);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSong, isPlaying, playbackContext, songs]);

  const toggleRepeat = () => {
    setRepeatMode(prev => (prev + 1) % 3);
  };

  useEffect(() => {
    const audio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration) setDuration(audio.duration);
    };

    // If metadata is already loaded, set it immediately
    if (audio.duration) {
      setDuration(audio.duration);
    }
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
      skipNext(true);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    }
  }, [currentSong, isShuffle, songs, repeatMode, activePlayer]); // Added activePlayer dependency


  useEffect(() => {
    const activeAudio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
    if (isPlaying && currentSong && activeAudio) { // Ensure there is a song
      setupAudioContext();
      const playPromise = activeAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.error("Playback failed or interrupted:", e);
        });
      }
    } else if (!isPlaying && activeAudio) {
      activeAudio.pause();
    }
  }, [isPlaying, currentSong, activePlayer]); // Depend on currentSong to trigger play when song changes

  // Reset progress when song changes manually (without crossfade)
  useEffect(() => {
    if (currentSong && !isPlaying) {
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentSong]);

  // Set volume
  useEffect(() => {
    if (audioRef1.current) audioRef1.current.volume = isMuted ? 0 : volume;
    if (audioRef2.current) audioRef2.current.volume = isMuted ? 0 : volume;
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
      prevVolumeRef.current = volume;
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
          const activeAudioR = activePlayer === 1 ? audioRef1.current : audioRef2.current;
          if (activeAudioR) {
            const newTime = Math.min(activeAudioR.currentTime + 5, activeAudioR.duration || 0);
            __handleSeek(newTime);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          const activeAudioL = activePlayer === 1 ? audioRef1.current : audioRef2.current;
          if (activeAudioL) {
            const newTime = Math.max(activeAudioL.currentTime - 5, 0);
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
    setupAudioContext();
    const activeAudio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
    if (isPlaying) {
      if (activeAudio) activeAudio.pause();
      setIsPlaying(false);
    } else {
      if (activeAudio) {
        activeAudio.play().then(() => {
          setIsPlaying(true);
        }).catch(e => console.error(e));
      }
    }
  };

  const handleSongSelect = (song, context = null, forceNoCrossfade = false) => {
    setupAudioContext();
    // Set playback context if provided
    if (context) {
      setPlaybackContext(context);
    } else if (playbackContext.length === 0 || !playbackContext.find(s => s.id === song.id)) {
      setPlaybackContext(songs);
    }

    // Smart logic for clicking current song
    if (currentSong && currentSong.id === song.id) {
      if (!isPlaying) {
        handlePlayPause(); // Resume if paused
      }
      return; // Do nothing if already playing current song
    }

    // Increment play count
    const updatedPlayCount = (song.playCount || 0) + 1;
    handleUpdateSongData(song.id, { playCount: updatedPlayCount });

    __playSong(song);
  };

  const __playSong = async (song, shouldPlay = true) => {
    // If it's a local file from a synced folder, we need to get the file blob first
    let songSrc = song.src;

    if (song.type === 'local' && song.fileHandle) {
      try {
        // Request permission if needed
        const status = await song.fileHandle.queryPermission({ mode: 'read' });
        if (status !== 'granted') {
          const newStatus = await song.fileHandle.requestPermission({ mode: 'read' });
          if (newStatus !== 'granted') {
            showToast("Izin akses file ditolak.");
            return;
          }
        }

        const file = await song.fileHandle.getFile();
        songSrc = URL.createObjectURL(file);
        // Clear old URL if needed? Blob URLs should be managed carefully
      } catch (e) {
        console.error("Failed to access local file:", e);
        showToast("Gagal mengakses file lokal. Mungkin folder telah dipindahkan.");
        return;
      }
    }

    setCurrentSong({ ...song, src: songSrc });
    const activeAudio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
    if (activeAudio) {
      activeAudio.src = songSrc;
      if (shouldPlay) {
        activeAudio.play().then(() => {
          setIsPlaying(true);
          // Auto-open lyrics sidebar ONLY on desktop
          if (window.innerWidth >= 768) {
            setShowLyrics(true);
          }
        }).catch(e => console.error("Error playing:", e));
      }
    } else {
      setIsPlaying(shouldPlay);
      setShowLyrics(true); // Auto-open sidebar
    }
  };

  const __handleSeek = (time) => {
    const activeAudio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
    if (activeAudio) {
      activeAudio.currentTime = time;
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
      setupAudioContext();
      const activeAudio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
      if (activeAudio) {
        activeAudio.play().then(() => {
          setIsPlaying(true);
        }).catch(console.error);
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      setIsPlaying(false);
      const activeAudio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
      if (activeAudio) activeAudio.pause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', skipPrev);
    navigator.mediaSession.setActionHandler('nexttrack', skipNext);
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      const activeAudio = activePlayer === 1 ? audioRef1.current : audioRef2.current;
      if (details.seekTime !== undefined && activeAudio) {
        activeAudio.currentTime = details.seekTime;
        setCurrentTime(details.seekTime);
      }
    });

    return () => {
      // Optional: clear handlers on unmount? usually not needed for single page app
    };
  }, [currentSong, isPlaying, skipNext, skipPrev]);

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
        onNavigate={handleNavigate}
        onAddMusic={() => { fileInputRef.current.click(); setIsMobileMenuOpen(false); }}
        onSyncFolder={() => { handleSyncFolder(); setIsMobileMenuOpen(false); }}
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
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-bg-highlight to-bg-primary relative">

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
                      className="bg-text-primary text-bg-primary font-bold py-2 px-6 rounded-full hover:scale-105 transition"
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
                        <div key={playlist.id} className="flex items-center bg-bg-card hover:bg-bg-highlight transition rounded-md overflow-hidden cursor-pointer group relative shadow-md" onClick={() => { setActivePlaylist(playlist); setCurrentView('playlist-detail'); }}>
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
                  onDeleteAll={handleDeleteAllSongs}
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
                onAddMusic={() => fileInputRef.current.click()}
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
                    <p className="text-sm font-bold uppercase mb-2">Smart Playlist</p>
                    <h2 className="text-5xl font-bold mb-4">Favorites</h2>
                    <p className="text-sm text-text-secondary">
                      {songs.filter(s => s.isLiked).length} songs
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const likedSongs = songs.filter(s => s.isLiked);
                      if (likedSongs.length > 0) handleSongSelect(likedSongs[0], likedSongs);
                    }}
                    className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-black hover:scale-105 transition shadow-lg ml-auto"
                  >
                    <Play fill="black" size={24} />
                  </button>
                </div>

                <SongList
                  songs={songs.filter(s => s.isLiked)}
                  currentSong={currentSong}
                  onSelect={(song) => handleSongSelect(song, songs.filter(s => s.isLiked))}
                  isPlaying={isPlaying}
                  onDelete={handleDeleteSong}
                  onAddToPlaylist={handleAddToPlaylist}
                  onSort={handleSort}
                  onAddToQueue={handleAddToQueue}
                  onPlayNext={handlePlayNext}
                />
              </div>
            )}

            {currentView === 'most-played' && (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white rounded shadow-lg">
                    <Sliders size={64} fill="white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase mb-2">Smart Playlist</p>
                    <h2 className="text-5xl font-bold mb-4">Most Played</h2>
                    <p className="text-sm text-text-secondary">Based on your activity</p>
                  </div>
                  <button
                    onClick={() => {
                      const mostPlayed = [...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 50);
                      if (mostPlayed.length > 0) handleSongSelect(mostPlayed[0], mostPlayed);
                    }}
                    className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-black hover:scale-105 transition shadow-lg ml-auto"
                  >
                    <Play fill="black" size={24} />
                  </button>
                </div>

                <SongList
                  songs={[...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 50)}
                  currentSong={currentSong}
                  onSelect={(song) => {
                    const mostPlayed = [...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 50);
                    handleSongSelect(song, mostPlayed);
                  }}
                  isPlaying={isPlaying}
                  onDelete={handleDeleteSong}
                  onAddToPlaylist={handleAddToPlaylist}
                  onSort={handleSort}
                  onAddToQueue={handleAddToQueue}
                  onPlayNext={handlePlayNext}
                />
              </div>
            )}

            {currentView === 'recently-added' && (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white rounded shadow-lg">
                    <Music size={64} fill="white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase mb-2">Smart Playlist</p>
                    <h2 className="text-5xl font-bold mb-4">Recently Added</h2>
                    <p className="text-sm text-text-secondary">Your latest uploads</p>
                  </div>
                  <button
                    onClick={() => {
                      const recent = [...songs].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 50);
                      if (recent.length > 0) handleSongSelect(recent[0], recent);
                    }}
                    className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-black hover:scale-105 transition shadow-lg ml-auto"
                  >
                    <Play fill="black" size={24} />
                  </button>
                </div>

                <SongList
                  songs={[...songs].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 50)}
                  currentSong={currentSong}
                  onSelect={(song) => {
                    const recent = [...songs].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 50);
                    handleSongSelect(song, recent);
                  }}
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
                    onSelect={(song) => handleSongSelect(song, queue)} // Allow playing from queue
                    isPlaying={false}
                    onAddToPlaylist={handleAddToPlaylist}
                    onAddToQueue={handleAddToQueue}
                    onPlayNext={handlePlayNext}
                    onDelete={(id) => setQueue(prev => prev.filter(s => s.id !== id))} // Allow removing from queue
                    onReorder={handleReorderQueue}
                  />
                )}

                {history.length > 0 && (
                  <>
                    <h3 className="text-xl font-bold mb-4 text-text-secondary mt-8">Recently Played</h3>
                    <SongList
                      songs={history.slice(0, 5)}
                      currentSong={null}
                      onSelect={(song) => handleSongSelect(song, history.slice(0, 5))}
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
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold">{activePlaylist.name}</h2>
                    <p className="text-sm text-text-secondary">{activePlaylist.songIds.length} songs</p>
                  </div>
                  <button
                    onClick={() => {
                      const playlistSongs = songs.filter(s => activePlaylist.songIds.includes(s.id));
                      if (playlistSongs.length > 0) handleSongSelect(playlistSongs[0], playlistSongs);
                    }}
                    className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-black hover:scale-105 transition shadow-lg"
                  >
                    <Play fill="black" size={24} />
                  </button>
                </div>

                <SongList
                  songs={songs.filter(s => activePlaylist.songIds.includes(s.id))}
                  currentSong={currentSong}
                  onSelect={(song) => handleSongSelect(song, songs.filter(s => activePlaylist.songIds.includes(s.id)))}
                  isPlaying={isPlaying}
                  onDelete={handleRemoveFromPlaylist}
                  onAddToPlaylist={handleAddToPlaylist}
                  onAddToQueue={handleAddToQueue}
                  onPlayNext={handlePlayNext}
                  onReorder={handleReorderPlaylist}
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
            <div className="absolute inset-x-0 bottom-24 top-0 md:static md:w-1/4 md:min-w-[250px] border-l border-bg-highlight bg-bg-secondary z-50 flex-shrink-0 transition-all duration-300">
              <LyricsView
                song={currentSong}
                onClose={() => setShowLyrics(false)}
                onSaveLyrics={handleSaveLyrics}
              />
            </div>
          )}
        </main>

        {/* Player Bar */}
        <div className="h-24 bg-bg-card border-t border-bg-highlight px-4 flex items-center justify-between z-50 relative">
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

          {showCreatePlaylistModal && (
            <CreatePlaylistModal
              onClose={() => setShowCreatePlaylistModal(false)}
              onCreate={finalizeCreatePlaylist}
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
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] bg-accent text-black font-bold py-2 px-6 rounded-full shadow-2xl animate-bounce">
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
