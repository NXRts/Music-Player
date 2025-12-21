const DB_NAME = 'MusicPlayerDB';
const DB_VERSION = 2;
const STORE_NAME = 'songs';
const PLAYLIST_STORE_NAME = 'playlists';

export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => reject(event.target.error);

        request.onsuccess = (event) => resolve(event.target.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(PLAYLIST_STORE_NAME)) {
                db.createObjectStore(PLAYLIST_STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

export const saveSong = async (song) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(song);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
};

export const getAllSongs = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

export const deleteSong = async (id) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
};

export const clearAllSongs = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
};

// Playlists
export const savePlaylist = async (playlist) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PLAYLIST_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(PLAYLIST_STORE_NAME);
        const request = store.put(playlist);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
};

export const getAllPlaylists = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PLAYLIST_STORE_NAME], 'readonly');
        const store = transaction.objectStore(PLAYLIST_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

export const deletePlaylist = async (id) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PLAYLIST_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(PLAYLIST_STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
};
