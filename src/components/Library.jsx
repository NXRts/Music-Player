import React, { useState, useMemo } from 'react';
import { Library, Plus, Music, Trash2, ArrowLeft, Disc, Mic2, ListMusic } from 'lucide-react';
import SongList from './SongList';

const YourLibrary = ({ playlists, songs, onSelect, onCreatePlaylist, onSelectPlaylist, onDeletePlaylist, currentSong, isPlaying }) => {
    const [activeTab, setActiveTab] = useState('playlists'); // playlists, songs, artists, albums
    const [selectedGroup, setSelectedGroup] = useState(null); // { type: 'artist'|'album', name: string }

    // Grouping Logic
    const artists = useMemo(() => {
        const groups = {};
        songs.forEach(song => {
            const artist = song.artist || 'Unknown Artist';
            if (!groups[artist]) groups[artist] = { name: artist, count: 0, cover: song.cover };
            groups[artist].count++;
        });
        return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    }, [songs]);

    const albums = useMemo(() => {
        const groups = {};
        songs.forEach(song => {
            const album = song.album || 'Unknown Album';
            const artist = song.artist || 'Unknown Artist';
            if (!groups[album]) groups[album] = { name: album, artist: artist, count: 0, cover: song.cover };
            groups[album].count++;
        });
        return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    }, [songs]);

    // Handle Back Navigation
    if (selectedGroup) {
        const filteredSongs = songs.filter(song => {
            if (selectedGroup.type === 'artist') return (song.artist || 'Unknown Artist') === selectedGroup.name;
            if (selectedGroup.type === 'album') return (song.album || 'Unknown Album') === selectedGroup.name;
            return false;
        });

        return (
            <div className="p-6 md:p-8 text-white h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => setSelectedGroup(null)}
                        className="p-2 hover:bg-white/10 rounded-full transition"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold">{selectedGroup.name}</h2>
                        <p className="text-text-secondary capitalize">{selectedGroup.type} • {filteredSongs.length} Songs</p>
                    </div>
                </div>
                <SongList
                    songs={filteredSongs}
                    currentSong={currentSong}
                    onSelect={onSelect}
                    isPlaying={isPlaying}
                />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 text-white h-full flex flex-col">
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

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                <button
                    onClick={() => setActiveTab('playlists')}
                    className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${activeTab === 'playlists' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}
                >
                    Playlists
                </button>
                <button
                    onClick={() => setActiveTab('songs')}
                    className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${activeTab === 'songs' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}
                >
                    Songs
                </button>
                <button
                    onClick={() => setActiveTab('artists')}
                    className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${activeTab === 'artists' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}
                >
                    Artists
                </button>
                <button
                    onClick={() => setActiveTab('albums')}
                    className={`px-4 py-2 rounded-full font-medium transition whitespace-nowrap ${activeTab === 'albums' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}
                >
                    Albums
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'playlists' && (
                    playlists.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center text-text-secondary">
                            <div className="mb-4 bg-bg-highlight p-6 rounded-full">
                                <Library size={48} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Create your first playlist</h3>
                            <button onClick={onCreatePlaylist} className="mt-4 bg-white text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition">Create Playlist</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {playlists.map(playlist => (
                                <div key={playlist.id} onClick={() => onSelectPlaylist(playlist)} className="bg-bg-highlight bg-opacity-40 hover:bg-opacity-100 p-4 rounded-md cursor-pointer group transition flex flex-col gap-4 relative">
                                    <div className="aspect-square bg-bg-card shadow-lg rounded-md flex items-center justify-center text-text-secondary">
                                        <Music size={48} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold truncate">{playlist.name}</h3>
                                        <p className="text-sm text-text-secondary">Playlist • {playlist.songIds.length} songs</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete playlist "${playlist.name}"?`)) onDeletePlaylist(playlist.id); }} className="absolute top-4 right-4 bg-black bg-opacity-50 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {activeTab === 'songs' && (
                    <SongList songs={songs} currentSong={currentSong} onSelect={onSelect} isPlaying={isPlaying} />
                )}

                {activeTab === 'artists' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {artists.map(artist => (
                            <div
                                key={artist.name}
                                onClick={() => setSelectedGroup({ type: 'artist', name: artist.name })}
                                className="bg-bg-highlight bg-opacity-40 hover:bg-opacity-100 p-4 rounded-md cursor-pointer group transition flex flex-col items-center text-center gap-4"
                            >
                                <div className="w-32 h-32 rounded-full bg-bg-card shadow-lg flex items-center justify-center overflow-hidden">
                                    {artist.cover ? <img src={artist.cover} className="w-full h-full object-cover" alt={artist.name} /> : <Mic2 size={40} className="text-text-secondary" />}
                                </div>
                                <div>
                                    <h3 className="font-bold truncate">{artist.name}</h3>
                                    <p className="text-sm text-text-secondary">Artist • {artist.count} songs</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'albums' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {albums.map(album => (
                            <div
                                key={album.name}
                                onClick={() => setSelectedGroup({ type: 'album', name: album.name })}
                                className="bg-bg-highlight bg-opacity-40 hover:bg-opacity-100 p-4 rounded-md cursor-pointer group transition flex flex-col gap-4"
                            >
                                <div className="aspect-square bg-bg-card shadow-lg rounded-md flex items-center justify-center overflow-hidden">
                                    {album.cover ? <img src={album.cover} className="w-full h-full object-cover" alt={album.name} /> : <Disc size={48} className="text-text-secondary" />}
                                </div>
                                <div>
                                    <h3 className="font-bold truncate">{album.name}</h3>
                                    <p className="text-sm text-text-secondary">{album.artist} • Album</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default YourLibrary;
