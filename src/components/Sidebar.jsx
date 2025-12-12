import React from 'react';
import { Home, Search, Library, PlusSquare, Heart } from 'lucide-react';

const Sidebar = ({ currentView, onNavigate }) => {
    return (
        <div className="w-64 bg-black h-full flex flex-col text-sm text-text-secondary select-none">
            <div className="p-6">
                <h1 className="text-2xl text-white font-bold tracking-tight mb-6">Music App</h1>

                <nav className="flex flex-col gap-4">
                    <div
                        className={`flex items-center gap-4 transition cursor-pointer ${currentView === 'home' ? 'text-white' : 'hover:text-white'}`}
                        onClick={() => onNavigate('home')}
                    >
                        <Home size={24} />
                        <span className="font-bold">Home</span>
                    </div>
                    <div
                        className={`flex items-center gap-4 transition cursor-pointer ${currentView === 'search' ? 'text-white' : 'hover:text-white'}`}
                        onClick={() => onNavigate('search')}
                    >
                        <Search size={24} />
                        <span className="font-bold">Search</span>
                    </div>
                    <div
                        className={`flex items-center gap-4 transition cursor-pointer ${currentView === 'library' ? 'text-white' : 'hover:text-white'}`}
                        onClick={() => onNavigate('library')}
                    >
                        <Library size={24} />
                        <span className="font-bold">Your Library</span>
                    </div>
                </nav>
            </div>

            <div className="mx-4 border-t border-bg-highlight mb-4"></div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
                <div className="flex flex-col gap-4 mb-4">
                    <div className="flex items-center gap-3 hover:text-white transition cursor-pointer">
                        <PlusSquare size={24} />
                        <span className="font-bold">Create Playlist</span>
                    </div>
                    <div className="flex items-center gap-3 hover:text-white transition cursor-pointer">
                        <Heart size={24} className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white fill-current p-1 rounded-sm" />
                        <span className="font-bold">Liked Songs</span>
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                    {['Chill Vibes', 'Gym Motivation', 'Coding Focus', 'Late Night Jazz', 'Discover Weekly'].map((playlist) => (
                        <div key={playlist} className="hover:text-white transition cursor-pointer truncate">
                            {playlist}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
