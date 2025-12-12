import React, { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';

const Search = ({ songs = [], onPlay }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Local filtering
    const categories = ['Pop', 'Hip-Hop', 'Rock', 'Electronic', 'Indie', 'Jazz', 'Classical', 'K-Pop'];

    const filteredCategories = categories.filter(cat =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSongs = songs.filter(song =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 md:p-8 text-white h-full flex flex-col">
            <h2 className="text-3xl font-bold mb-6">Search</h2>

            <div className="relative max-w-md mb-8">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black">
                    <SearchIcon size={20} />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="What do you want to listen to?"
                    className="w-full pl-10 pr-4 py-3 rounded-full text-black font-medium focus:outline-none focus:ring-2 focus:ring-white transition"
                    autoFocus
                />
            </div>

            {searchTerm && filteredSongs.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Top Results</h3>
                    <div className="flex flex-col gap-2">
                        {filteredSongs.map(song => (
                            <div key={song.id} onClick={() => onPlay(song)} className="flex items-center gap-4 p-3 bg-bg-highlight bg-opacity-40 hover:bg-opacity-100 rounded-md cursor-pointer transition group">
                                <img src={song.cover} alt={song.title} className="w-12 h-12 rounded shadow" />
                                <div className="flex flex-col">
                                    <span className="font-bold">{song.title}</span>
                                    <span className="text-sm text-text-secondary">{song.artist}</span>
                                </div>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition">
                                    <span className="bg-accent text-black rounded-full w-8 h-8 flex items-center justify-center">▶</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {searchTerm && filteredSongs.length === 0 && filteredCategories.length === 0 && (
                <div className="text-text-secondary">No results found for "{searchTerm}"</div>
            )}

            {(!searchTerm || filteredCategories.length > 0) && (
                <>
                    <h3 className="text-xl font-bold mb-4">Browse All</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredCategories.map((genre, idx) => (
                            <div key={idx} className={`h-32 rounded-lg p-4 font-bold text-xl relative overflow-hidden cursor-pointer transition hover:scale-[1.02]`} style={{ backgroundColor: `hsl(${idx * 45}, 70%, 50%)` }}>
                                {genre}
                                <div className="absolute -bottom-2 -right-2 transform rotate-[25deg] shadow-lg">
                                    <div className="w-16 h-16 bg-black opacity-20"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Search;
