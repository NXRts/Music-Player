import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js';

export const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

export const getAudioDuration = (file) => {
    return new Promise((resolve) => {
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(file);
        audio.src = objectUrl;

        audio.onloadedmetadata = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(audio.duration);
        };

        audio.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(0);
        };
    });
};

export const getSongMetadata = (file) => {
    return new Promise((resolve) => {
        jsmediatags.read(file, {
            onSuccess: (tag) => {
                const { title, artist, picture } = tag.tags;
                let coverUrl = null;

                if (picture) {
                    const { data, format } = picture;
                    let base64String = "";
                    for (let i = 0; i < data.length; i++) {
                        base64String += String.fromCharCode(data[i]);
                    }
                    coverUrl = `data:${format};base64,${window.btoa(base64String)}`;
                }

                resolve({
                    title: title || file.name.replace(/\.[^/.]+$/, ""),
                    artist: artist || "Unknown Artist",
                    cover: coverUrl
                });
            },
            onError: (error) => {
                console.warn('Error reading tags:', error.type, error.info);
                resolve({
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    artist: "Unknown Artist",
                    cover: null
                });
            }
        });
    });
};
