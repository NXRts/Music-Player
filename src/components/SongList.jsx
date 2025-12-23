
import React, { useState } from 'react';
import { Music, MoreHorizontal, ListPlus } from 'lucide-react';

const SongList = ({ songs, currentSong, onSelect, isPlaying, onDelete, onClearAll, onAddToPlaylist, onSort }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="flex flex-col">
            {/* Header Row */}
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-4 py-2 border-b border-bg-highlight text-text-secondary text-sm uppercase tracking-wider bg-bg-primary">
                <div className="w-8 text-center">#</div>
                <div>Title</div>
                <div>Artist</div>
                <div className="text-right pr-4">Duration</div>
                <div className="w-8 flex items-center justify-center relative">
                    <button
                        className="text-text-secondary hover:text-white p-1 rounded-full hover:bg-bg-highlight transition"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(prev => !prev);
                        }}
                        title="Options"
                    >
                        <MoreHorizontal size={20} />
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                            <div className="absolute right-0 top-full mt-2 bg-bg-card border border-bg-highlight rounded shadow-2xl z-50 w-48 py-1">
                                <button
                                    className="w-full text-left px-4 py-2 hover:bg-bg-highlight text-white text-sm"
                                    onClick={() => { onSort && onSort('title'); setShowMenu(false); }}
                                >
                                    Sort by Title (A-Z)
                                </button>
                                <button
                                    className="w-full text-left px-4 py-2 hover:bg-bg-highlight text-white text-sm"
                                    onClick={() => { onSort && onSort('date'); setShowMenu(false); }}
                                >
                                    Sort by Date Added
                                </button>
                                <div className="border-t border-bg-highlight my-1"></div>
                                <button
                                    className="w-full text-left px-4 py-2 hover:bg-red-500 hover:text-white text-text-secondary text-sm transition"
                                    onClick={() => { onClearAll && onClearAll(); setShowMenu(false); }}
                                >
                                    Clear All Songs
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-col mt-2">
                {songs.map((song, index) => {
                    const isCurrent = currentSong?.id === song.id;

                    return (
                        <div
                            key={song.id}
                            onClick={() => onSelect(song)}
                            className={`grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-3 rounded-md cursor-pointer transition-colors group ${isCurrent ? 'bg-bg-highlight text-accent' : 'hover:bg-bg-highlight hover:bg-opacity-50 text-text-secondary hover:text-white'}`}
                        >
                            <div className="w-8 flex items-center justify-center relative">
                                <span className={`block ${isCurrent && isPlaying ? 'hidden' : 'group-hover:hidden'} `}>{isCurrent && isPlaying ? '' : index + 1}</span>
                                <span className={`hidden ${isCurrent && isPlaying ? 'block' : 'group-hover:block'} text-white`}>▶</span>
                                {isCurrent && isPlaying && (
                                    <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" className="absolute w-4 h-4" alt="playing" />
                                )}
                            </div>

                            <div className="flex items-center gap-3 overflow-hidden">
                                {song.cover && song.cover.includes('placehold.co') ? (
                                    <div className="w-10 h-10 min-w-10 min-h-10 rounded shadow-sm bg-bg-highlight flex items-center justify-center text-text-secondary">
                                        <Music size={20} />
                                    </div>
                                ) : (
                                    <img src={song.cover} alt="" className="w-10 h-10 rounded shadow-sm" />
                                )}
                                <div className="flex flex-col truncate">
                                    <span className={`font-medium truncate ${isCurrent ? 'text-accent' : 'text-white'}`}>{song.title}</span>
                                </div>
                            </div>

                            <div className="flex items-center truncate text-sm">
                                {song.artist}
                            </div>

                            <div className="flex items-center justify-end pr-4 text-sm font-variant-numeric tab-num">
                                {song.duration}
                            </div>

                            <div
                                className="flex items-center justify-center gap-1 relative z-50 cursor-default"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                }}
                            >
                                <button
                                    className="text-text-secondary hover:text-white p-1 rounded-full hover:bg-bg-highlight transition"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddToPlaylist && onAddToPlaylist(song.id);
                                    }}
                                    title="Add to Playlist"
                                >
                                    <ListPlus size={20} />
                                </button>
                                <button
                                    className="text-text-secondary hover:text-white p-1 rounded-full hover:bg-bg-highlight transition"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onDelete) {
                                            onDelete(song.id);
                                        }
                                    }}
                                    title="Delete Song"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SongList;
