import React from 'react';
import { Library, Plus, Music, Trash2 } from 'lucide-react';

const YourLibrary = ({ playlists, onCreatePlaylist, onSelectPlaylist, onDeletePlaylist }) => {
    return (
        <div className="p-6 md:p-8 text-white h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold">Your Library</h2>
                <button
                    onClick={onCreatePlaylist}
                    className="flex items-center gap-2 bg-white text-black font-bold px-4 py-2 rounded-full hover:scale-105 transition"
                >
                    <Plus size={20} />
                    Create Playlist
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                <span className="px-4 py-2 bg-white text-black rounded-full text-sm font-bold cursor-pointer transition">Playlists</span>
            </div>

            {playlists.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-text-secondary">
                    <div className="mb-4 bg-bg-highlight p-6 rounded-full">
                        <Library size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Create your first playlist</h3>
                    <p className="mb-6">It's easy, we'll help you.</p>
                    <button
                        onClick={onCreatePlaylist}
                        className="bg-white text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition"
                    >
                        Create Playlist
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {playlists.map(playlist => (
                        <div
                            key={playlist.id}
                            onClick={() => onSelectPlaylist(playlist)}
                            className="bg-bg-highlight bg-opacity-40 hover:bg-opacity-100 p-4 rounded-md cursor-pointer group transition flex flex-col gap-4 relative"
                        >
                            <div className="aspect-square bg-bg-card shadow-lg rounded-md flex items-center justify-center text-text-secondary">
                                <Music size={48} />
                            </div>
                            <div>
                                <h3 className="font-bold truncate">{playlist.name}</h3>
                                <p className="text-sm text-text-secondary">Playlist • {playlist.songIds.length} songs</p>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Delete playlist "${playlist.name}"?`)) onDeletePlaylist(playlist.id);
                                }}
                                className="absolute top-4 right-4 bg-black bg-opacity-50 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition"
                                title="Delete Playlist"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default YourLibrary;
