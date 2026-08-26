const DB_NAME = "MusicPlayerDB";
const DB_VERSION = 3;
const STORE_NAME = "songs";
const PLAYLIST_STORE_NAME = "playlists";
const FOLDER_STORE_NAME = "folders";

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject(event.target.error);

    request.onsuccess = (event) => resolve(event.target.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PLAYLIST_STORE_NAME)) {
        db.createObjectStore(PLAYLIST_STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(FOLDER_STORE_NAME)) {
        db.createObjectStore(FOLDER_STORE_NAME, { keyPath: "path" });
      }
    };
  });
};

export const saveSong = async (song) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(song);

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
};

export const saveSongsBatch = async (songs) => {
  if (!songs || songs.length === 0) return;
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => {
        console.warn("saveSongsBatch transaction issue:", event.target.error);
        resolve();
      };

      for (const song of songs) {
        try {
          const cleanSong = {
            id: song.id,
            title: song.title || "Unknown Title",
            artist: song.artist || "Unknown Artist",
            album: song.album || "Unknown Album",
            duration: song.duration || "0:00",
            cover: song.cover || null,
            type: song.type || "file",
            path: song.path || "",
            size: song.size || 0,
            createdAt: song.createdAt || Date.now(),
            playCount: song.playCount || 0,
            isLiked: !!song.isLiked,
          };
          if (song.file) cleanSong.file = song.file;
          if (song.fileHandle) cleanSong.fileHandle = song.fileHandle;

          store.put(cleanSong);
        } catch (err) {
          console.warn("Song put fallback for:", song.title, err);
          try {
            store.put({
              id: song.id,
              title: song.title || "Unknown Title",
              artist: song.artist || "Unknown Artist",
              album: song.album || "Unknown Album",
              duration: song.duration || "0:00",
              cover: song.cover || null,
              type: song.type || "file",
              path: song.path || "",
              createdAt: song.createdAt || Date.now(),
            });
          } catch (e) {}
        }
      }
    });
  } catch (err) {
    console.error("Failed to initialize DB in saveSongsBatch:", err);
  }
};

export const getAllSongs = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const deleteSong = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
};

export const clearAllSongs = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORE_NAME, FOLDER_STORE_NAME],
      "readwrite",
    );
    const songStore = transaction.objectStore(STORE_NAME);
    const folderStore = transaction.objectStore(FOLDER_STORE_NAME);

    songStore.clear();
    folderStore.clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject(event.target.error);
  });
};

// Playlists
export const savePlaylist = async (playlist) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PLAYLIST_STORE_NAME], "readwrite");
    const store = transaction.objectStore(PLAYLIST_STORE_NAME);
    const request = store.put(playlist);

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
};

export const getAllPlaylists = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PLAYLIST_STORE_NAME], "readonly");
    const store = transaction.objectStore(PLAYLIST_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const deletePlaylist = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PLAYLIST_STORE_NAME], "readwrite");
    const store = transaction.objectStore(PLAYLIST_STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
};

// Backup & Restore
export const exportData = async () => {
  try {
    const songs = await getAllSongs();
    const playlists = await getAllPlaylists();
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      songs,
      playlists,
    };
  } catch (error) {
    console.error("Export failed:", error);
    throw error;
  }
};

export const importData = async (jsonData) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORE_NAME, PLAYLIST_STORE_NAME],
      "readwrite",
    );
    const songStore = transaction.objectStore(STORE_NAME);
    const playlistStore = transaction.objectStore(PLAYLIST_STORE_NAME);

    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject(event.target.error);

    // Clear existing data
    songStore.clear();
    playlistStore.clear();

    // Restore Songs
    if (jsonData.songs && Array.isArray(jsonData.songs)) {
      jsonData.songs.forEach((song) => songStore.put(song));
    }

    // Restore Playlists
    if (jsonData.playlists && Array.isArray(jsonData.playlists)) {
      jsonData.playlists.forEach((playlist) => playlistStore.put(playlist));
    }
  });
};
// Synced Folders
export const saveFolderHandle = async (folderData) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FOLDER_STORE_NAME], "readwrite");
    const store = transaction.objectStore(FOLDER_STORE_NAME);
    const request = store.put(folderData);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
};

export const getAllFolders = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FOLDER_STORE_NAME], "readonly");
    const store = transaction.objectStore(FOLDER_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

export const deleteFolderHandle = async (path) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FOLDER_STORE_NAME], "readwrite");
    const store = transaction.objectStore(FOLDER_STORE_NAME);
    const request = store.delete(path);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
};
