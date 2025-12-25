import { Home, Search, Library, PlusSquare, Heart, Upload, X, Activity } from 'lucide-react';

const Sidebar = ({ currentView, onNavigate, onAddMusic, onCreatePlaylist, isMobileOpen, onClose }) => {
    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={onClose}
                ></div>
            )}

            {/* Sidebar Content */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-black h-full flex flex-col text-sm text-text-secondary select-none transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0
            `}>
                <div className="p-6 flex justify-between items-center">
                    <h1 className="text-2xl text-white font-bold tracking-tight">Music App</h1>
                    <button className="md:hidden text-white hover:text-accent" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="px-6 pb-6">

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
                        <div
                            className="flex items-center gap-3 hover:text-white transition cursor-pointer"
                            onClick={onCreatePlaylist}
                        >
                            <PlusSquare size={24} />
                            <span className="font-bold">Create Playlist</span>
                        </div>
                        <div
                            className="flex items-center gap-3 hover:text-white transition cursor-pointer"
                            onClick={onAddMusic}
                        >
                            <div className="bg-white p-1 rounded-sm opacity-70">
                                <Upload size={16} color="black" />
                            </div>
                            <span className="font-bold">Add Local Music</span>
                        </div>
                        <div
                            className={`flex items-center gap-3 transition cursor-pointer ${currentView === 'liked' ? 'text-white' : 'hover:text-white'}`}
                            onClick={() => onNavigate('liked')}
                        >
                            <Heart size={24} className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white fill-current p-1 rounded-sm" />
                            <span className="font-bold">Liked Songs</span>
                        </div>
                        <div
                            className={`flex items-center gap-3 transition cursor-pointer ${currentView === 'visualizer' ? 'text-white' : 'hover:text-white'}`}
                            onClick={() => onNavigate('visualizer')}
                        >
                            <Activity size={24} />
                            <span className="font-bold">Visualizer</span>
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
        </>
    );
};

export default Sidebar;
