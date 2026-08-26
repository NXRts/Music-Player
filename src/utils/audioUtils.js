import jsmediatags from "jsmediatags/dist/jsmediatags.min.js";

export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
};

export const getAudioDuration = (file) => {
  return new Promise((resolve) => {
    let resolved = false;
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;

    const cleanup = (duration) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try {
        URL.revokeObjectURL(objectUrl);
      } catch (e) {}
      resolve(duration || 0);
    };

    const timer = setTimeout(() => cleanup(0), 3000);
    audio.onloadedmetadata = () => cleanup(audio.duration);
    audio.onerror = () => cleanup(0);
  });
};

export const getSongMetadata = (file) => {
  return new Promise((resolve) => {
    let resolved = false;
    const fallbackTitle = file.name.replace(/\.[^/.]+$/, "");

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({
          title: fallbackTitle,
          artist: "Unknown Artist",
          album: "Unknown Album",
          cover: null,
        });
      }
    }, 4000);

    jsmediatags.read(file, {
      onSuccess: (tag) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        const { title, artist, picture, album } = tag.tags || {};
        let coverUrl = null;

        if (picture) {
          try {
            const { data, format } = picture;
            let binary = "";
            const bytes = new Uint8Array(data);
            const len = bytes.byteLength;
            const chunkSize = 8192;
            for (let i = 0; i < len; i += chunkSize) {
              binary += String.fromCharCode.apply(
                null,
                bytes.subarray(i, i + chunkSize),
              );
            }
            coverUrl = `data:${format};base64,${window.btoa(binary)}`;
          } catch (e) {
            console.warn("Cover image base64 conversion failed:", e);
            coverUrl = null;
          }
        }

        resolve({
          title: (title || "").trim() || fallbackTitle,
          artist: (artist || "").trim() || "Unknown Artist",
          album: (album || "").trim() || "Unknown Album",
          cover: coverUrl,
        });
      },
      onError: (error) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        resolve({
          title: fallbackTitle,
          artist: "Unknown Artist",
          album: "Unknown Album",
          cover: null,
        });
      },
    });
  });
};
