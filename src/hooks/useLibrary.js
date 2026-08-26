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
    try {
      await clearAllSongs();
    } catch (error) {
      console.error("Failed to clear songs from database:", error);
    } finally {
      songs.forEach((s) => s.src && URL.revokeObjectURL(s.src));
      setSongs([]);
      setPlaylists((prevPlaylists) =>
        prevPlaylists.map((p) => {
          const updated = { ...p, songIds: [] };
          savePlaylist(updated).catch(() => {});
          return updated;
        }),
      );
    }
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
    async (files, onProgress) => {
      const allNewSongs = [];
      const existingKeys = new Set(
        songs.map(
          (s) =>
            `${s.title}|${s.artist || "Unknown Artist"}|${s.file?.name || s.path || ""}`,
        ),
      );

      // Filter audio files
      const audioFiles = Array.from(files).filter(
        (f) =>
          f.type.startsWith("audio/") ||
          /\.(mp3|wav|m4a|flac|ogg|aac|wma|opus|webm)$/i.test(f.name),
      );

      const BATCH_SIZE = 8;
      for (let i = 0; i < audioFiles.length; i += BATCH_SIZE) {
        const chunk = audioFiles.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          chunk.map(async (file, idx) => {
            try {
              const metadata = await getSongMetadata(file);
              const durationSeconds = await getAudioDuration(file);
              const title =
                metadata.title || file.name.replace(/\.[^/.]+$/, "");
              const artist = metadata.artist || "Unknown Artist";

              const songKey = `${title}|${artist}|${file.name}`;
              if (existingKeys.has(songKey)) return null;
              existingKeys.add(songKey);

              return {
                id: `${Date.now()}-${i + idx}-${Math.random().toString(36).substring(2, 7)}`,
                title,
                artist,
                album: metadata.album || "Unknown Album",
                duration: formatDuration(durationSeconds),
                cover:
                  metadata.cover ||
                  "https://placehold.co/300x300/333333/ffffff?text=MP3",
                file: file,
                createdAt: Date.now(),
                src: URL.createObjectURL(file),
              };
            } catch (e) {
              console.error("Error processing file", file.name, e);
              return null;
            }
          }),
        );

        const validSongs = batchResults.filter(Boolean);
        if (validSongs.length > 0) {
          try {
            await saveSongsBatch(validSongs);
          } catch (e) {
            console.warn("DB batch save warning:", e);
          }
          allNewSongs.push(...validSongs);
          setSongs((prev) => [...prev, ...validSongs]);
        }

        if (onProgress) {
          onProgress(
            Math.min(i + BATCH_SIZE, audioFiles.length),
            audioFiles.length,
          );
        }
      }

      return allNewSongs.length;
    },
    [songs],
  );

  // Sync Folder Handler
  const syncLocalFolder = useCallback(
    async (onProgress) => {
      if (!("showDirectoryPicker" in window)) {
        throw new Error("Browser does not support File System Access API");
      }

      try {
        const folderHandle = await window.showDirectoryPicker();
        await saveFolderHandle({
          path: folderHandle.name,
          handle: folderHandle,
        });

        const audioFiles = [];
        const scan = async (handle, path = "") => {
          for await (const entry of handle.values()) {
            if (entry.kind === "directory") {
              await scan(entry, `${path}/${entry.name}`);
            } else if (entry.kind === "file") {
              if (
                /\.(mp3|wav|m4a|flac|ogg|aac|wma|opus|webm)$/i.test(entry.name)
              ) {
                audioFiles.push({
                  handle: entry,
                  path: `${path}/${entry.name}`,
                });
              }
            }
          }
        };

        await scan(folderHandle);

        const allNewSongs = [];
        const existingKeys = new Set(
          songs.map(
            (s) =>
              `${s.title}|${s.artist || "Unknown Artist"}|${s.path || s.file?.name || ""}`,
          ),
        );

        const BATCH_SIZE = 8;
        for (let i = 0; i < audioFiles.length; i += BATCH_SIZE) {
          const chunk = audioFiles.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.all(
            chunk.map(async (fileObj, idx) => {
              try {
                const { handle, path } = fileObj;
                const file = await handle.getFile();

                const metadata = await getSongMetadata(file);
                const title =
                  metadata.title || file.name.replace(/\.[^/.]+$/, "");
                const artist = metadata.artist || "Unknown Artist";

                const songKey = `${title}|${artist}|${path}`;
                if (existingKeys.has(songKey)) return null;
                existingKeys.add(songKey);

                const durationSeconds = await getAudioDuration(file);
                const formattedDuration = formatDuration(durationSeconds);

                return {
                  id: `${Date.now()}-${i + idx}-${Math.random().toString(36).substring(2, 7)}`,
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
              } catch (err) {
                console.error("Error scanning file", fileObj.path, err);
                return null;
              }
            }),
          );

          const validSongs = batchResults.filter(Boolean);
          if (validSongs.length > 0) {
            try {
              await saveSongsBatch(validSongs);
            } catch (e) {
              console.warn("DB batch save warning:", e);
            }
            allNewSongs.push(...validSongs);
            setSongs((prev) => [...prev, ...validSongs]);
          }

          if (onProgress) {
            onProgress(
              Math.min(i + BATCH_SIZE, audioFiles.length),
              audioFiles.length,
            );
          }
        }

        return {
          added: allNewSongs.length,
          total: audioFiles.length,
          folderName: folderHandle.name,
        };
      } catch (error) {
        if (error.name !== "AbortError") throw error;
        return null; // Cancelled
      }
    },
    [songs],
  );

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
