import React from 'react';
import { Library } from 'lucide-react';

const YourLibrary = () => {
    return (
        <div className="p-6 md:p-8 text-white h-full">
            <div className="flex items-center gap-4 mb-6">
                <h2 className="text-3xl font-bold">Your Library</h2>
            </div>

            <div className="flex gap-4 mb-6">
                <span className="px-4 py-2 bg-white bg-opacity-10 rounded-full text-sm font-bold cursor-pointer hover:bg-opacity-20 transition">Playlists</span>
                <span className="px-4 py-2 bg-white bg-opacity-10 rounded-full text-sm font-bold cursor-pointer hover:bg-opacity-20 transition">Artists</span>
                <span className="px-4 py-2 bg-white bg-opacity-10 rounded-full text-sm font-bold cursor-pointer hover:bg-opacity-20 transition">Albums</span>
            </div>

            <div className="flex flex-col items-center justify-center h-64 text-center text-text-secondary">
                <div className="mb-4 bg-bg-highlight p-6 rounded-full">
                    <Library size={48} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Create your first playlist</h3>
                <p className="mb-6">It's easy, we'll help you.</p>
                <button className="bg-white text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition">
                    Create Playlist
                </button>
            </div>
        </div>
    );
};

export default YourLibrary;
