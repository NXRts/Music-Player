import React, { useState } from 'react';
import { Music, MoreHorizontal, ListPlus, Play, Pause, Trash2, Plus, Pencil, ArrowDownAZ, Clock3 } from 'lucide-react';

const SongList = ({ songs, currentSong, onSelect, isPlaying, onDelete, onAddToPlaylist, onSort, onAddToQueue, onPlayNext, onEdit }) => {
    const [activeMenu, setActiveMenu] = useState(null);
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => {
            setActiveMenu(null);
            setShowSortMenu(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col pb-24">
            {/* Header & Sort */}
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-2 sticky top-0 bg-bg-primary z-30 border-b border-bg-highlight mb-2 text-text-secondary text-sm font-bold uppercase tracking-wider">
                <div className="w-8 text-center">#</div>
                <div>Title</div>
                <div>Artist</div>
                <div className="text-right pr-4">DURATION</div>
                <div className="relative flex justify-end">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); }}
                        className="flex items-center gap-2 hover:text-white hover:bg-white/10 px-2 py-1 rounded transition"
                    >
                        Sort <ArrowDownAZ size={16} />
                    </button>

                    {showSortMenu && (
                        <div className="absolute right-0 top-full mt-2 bg-[#282828] border border-white/10 rounded-lg shadow-xl py-1 w-48 z-50 normal-case">
                            <button onClick={(e) => { e.stopPropagation(); onSort && onSort('date'); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-white/10 text-white text-sm">Date Added</button>
                            <button onClick={(e) => { e.stopPropagation(); onSort && onSort('title'); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-white/10 text-white text-sm">Title (A-Z)</button>
                        </div>
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
                                <span className={`block ${isCurrent && isPlaying ? 'hidden' : 'group-hover:hidden'}`}>{isCurrent && isPlaying ? '' : index + 1}</span>
                                <span className={`hidden ${isCurrent && isPlaying ? 'block' : 'group-hover:block'} text-white`}>
                                    {isCurrent && isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                                </span>
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
                                    <img src={song.cover} alt="" className="w-10 h-10 rounded shadow-sm object-cover" />
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

                            {/* Options Menu Button column */}
                            <div className="relative flex justify-center items-center gap-1">
                                <button
                                    className="p-2 rounded-full hover:text-white hover:bg-bg-highlight text-text-secondary z-20 transition"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddToPlaylist && onAddToPlaylist(song.id);
                                    }}
                                    title="Add to Playlist"
                                >
                                    <Plus size={20} />
                                </button>
                                <button
                                    className={`p-2 rounded-full hover:text-white hover:bg-bg-highlight z-20 transition ${activeMenu === song.id ? 'text-white' : 'text-text-secondary'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenu(activeMenu === song.id ? null : song.id);
                                    }}
                                >
                                    <MoreHorizontal size={20} />
                                </button>

                                {/* Dropdown Menu */}
                                {activeMenu === song.id && (
                                    <div className="absolute right-0 top-10 w-48 bg-[#282828] rounded-lg shadow-xl z-50 py-1 border border-white/10 animate-fade-in">
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2"
                                            onClick={(e) => { e.stopPropagation(); onPlayNext(song.id); setActiveMenu(null); }}
                                        >
                                            <Play size={14} /> Play Next
                                        </button>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2"
                                            onClick={(e) => { e.stopPropagation(); onAddToQueue(song.id); setActiveMenu(null); }}
                                        >
                                            <ListPlus size={14} /> Add to Queue
                                        </button>

                                        {onEdit && (
                                            <button
                                                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2"
                                                onClick={(e) => { e.stopPropagation(); onEdit(song); setActiveMenu(null); }}
                                            >
                                                <Pencil size={14} /> Edit Info
                                            </button>
                                        )}

                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2"
                                            onClick={(e) => { e.stopPropagation(); onAddToPlaylist(song.id); setActiveMenu(null); }}
                                        >
                                            <Plus size={14} /> Add to Playlist
                                        </button>
                                        <div className="border-t border-white/10 my-1"></div>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-white/10 flex items-center gap-2"
                                            onClick={(e) => { e.stopPropagation(); onDelete(song.id); setActiveMenu(null); }}
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SongList;
