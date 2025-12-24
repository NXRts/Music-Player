import React from 'react';
import { Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Mic2, ListMusic, Volume2, Volume1, VolumeX, Music, Heart } from 'lucide-react';

const PlayerControls = ({ currentSong, isPlaying, onPlayPause, currentTime, duration, onSeek, onSkipNext, onSkipPrev, isShuffle, onToggleShuffle, volume, onVolumeChange, isMuted, onToggleMute, repeatMode, onToggleRepeat, onToggleLyrics, isLyricsOpen, onToggleLike, onToggleQueue }) => {

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
                {currentSong.cover && currentSong.cover.includes('placehold.co') ? (
                    <div className="w-14 h-14 rounded shadow-md bg-bg-highlight flex items-center justify-center text-text-secondary">
                        <Music size={24} />
                    </div>
                ) : (
                    <img src={currentSong.cover} alt="Cover" className="w-14 h-14 rounded shadow-md" />
                )}

                <div className="flex flex-col justify-center">
                    <div className="text-sm text-white hover:underline cursor-pointer font-medium truncate max-w-[120px] md:max-w-none">{currentSong.title}</div>
                    <div className="text-xs text-text-secondary hover:underline cursor-pointer truncate max-w-[120px] md:max-w-none">{currentSong.artist}</div>
                </div>
                <button
                    className={`transition ml-2 hidden md:block ${currentSong.isLiked ? 'text-accent fill-accent' : 'text-text-secondary hover:text-white'}`}
                    title={currentSong.isLiked ? "Remove from Liked" : "Like Song"}
                    onClick={() => onToggleLike(currentSong)}
                >
                    <Heart size={20} fill={currentSong.isLiked ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Center: Controls */}
            <div className="flex flex-col items-center gap-1 w-full md:w-1/3 max-w-[400px]">
                <div className="flex items-center gap-6">
                    <button
                        className={`hover:text-white transition ${isShuffle ? 'text-accent' : 'text-text-secondary'}`}
                        onClick={onToggleShuffle}
                        title={isShuffle ? "Disable Shuffle" : "Enable Shuffle"}
                    >
                        <Shuffle size={20} />
                    </button>
                    <button
                        className="text-text-secondary hover:text-white"
                        onClick={onSkipPrev}
                        title="Previous Song"
                    >
                        <SkipBack size={24} fill="currentColor" />
                    </button>

                    <button
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition shadow-lg"
                        onClick={onPlayPause}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-0.5" />}
                    </button>

                    <button
                        className="text-text-secondary hover:text-white"
                        onClick={onSkipNext}
                        title="Next Song"
                    >
                        <SkipForward size={24} fill="currentColor" />
                    </button>
                    <button
                        className={`hover:text-white transition ${repeatMode > 0 ? 'text-accent' : 'text-text-secondary'}`}
                        onClick={onToggleRepeat}
                        title={repeatMode === 0 ? "Enable Repeat" : repeatMode === 1 ? "Repeat One" : "Disable Repeat"}
                    >
                        <Repeat size={20} />
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
                            className="w-full h-1 bg-bg-highlight rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full transition-all"
                        />
                    </div>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Right: Volume & Extra */}
            <div className="w-1/3 hidden md:flex items-center justify-end gap-3 text-text-secondary">
                <button
                    className={`hover:text-white transition ${isLyricsOpen ? 'text-accent' : ''}`}
                    title="Lyrics"
                    onClick={onToggleLyrics}
                >
                    <Mic2 size={20} />
                </button>
                <button
                    className="hover:text-white"
                    title="Queue"
                    onClick={onToggleQueue}
                >
                    <ListMusic size={20} />
                </button>
                <div className="flex items-center gap-2 group w-32">
                    <button onClick={onToggleMute} className="hover:text-white" title={isMuted ? "Unmute" : "Mute"}>
                        {isMuted || volume === 0 ? <VolumeX size={20} /> : volume < 0.5 ? <Volume1 size={20} /> : <Volume2 size={20} />}
                    </button>

                    <div className="flex-1 h-full flex items-center">
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={isMuted ? 0 : volume}
                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                            className="w-full h-1 bg-bg-highlight rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full transition-all"
                            style={{
                                backgroundImage: `linear-gradient(to right, ${isMuted ? '#b3b3b3' : '#1db954'} ${(isMuted ? 0 : volume) * 100}%, #282828 ${(isMuted ? 0 : volume) * 100}%)`
                            }}
                        />
                    </div>
                </div>
            </div>
        </div >
    );
};

export default PlayerControls;
