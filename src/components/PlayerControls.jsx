import React from 'react';

const PlayerControls = ({ currentSong, isPlaying, onPlayPause }) => {
    if (!currentSong) return (
        <div className="w-full flex items-center justify-between text-text-secondary">
            <div>Select a song to play</div>
        </div>
    );

    return (
        <div className="w-full flex items-center justify-between">
            {/* Left: Song Info */}
            <div className="w-1/3 flex items-center gap-4">
                <img src={currentSong.cover} alt="Cover" className="w-14 h-14 rounded shadow-md" />
                <div className="flex flex-col justify-center">
                    <div className="text-sm text-white hover:underline cursor-pointer font-medium">{currentSong.title}</div>
                    <div className="text-xs text-text-secondary hover:underline cursor-pointer">{currentSong.artist}</div>
                </div>
                <button className="text-text-secondary hover:text-white ml-2">♡</button>
            </div>

            {/* Center: Controls */}
            <div className="w-1/3 flex flex-col items-center gap-1">
                <div className="flex items-center gap-6">
                    <button className="text-text-secondary hover:text-white text-lg">🔀</button>
                    <button className="text-text-secondary hover:text-white text-lg">⏮</button>

                    <button
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition shadow-lg"
                        onClick={onPlayPause}
                    >
                        {isPlaying ? '⏸' : '▶'}
                    </button>

                    <button className="text-text-secondary hover:text-white text-lg">⏭</button>
                    <button className="text-text-secondary hover:text-white text-lg">🔁</button>
                </div>

                <div className="w-full flex items-center gap-2 text-xs text-text-secondary">
                    <span>0:00</span>
                    <div className="h-1 flex-1 bg-bg-highlight rounded-full overflow-hidden cursor-pointer group">
                        <div className="h-full w-1/3 bg-white group-hover:bg-accent hover:bg-accent-hover relative"></div>
                    </div>
                    <span>{currentSong.duration}</span>
                </div>
            </div>

            {/* Right: Volume & Extra */}
            <div className="w-1/3 flex items-center justify-end gap-3 text-text-secondary">
                <button className="hover:text-white">🎤</button>
                <button className="hover:text-white">🖥</button>
                <div className="w-24 h-1 bg-bg-highlight rounded-full group cursor-pointer">
                    <div className="h-full w-2/3 bg-white group-hover:bg-accent"></div>
                </div>
            </div>
        </div>
    );
};

export default PlayerControls;
