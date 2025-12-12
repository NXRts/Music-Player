import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

const Search = () => {
    return (
        <div className="p-6 md:p-8 text-white h-full flex flex-col">
            <h2 className="text-3xl font-bold mb-6">Search</h2>

            <div className="relative max-w-md mb-8">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black">
                    <SearchIcon size={20} />
                </div>
                <input
                    type="text"
                    placeholder="What do you want to listen to?"
                    className="w-full pl-10 pr-4 py-3 rounded-full text-black font-medium focus:outline-none focus:ring-2 focus:ring-white"
                />
            </div>

            <h3 className="text-xl font-bold mb-4">Browse All</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {['Pop', 'Hip-Hop', 'Rock', 'Electronic', 'Indie', 'Jazz', 'Classical', 'K-Pop'].map((genre, idx) => (
                    <div key={idx} className={`h-32 rounded-lg p-4 font-bold text-xl relative overflow-hidden cursor-pointer transition hover:scale-[1.02]`} style={{ backgroundColor: `hsl(${idx * 45}, 70%, 50%)` }}>
                        {genre}
                        <div className="absolute -bottom-2 -right-2 transform rotate-[25deg] shadow-lg">
                            <div className="w-16 h-16 bg-black opacity-20"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Search;
