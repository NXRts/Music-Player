import React, { useState, useEffect, useRef } from 'react';
import { Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Mic2, ListMusic, Volume2, Volume1, VolumeX, Music, Heart, Moon, Sliders, MoreVertical } from 'lucide-react';

const PlayerControls = ({ currentSong, isPlaying, onPlayPause, currentTime, duration, onSeek, onSkipNext, onSkipPrev, isShuffle, onToggleShuffle, volume, onVolumeChange, isMuted, onToggleMute, repeatMode, onToggleRepeat, onToggleLyrics, isLyricsOpen, onToggleLike, onToggleQueue, isSleepTimerActive, onSetSleepTimer, onToggleEqualizer }) => {
    const [showSleepMenu, setShowSleepMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const sleepMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sleepMenuRef.current && !sleepMenuRef.current.contains(event.target)) {
                setShowSleepMenu(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setShowMobileMenu(false);
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
        <div className="flex items-center justify-between w-full h-full text-text-primary px-2 md:px-0">
            {/* Left Info */}
            <div className="flex items-center gap-3 flex-1 md:w-1/4 min-w-0 pr-2">
                {currentSong ? (
                    <>
                        <div className="relative group flex-shrink-0">
                            {currentSong.cover && !currentSong.cover.includes('placehold.co') ? (
                                <img src={currentSong.cover} alt={currentSong.title} className="w-12 h-12 md:w-14 md:h-14 object-cover rounded shadow-md" />
                            ) : (
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-bg-card flex items-center justify-center text-text-secondary rounded shadow-md">
                                    <Music size={24} />
                                </div>
                            )}
                        </div>
                        <div className="overflow-hidden min-w-0">
                            <div className="font-bold hover:underline cursor-pointer truncate text-sm md:text-base">{currentSong.title}</div>
                            <div className="text-xs text-text-secondary hover:underline cursor-pointer truncate">{currentSong.artist}</div>
                        </div>
                        <button
                            onClick={onToggleLike}
                            className={`hover:text-text-primary transition ${currentSong.isLiked ? 'text-accent' : 'text-text-secondary'} hidden sm:block`}
                        >
                            <Heart size={18} fill={currentSong.isLiked ? "currentColor" : "none"} />
                        </button>
                    </>
                ) : (
                    <div className="text-text-secondary text-sm">No song selected</div>
                )}
            </div>

            {/* Center Controls */}
            <div className="flex flex-col items-center flex-1 md:w-1/2 max-w-[600px] gap-1">
                <div className="flex items-center gap-4 sm:gap-6 mb-1 md:mb-2">
                    <button
                        onClick={onToggleShuffle}
                        className={`hover:text-text-primary transition ${isShuffle ? 'text-accent' : 'text-text-secondary'} hidden md:block`}
                        title="Shuffle"
                    >
                        <Shuffle size={20} />
                    </button>
                    <button className="text-text-secondary hover:text-text-primary transition" onClick={onSkipPrev}>
                        <SkipBack size={24} fill="currentColor" />
                    </button>
                    <button
                        className="bg-text-primary text-bg-primary rounded-full p-2.5 hover:scale-105 transition shadow-lg"
                        onClick={onPlayPause}
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                    </button>
                    <button className="text-text-secondary hover:text-text-primary transition" onClick={onSkipNext}>
                        <SkipForward size={24} fill="currentColor" />
                    </button>
                    <button
                        onClick={onToggleRepeat}
                        className={`hover:text-text-primary transition ${repeatMode > 0 ? 'text-accent' : 'text-text-secondary'} relative hidden md:block`}
                        title="Repeat"
                    >
                        <Repeat size={20} />
                        {repeatMode === 2 && (
                            <span className="absolute -top-1 -right-1 text-[8px] bg-accent text-black rounded-full w-3 h-3 flex items-center justify-center font-bold">1</span>
                        )}
                    </button>

                    {/* Mobile Menu Trigger */}
                    <div className="md:hidden relative" ref={mobileMenuRef}>
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className={`p-2 rounded-full hover:bg-white/10 transition ${showMobileMenu ? 'text-accent' : 'text-text-secondary'}`}
                        >
                            <MoreVertical size={24} />
                        </button>

                        {showMobileMenu && (
                            <div className="absolute bottom-full mb-4 right-0 bg-bg-highlight border border-white/10 rounded-2xl shadow-2xl py-3 w-56 z-[200] animate-in slide-in-from-bottom-5 duration-300">
                                <div className="px-4 py-2 text-xs font-bold text-text-secondary uppercase tracking-widest border-b border-white/5 mb-2">Options</div>
                                <button onClick={() => { onToggleShuffle(); setShowMobileMenu(false); }} className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors ${isShuffle ? 'text-accent' : 'text-text-primary'}`}>
                                    <Shuffle size={20} /> <span className="text-sm font-medium">Shuffle</span>
                                </button>
                                <button onClick={() => { onToggleRepeat(); setShowMobileMenu(false); }} className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors ${repeatMode > 0 ? 'text-accent' : 'text-text-primary'}`}>
                                    <Repeat size={20} /> <span className="text-sm font-medium">Repeat {repeatMode === 2 ? '(One)' : ''}</span>
                                </button>
                                <button onClick={() => { onToggleLyrics(); setShowMobileMenu(false); }} className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors ${isLyricsOpen ? 'text-accent' : 'text-text-primary'}`}>
                                    <Mic2 size={20} /> <span className="text-sm font-medium">Lyrics</span>
                                </button>
                                <button onClick={() => { onToggleEqualizer(); setShowMobileMenu(false); }} className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors text-text-primary">
                                    <Sliders size={20} /> <span className="text-sm font-medium">Equalizer</span>
                                </button>
                                <button onClick={() => { setShowSleepMenu(true); setShowMobileMenu(false); }} className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors ${isSleepTimerActive ? 'text-accent' : 'text-text-primary'}`}>
                                    <Moon size={20} /> <span className="text-sm font-medium">Sleep Timer</span>
                                </button>
                                <button onClick={() => { onToggleQueue(); setShowMobileMenu(false); }} className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors text-text-primary">
                                    <ListMusic size={20} /> <span className="text-sm font-medium">Open Queue</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full text-[10px] md:text-xs text-text-secondary px-1 sm:px-4">
                    <span className="min-w-[32px]">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={currentTime}
                        onChange={(e) => onSeek(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-bg-highlight rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 md:[&::-webkit-slider-thumb]:w-3 md:[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-text-primary [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all group"
                        style={{
                            backgroundImage: `linear-gradient(to right, var(--color-text-primary) ${(currentTime / (duration || 1)) * 100}%, var(--color-border-subtle) ${(currentTime / (duration || 1)) * 100}%)`
                        }}
                    />
                    <span className="min-w-[32px] text-right">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Right Controls */}
            <div className="hidden md:flex items-center gap-2 w-1/4 justify-end min-w-[200px]">
                {/* Sleep Timer */}
                <div className="relative" ref={sleepMenuRef}>
                    <button
                        onClick={() => setShowSleepMenu(!showSleepMenu)}
                        className={`hover:text-text-primary transition p-2 rounded-full hover:bg-white/10 ${isSleepTimerActive ? 'text-accent' : 'text-text-secondary'}`}
                        title="Sleep Timer"
                    >
                        <Moon size={20} fill={isSleepTimerActive ? "currentColor" : "none"} />
                    </button>
                    {showSleepMenu && (
                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-bg-highlight border border-white/10 rounded-lg shadow-2xl py-2 w-40 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="text-xs font-bold text-text-secondary px-4 py-2 uppercase tracking-wider">Sleep Timer</div>
                            {[5, 15, 30, 45, 60].map((min) => (
                                <button
                                    key={min}
                                    className="w-full text-left px-4 py-2 hover:bg-white/10 text-text-primary text-sm transition-colors flex items-center justify-between group"
                                    onClick={() => { onSetSleepTimer(min); setShowSleepMenu(false); }}
                                >
                                    <span>{min} Minutes</span>
                                    {isSleepTimerActive && min === 0 && <span className="w-2 h-2 rounded-full bg-accent"></span>}
                                </button>
                            ))}
                            <div className="border-t border-white/10 my-1"></div>
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-white/10 text-red-400 hover:text-red-300 text-sm transition-colors font-medium"
                                onClick={() => { onSetSleepTimer(0); setShowSleepMenu(false); }}
                            >
                                Turn Off Timer
                            </button>
                        </div>
                    )}
                </div>

                <button
                    className="text-text-secondary hover:text-text-primary transition p-2 rounded-full hover:bg-white/10"
                    title="Equalizer"
                    onClick={onToggleEqualizer}
                >
                    <Sliders size={20} />
                </button>

                <button
                    onClick={onToggleLyrics}
                    className={`${isLyricsOpen ? 'text-accent' : 'text-text-secondary'} hover:text-text-primary transition p-2 rounded-full hover:bg-white/10`}
                    title="Lyrics/Info"
                >
                    <Mic2 size={20} />
                </button>

                <button
                    className="hover:text-text-primary transition p-2 rounded-full hover:bg-white/10 text-text-secondary"
                    title="Queue"
                    onClick={onToggleQueue}
                >
                    <ListMusic size={20} />
                </button>
                <div className="flex items-center gap-2 group w-32">
                    <button onClick={onToggleMute} className="hover:text-text-primary" title={isMuted ? "Unmute" : "Mute"}>
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
                            className="w-full h-1 bg-bg-highlight rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-text-primary [&::-webkit-slider-thumb]:rounded-full transition-all"
                            style={{
                                backgroundImage: `linear-gradient(to right, ${isMuted ? 'var(--color-text-secondary)' : 'var(--color-text-primary)'} ${(isMuted ? 0 : volume) * 100}%, var(--color-border-subtle) ${(isMuted ? 0 : volume) * 100}%)`
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerControls;
