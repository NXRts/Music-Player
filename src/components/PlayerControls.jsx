import React, { useState, useEffect, useRef } from 'react';
import { Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Mic2, ListMusic, Volume2, Volume1, VolumeX, Music, Heart, Moon, Sliders } from 'lucide-react';

const PlayerControls = ({ currentSong, isPlaying, onPlayPause, currentTime, duration, onSeek, onSkipNext, onSkipPrev, isShuffle, onToggleShuffle, volume, onVolumeChange, isMuted, onToggleMute, repeatMode, onToggleRepeat, onToggleLyrics, isLyricsOpen, onToggleLike, onToggleQueue, isSleepTimerActive, onSetSleepTimer, onToggleEqualizer }) => {
    const [showSleepMenu, setShowSleepMenu] = useState(false);
    const sleepMenuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sleepMenuRef.current && !sleepMenuRef.current.contains(event.target)) {
                setShowSleepMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const formatTime = (time) => {
        if (!time && time !== 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="flex items-center justify-between w-full h-full text-white">
            {/* Left Info */}
            <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
                {currentSong ? (
                    <>
                        <div className="relative group">
                            {currentSong.cover && !currentSong.cover.includes('placehold.co') ? (
                                <img src={currentSong.cover} alt={currentSong.title} className="w-14 h-14 object-cover rounded shadow-md" />
                            ) : (
                                <div className="w-14 h-14 bg-bg-card flex items-center justify-center text-text-secondary rounded shadow-md">
                                    <Music size={24} />
                                </div>
                            )}
                            <button className="absolute top-0 right-0 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition">
                                {/* Expand arrow logic could go here */}
                            </button>
                        </div>
                        <div className="overflow-hidden">
                            <div className="font-bold hover:underline cursor-pointer truncate">{currentSong.title}</div>
                            <div className="text-xs text-text-secondary hover:underline cursor-pointer truncate">{currentSong.artist}</div>
                        </div>
                        <button
                            onClick={onToggleLike}
                            className={`hover:text-white transition ${currentSong.isLiked ? 'text-accent' : 'text-text-secondary'}`}
                        >
                            <Heart size={18} fill={currentSong.isLiked ? "currentColor" : "none"} />
                        </button>
                    </>
                ) : (
                    <div className="text-text-secondary text-sm">No song selected</div>
                )}
            </div>

            {/* Center Controls */}
            <div className="flex flex-col items-center w-1/2 max-w-[600px]">
                <div className="flex items-center gap-6 mb-2">
                    <button
                        onClick={onToggleShuffle}
                        className={`hover:text-white transition ${isShuffle ? 'text-accent' : 'text-text-secondary'}`}
                        title="Shuffle"
                    >
                        <Shuffle size={20} />
                    </button>
                    <button className="text-text-secondary hover:text-white transition" onClick={onSkipPrev}>
                        <SkipBack size={24} fill="currentColor" />
                    </button>
                    <button
                        className="bg-white text-black rounded-full p-2 hover:scale-105 transition"
                        onClick={onPlayPause}
                    >
                        {isPlaying ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" />}
                    </button>
                    <button className="text-text-secondary hover:text-white transition" onClick={onSkipNext}>
                        <SkipForward size={24} fill="currentColor" />
                    </button>
                    <button
                        onClick={onToggleRepeat}
                        className={`hover:text-white transition ${repeatMode > 0 ? 'text-accent' : 'text-text-secondary'} relative`}
                        title="Repeat"
                    >
                        <Repeat size={20} />
                        {repeatMode === 2 && (
                            <span className="absolute -top-1 -right-1 text-[8px] bg-accent text-black rounded-full w-3 h-3 flex items-center justify-center font-bold">1</span>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full text-xs text-text-secondary">
                    <span>{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={currentTime}
                        onChange={(e) => onSeek(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-bg-highlight rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all group"
                        style={{
                            backgroundImage: `linear-gradient(to right, #ffffff ${(currentTime / (duration || 1)) * 100}%, #4d4d4d ${(currentTime / (duration || 1)) * 100}%)`
                        }}
                    />
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 w-1/4 justify-end min-w-[200px]">
                {/* Sleep Timer */}
                <div className="relative" ref={sleepMenuRef}>
                    <button
                        onClick={() => setShowSleepMenu(!showSleepMenu)}
                        className={`hover:text-white transition p-2 rounded-full hover:bg-white/10 ${isSleepTimerActive ? 'text-accent' : 'text-text-secondary'}`}
                        title="Sleep Timer"
                    >
                        <Moon size={18} fill={isSleepTimerActive ? "currentColor" : "none"} />
                    </button>
                    {showSleepMenu && (
                        <div className="absolute bottom-12 right-0 bg-bg-card border border-bg-highlight rounded-md shadow-xl py-1 w-32 z-50">
                            {[5, 10, 15, 30, 45, 60].map(min => (
                                <button
                                    key={min}
                                    className="w-full text-left px-4 py-2 hover:bg-bg-highlight text-text-primary text-sm"
                                    onClick={() => { onSetSleepTimer(min); setShowSleepMenu(false); }}
                                >
                                    {min} min
                                </button>
                            ))}
                            <div className="border-t border-gray-700 my-1"></div>
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-bg-highlight text-red-500 text-sm"
                                onClick={() => { onSetSleepTimer(0); setShowSleepMenu(false); }}
                            >
                                Turn Off
                            </button>
                        </div>
                    )}
                </div>

                <button
                    className="text-text-secondary hover:text-white transition p-2 rounded-full hover:bg-white/10"
                    title="Equalizer"
                    onClick={onToggleEqualizer}
                >
                    <Sliders size={20} />
                </button>

                <button
                    onClick={onToggleLyrics}
                    className={`${isLyricsOpen ? 'text-accent' : 'text-text-secondary'} hover:text-white transition p-2 rounded-full hover:bg-white/10`}
                    title="Lyrics/Info"
                >
                    <Mic2 size={20} />
                </button>

                <button
                    className="hover:text-white transition p-2 rounded-full hover:bg-white/10 text-text-secondary"
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
        </div>
    );
};

export default PlayerControls;
