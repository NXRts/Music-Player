import React, { useState, useEffect } from 'react';
import { Save, Edit2, X } from 'lucide-react';

const LyricsView = ({ song, onClose, onSaveLyrics }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [lyrics, setLyrics] = useState('');

    useEffect(() => {
        if (song) {
            setLyrics(song.lyrics || '');
        }
    }, [song]);

    const handleSave = () => {
        onSaveLyrics(song.id, lyrics);
        setIsEditing(false);
    };

    if (!song) return null;

    return (
        <div className="h-full w-full flex flex-col bg-bg-card text-white animate-fade-in">
            {/* Header */}
            <div className="p-6 flex justify-between items-center bg-bg-secondary select-none">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold text-white">{song.title}</h2>
                    <p className="text-text-secondary">{song.artist}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-bg-highlight rounded-full transition text-gray-400 hover:text-white"
                >
                    <X size={32} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
                {isEditing ? (
                    <div className="w-full max-w-2xl h-full flex flex-col gap-4">
                        <textarea
                            className="flex-1 w-full bg-bg-highlight text-white p-6 rounded-lg text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent resize-none placeholder-gray-500"
                            value={lyrics}
                            onChange={(e) => setLyrics(e.target.value)}
                            placeholder="Paste lyrics here..."
                        />
                        <button
                            onClick={handleSave}
                            className="bg-accent text-black font-bold py-3 px-8 rounded-full self-center hover:scale-105 transition flex items-center gap-2"
                        >
                            <Save size={20} />
                            Save Lyrics
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-3xl text-center">
                        {lyrics ? (
                            <p className="text-2xl md:text-3xl font-bold leading-loose text-white whitespace-pre-line text-opacity-90">
                                {lyrics}
                            </p>
                        ) : (
                            <div className="flex flex-col items-center justify-center opacity-50 mt-20">
                                <p className="text-xl mb-4">No lyrics available</p>
                                <p className="text-sm">Click the edit button to add them</p>
                            </div>
                        )}

                        <button
                            onClick={() => setIsEditing(true)}
                            className="mt-12 bg-bg-highlight text-white py-2 px-6 rounded-full hover:bg-opacity-80 transition flex items-center gap-2 mx-auto"
                        >
                            <Edit2 size={16} />
                            Edit Lyrics
                        </button>
                    </div>
                )}
            </div>

            {/* Footer / Style element for gradient fade maybe? */}
            {!isEditing && (
                <div className="h-24 bg-gradient-to-t from-bg-primary to-transparent -mt-24 pointer-events-none"></div>
            )}
        </div>
    );
};

export default LyricsView;
