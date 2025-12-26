/**
 * Parses an LRC string into an array of objects with time (seconds) and text.
 * Format: [mm:ss.xx] Lyrics text
 * @param {string} lrcString
 * @returns {Array<{time: number, text: string}>}
 */
export const parseLRC = (lrcString) => {
    if (!lrcString) return [];

    const lines = lrcString.split('\n');
    const lyrics = [];

    const timeRegex = /\[(\d{2}):(\d{2})(\.(\d{2,3}))?\]/;

    for (const line of lines) {
        const match = timeRegex.exec(line);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const milliseconds = match[4] ? parseInt(match[4], 10) : 0;

            // Convert to total seconds
            const time = minutes * 60 + seconds + (milliseconds / (match[4]?.length === 3 ? 1000 : 100));
            const text = line.replace(timeRegex, '').trim();

            if (text) {
                lyrics.push({ time, text });
            }
        }
    }

    return lyrics.sort((a, b) => a.time - b.time);
};
