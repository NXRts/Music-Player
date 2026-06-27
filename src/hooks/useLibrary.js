import { useState, useEffect, useCallback } from "react";
import {
  getAllSongs,
  getAllPlaylists,
  getAllFolders,
  saveSong,
  savePlaylist,
  deleteSong,
  clearAllSongs,
  deletePlaylist,
  saveFolderHandle,
} from "../services/db";
import {
  getSongMetadata,
  getAudioDuration,
  formatDuration,
} from "../utils/audioUtils";

export const useLibrary = () => {
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Load
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [storedSongs, storedPlaylists, storedFolders] = await Promise.all(
          [getAllSongs(), getAllPlaylists(), getAllFolders()],
        );

        // Create Object URLs for local files
        const songsWithUrls = storedSongs.map((song) => {
          if (song.file) {
            try {
              return { ...song, src: URL.createObjectURL(song.file) };
            } catch (e) {
              return song;
            }
          }
          return song;
        });

        // Clean Playlists
        const validSongIds = new Set(songsWithUrls.map((s) => s.id));
        const cleanedPlaylists = storedPlaylists.map((playlist) => {
          const validSongIdsInPlaylist = playlist.songIds.filter((id) =>
            validSongIds.has(id),
          );
          if (validSongIdsInPlaylist.length !== playlist.songIds.length) {
            const updated = { ...playlist, songIds: validSongIdsInPlaylist };
            savePlaylist(updated);
            return updated;
          }
          return playlist;
        });

        setSongs(songsWithUrls);
        setPlaylists(cleanedPlaylists);
      } catch (error) {
        console.error("Failed to load library:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Actions ---

  const addNewSong = useCallback(async (songData) => {
    await saveSong(songData);
    setSongs((prev) => [...prev, songData]);
  }, []);

  const updateSong = useCallback(
    async (songId, newData) => {
      const updatedSongs = songs.map((s) =>
        s.id === songId ? { ...s, ...newData } : s,
      );
      setSongs(updatedSongs);
      const songToUpdate = updatedSongs.find((s) => s.id === songId);
      if (songToUpdate) await saveSong(songToUpdate);
    },
    [songs],
  );

  const removeSong = useCallback(
    async (songId) => {
      await deleteSong(songId);
      // Revoke URL if exists
      const song = songs.find((s) => s.id === songId);
      if (song?.src) URL.revokeObjectURL(song.src);
      setSongs((prev) => prev.filter((s) => s.id !== songId));
    },
    [songs],
  );

  const clearLibrary = useCallback(async () => {
    await clearAllSongs();
    songs.forEach((s) => s.src && URL.revokeObjectURL(s.src));
    setSongs([]);
  }, [songs]);

  const createPlaylist = useCallback(async (name) => {
    const newPlaylist = {
      id: Date.now(),
      name,
      songIds: [],
      createdAt: Date.now(),
    };
    await savePlaylist(newPlaylist);
    setPlaylists((prev) => [...prev, newPlaylist]);
  }, []);

  const updatePlaylist = useCallback(async (playlist) => {
    await savePlaylist(playlist);
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlist.id ? playlist : p)),
    );
  }, []);

  const removePlaylist = useCallback(async (id) => {
    await deletePlaylist(id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addToPlaylist = useCallback(
    async (playlistId, songId) => {
      const playlist = playlists.find((p) => p.id === playlistId);
      if (playlist && !playlist.songIds.includes(songId)) {
        const updated = { ...playlist, songIds: [...playlist.songIds, songId] };
        await updatePlaylist(updated);
      }
    },
    [playlists, updatePlaylist],
  );

  // File Upload Handler meant to be used by UI
  const processFiles = useCallback(
    async (files) => {
      const newSongs = [];
      const existingTitles = new Set(songs.map((s) => s.title));

      for (const file of files) {
        try {
          const durationSeconds = await getAudioDuration(file);
          const metadata = await getSongMetadata(file);
          const titleToCheck =
            metadata.title || file.name.replace(/\.[^/.]+$/, "");

          if (existingTitles.has(titleToCheck)) continue;
          existingTitles.add(titleToCheck);

          const newSong = {
            id: Date.now() + Math.random(),
            title: titleToCheck,
            artist: metadata.artist || "Unknown Artist",
            album: metadata.album || "Unknown Album",
            duration: formatDuration(durationSeconds),
            cover:
              metadata.cover ||
              "https://placehold.co/300x300/333333/ffffff?text=MP3",
            file: file,
            createdAt: Date.now(),
            src: URL.createObjectURL(file),
          };

          await saveSong(newSong);
          newSongs.push(newSong);
        } catch (e) {
          console.error("Error processing file", file.name, e);
        }
      }

      if (newSongs.length > 0) {
        setSongs((prev) => [...prev, ...newSongs]);
      }
      return newSongs.length;
    },
    [songs],
  );

  // Sync Folder Handler
  const syncLocalFolder = useCallback(async () => {
    if (!("showDirectoryPicker" in window)) {
      throw new Error("Browser does not support File System Access API");
    }

    try {
      const folderHandle = await window.showDirectoryPicker();
      await saveFolderHandle({ path: folderHandle.name, handle: folderHandle });

      const audioFiles = [];
      const scan = async (handle, path = "") => {
        for await (const entry of handle.values()) {
          if (entry.kind === "directory") {
            await scan(entry, `${path}/${entry.name}`);
          } else if (entry.kind === "file") {
            if (/\.(mp3|wav|m4a|flac|ogg)$/i.test(entry.name)) {
              audioFiles.push({ handle: entry, path: `${path}/${entry.name}` });
            }
          }
        }
      };

      await scan(folderHandle);

      let processedCount = 0;
      const newSongs = [];
      const existingTitles = new Set(songs.map((s) => s.title));

      for (const fileObj of audioFiles) {
        const { handle, path } = fileObj;
        const file = await handle.getFile();

        const metadata = await getSongMetadata(file);
        const title = metadata.title || file.name.replace(/\.[^/.]+$/, "");
        const artist = metadata.artist || "Unknown Artist";

        // Check duplicates
        const isDuplicate =
          existingTitles.has(title) || existingTitles.has(`${title}-${artist}`);
        if (isDuplicate) continue;

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
          type: "local",
          fileHandle: handle,
          path: path,
          createdAt: Date.now(),
          playCount: 0,
          isLiked: false,
        };

        await saveSong(songData);
        newSongs.push(songData);
        existingTitles.add(title);
        processedCount++;
      }

      if (newSongs.length > 0) {
        setSongs((prev) => [...prev, ...newSongs]);
      }

      return {
        added: newSongs.length,
        total: audioFiles.length,
        folderName: folderHandle.name,
      };
    } catch (error) {
      if (error.name !== "AbortError") throw error;
      return null; // Cancelled
    }
  }, [songs]);

  const sortSongs = useCallback((type) => {
    setSongs((prev) => {
      const sorted = [...prev];
      if (type === "title") {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
      } else if (type === "date") {
        // Descending order (Newest first)
        sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }
      return sorted;
    });
  }, []);

  return {
    songs,
    playlists,
    isLoading,
    addNewSong,
    updateSong,
    removeSong,
    clearLibrary,
    createPlaylist,
    updatePlaylist,
    removePlaylist,
    addToPlaylist,
    processFiles,
    syncLocalFolder,
    sortSongs,
  };
};
