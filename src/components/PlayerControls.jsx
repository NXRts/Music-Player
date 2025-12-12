import React from 'react';

const PlayerControls = ({ currentSong, isPlaying, onPlayPause, currentTime, duration, onSeek, onSkipNext, onSkipPrev, isShuffle, onToggleShuffle }) => {

    // Format seconds to mm:ss
    const formatTime = (time) => {
        if (!time || isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };
    if (!currentSong) return (
        <div className="w-full flex items-center justify-between text-text-secondary">
            <div>Select a song to play</div>
        </div>
    );

    return (
        <div className="w-full flex items-center justify-between">
            {/* Left: Song Info */}
            <div className="flex items-center gap-4 w-full md:w-1/3">
                <img src={currentSong.cover} alt="Cover" className="w-14 h-14 rounded shadow-md" />
                <div className="flex flex-col justify-center">
                    <div className="text-sm text-white hover:underline cursor-pointer font-medium truncate max-w-[120px] md:max-w-none">{currentSong.title}</div>
                    <div className="text-xs text-text-secondary hover:underline cursor-pointer truncate max-w-[120px] md:max-w-none">{currentSong.artist}</div>
                </div>
                <button className="text-text-secondary hover:text-white ml-2 hidden md:block">♡</button>
            </div>

            {/* Center: Controls */}
            <div className="flex flex-col items-center gap-1 w-auto md:w-1/3 absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none bottom-20 md:bottom-auto">
                <div className="flex items-center gap-6">
                    <button
                        className={`text-lg hover:text-white transition ${isShuffle ? 'text-accent' : 'text-text-secondary'}`}
                        onClick={onToggleShuffle}
                        title={isShuffle ? "Disable Shuffle" : "Enable Shuffle"}
                    >
                        🔀
                    </button>
                    <button
                        className="text-text-secondary hover:text-white text-lg"
                        onClick={onSkipPrev}
                        title="Previous Song"
                    >
                        ⏮
                    </button>

                    <button
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition shadow-lg"
                        onClick={onPlayPause}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? '⏸' : '▶'}
                    </button>

                    <button
                        className="text-text-secondary hover:text-white text-lg"
                        onClick={onSkipNext}
                        title="Next Song"
                    >
                        ⏭
                    </button>
                    <button
                        className="text-text-secondary hover:text-white text-lg"
                        title="Repeat (Not Implemented)"
                    >
                        🔁
                    </button>
                </div>

                <div className="w-full flex items-center gap-2 text-xs text-text-secondary">
                    <span>{formatTime(currentTime)}</span>
                    <div className="flex-1 group">
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={currentTime || 0}
                            onChange={(e) => onSeek(Number(e.target.value))}
                            className="w-full h-1 bg-bg-highlight rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:invisible group-hover:[&::-webkit-slider-thumb]:visible transition-all"
                        />
                    </div>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Right: Volume & Extra */}
            <div className="w-1/3 hidden md:flex items-center justify-end gap-3 text-text-secondary">
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
