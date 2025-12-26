import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Save, Edit2, X } from 'lucide-react';
import { parseLRC } from '../utils/lrcParser';

const LyricsView = ({ song, onClose, onSaveLyrics, currentTime = 0 }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [rawLyrics, setRawLyrics] = useState('');
    const activeLineRef = useRef(null);

    useEffect(() => {
        if (song) {
            setRawLyrics(song.lyrics || '');
        }
    }, [song]);

    const parsedLyrics = useMemo(() => {
        const parsed = parseLRC(rawLyrics);
        return parsed.length > 0 ? parsed : null;
    }, [rawLyrics]);

    const activeIndex = useMemo(() => {
        if (!parsedLyrics) return -1;
        // Find the index of the line that is current
        // It's the last line where line.time <= currentTime
        let active = -1;
        for (let i = 0; i < parsedLyrics.length; i++) {
            if (parsedLyrics[i].time <= currentTime) {
                active = i;
            } else {
                break;
            }
        }
        return active;
    }, [parsedLyrics, currentTime]);

    // Auto-scroll to active line
    useEffect(() => {
        if (activeLineRef.current) {
            activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeIndex]);

    const handleSave = () => {
        onSaveLyrics(song.id, rawLyrics);
        setIsEditing(false);
    };

    if (!song) return null;

    return (
        <div className="h-full w-full flex flex-col bg-bg-card text-white relative">
            {/* Header / Close Button - Sticky & Solid */}
            <div className="flex justify-between items-center p-4 bg-bg-card z-10 sticky top-0 border-b border-white/5">
                <span className="font-bold text-sm text-text-secondary uppercase tracking-wider">Now Playing</span>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition text-white"
                    >
                        <X size={24} />
                    </button>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                {/* Cover Art */}
                <div className="w-full aspect-square mb-6 shadow-2xl rounded-lg overflow-hidden relative group">
                    {song.cover ? (
                        <img
                            src={song.cover}
                            alt={song.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-bg-highlight flex items-center justify-center">
                            <span className="text-4xl">🎵</span>
                        </div>
                    )}
                </div>

                {/* Song Info */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer leading-tight mb-1">{song.title}</h2>
                    <p className="text-gray-400 font-medium hover:underline cursor-pointer">{song.artist}</p>
                </div>

                {/* Lyrics Card */}
                <div className="bg-[#1f1f1f] rounded-xl p-4 md:p-6 shadow-inner relative overflow-hidden group min-h-[200px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Lyrics</h3>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 hover:bg-bg-highlight rounded-full transition text-gray-400 hover:text-white"
                                title="Edit Lyrics"
                            >
                                <Edit2 size={16} />
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="flex flex-col gap-4">
                            <textarea
                                className="w-full bg-[#2a2a2a] text-white p-4 rounded-lg text-base leading-relaxed focus:outline-none focus:ring-1 focus:ring-white resize-none placeholder-gray-500 min-h-[300px] font-mono"
                                value={rawLyrics}
                                onChange={(e) => setRawLyrics(e.target.value)}
                                placeholder="Paste lyrics here... Use [mm:ss.xx] format for sync."
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 rounded-full text-sm font-bold text-white hover:scale-105 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="bg-white text-black px-6 py-2 rounded-full text-sm font-bold hover:scale-105 transition"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-300 text-lg font-medium leading-loose">
                            {rawLyrics ? (
                                parsedLyrics ? (
                                    <div className="flex flex-col gap-4 py-4">
                                        {parsedLyrics.map((line, index) => {
                                            const isActive = index === activeIndex;
                                            return (
                                                <p
                                                    key={index}
                                                    ref={isActive ? activeLineRef : null}
                                                    className={`transition-all duration-300 ${isActive
                                                        ? 'text-white text-2xl font-bold opacity-100 scale-105 origin-left'
                                                        : 'text-gray-500 text-lg opacity-60'
                                                        }`}
                                                >
                                                    {line.text}
                                                </p>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-line">{rawLyrics}</div>
                                )
                            ) : (
                                <p className="opacity-50 italic">No lyrics available.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LyricsView;
