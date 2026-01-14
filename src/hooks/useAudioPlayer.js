import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage audio playback, crossfading, and Web Audio API context.
 */
export const useAudioPlayer = (currentSong, songs, options = {}) => {
    // --- State ---
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [repeatMode, setRepeatMode] = useState(0); // 0: Off, 1: All, 2: One
    const [eqGains, setEqGains] = useState([0, 0, 0, 0, 0]);
    const [isNormalizationEnabled, setIsNormalizationEnabled] = useState(() => {
        return localStorage.getItem('isNormalizationEnabled') === 'true';
    });

    // --- Refs ---
    const audioRef1 = useRef(new Audio());
    const audioRef2 = useRef(new Audio());
    const activePlayer = useRef(1); // 1 or 2
    const prevVolumeRef = useRef(0.5);

    // Audio Context Refs
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef1 = useRef(null);
    const sourceRef2 = useRef(null);
    const gainNode1 = useRef(null);
    const gainNode2 = useRef(null);
    const compressorRef = useRef(null);
    const filtersRef = useRef([]);

    // --- Initialization ---
    useEffect(() => {
        audioRef1.current.crossOrigin = "anonymous";
        audioRef2.current.crossOrigin = "anonymous";
    }, []);

    // --- Audio Context Setup ---
    const setupAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        if (!analyserRef.current) {
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
        }

        // Initialize Compressor/Limiter for Normalization
        if (!compressorRef.current) {
            compressorRef.current = audioContextRef.current.createDynamicsCompressor();
            compressorRef.current.threshold.value = -24;
            compressorRef.current.knee.value = 30;
            compressorRef.current.ratio.value = 12;
            compressorRef.current.attack.value = 0.003;
            compressorRef.current.release.value = 0.25;
        }

        // Initialize Filters (EQ)
        if (filtersRef.current.length === 0) {
            const frequencies = [60, 230, 910, 3600, 14000];
            filtersRef.current = frequencies.map(freq => {
                const filter = audioContextRef.current.createBiquadFilter();
                filter.type = 'peaking';
                filter.frequency.value = freq;
                filter.Q.value = 1.0;
                filter.gain.value = 0;
                return filter;
            });
            filtersRef.current[0].type = 'lowshelf';
            filtersRef.current[4].type = 'highshelf';
        }

        // Connect Player 1
        if (audioRef1.current && !sourceRef1.current) {
            try {
                sourceRef1.current = audioContextRef.current.createMediaElementSource(audioRef1.current);
                gainNode1.current = audioContextRef.current.createGain();
                sourceRef1.current.connect(gainNode1.current);
                gainNode1.current.connect(analyserRef.current);
            } catch (e) { console.error("Source 1 setup error", e); }
        }

        // Connect Player 2
        if (audioRef2.current && !sourceRef2.current) {
            try {
                sourceRef2.current = audioContextRef.current.createMediaElementSource(audioRef2.current);
                gainNode2.current = audioContextRef.current.createGain();
                sourceRef2.current.connect(gainNode2.current);
                gainNode2.current.connect(analyserRef.current);
            } catch (e) { console.error("Source 2 setup error", e); }
        }

        // Chain: Analyser -> Filters -> (Compressor) -> Destination
        if (analyserRef.current && filtersRef.current.length > 0) {
            try { analyserRef.current.disconnect(); } catch (e) { }

            let prevNode = analyserRef.current;
            filtersRef.current.forEach(filter => {
                try { prevNode.disconnect(); } catch (e) { }
                prevNode.connect(filter);
                prevNode = filter;
            });

            // Normalization check
            try { prevNode.disconnect(); } catch (e) { }
            if (isNormalizationEnabled) {
                prevNode.connect(compressorRef.current);
                compressorRef.current.connect(audioContextRef.current.destination);
            } else {
                prevNode.connect(audioContextRef.current.destination);
            }
        }
    }, [isNormalizationEnabled]);


    // --- Controls ---
    const play = useCallback(async () => {
        setupAudioContext();
        const audio = activePlayer.current === 1 ? audioRef1.current : audioRef2.current;
        if (audio) {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch (e) {
                console.error("Play failed", e);
            }
        }
    }, [setupAudioContext]);

    const pause = useCallback(() => {
        const audio = activePlayer.current === 1 ? audioRef1.current : audioRef2.current;
        if (audio) {
            audio.pause();
            setIsPlaying(false);
        }
    }, []);

    const togglePlayPause = useCallback(() => {
        if (isPlaying) pause();
        else play();
    }, [isPlaying, pause, play]);

    const seek = useCallback((time) => {
        const audio = activePlayer.current === 1 ? audioRef1.current : audioRef2.current;
        if (audio) {
            audio.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const handleVolumeChange = useCallback((newVol) => {
        setVolume(newVol);
        if (newVol > 0 && isMuted) {
            setIsMuted(false);
        }
    }, [isMuted]);

    const toggleMute = useCallback(() => {
        if (isMuted) {
            setIsMuted(false);
            setVolume(prevVolumeRef.current || 0.5);
        } else {
            prevVolumeRef.current = volume;
            setVolume(0);
            setIsMuted(true);
        }
    }, [volume, isMuted]);

    const updateEqGain = useCallback((index, value) => {
        const newGains = [...eqGains];
        newGains[index] = value;
        setEqGains(newGains);

        if (filtersRef.current[index]) {
            filtersRef.current[index].gain.value = value;
        }
    }, [eqGains]);

    const toggleNormalization = useCallback(() => {
        const newValue = !isNormalizationEnabled;
        setIsNormalizationEnabled(newValue);
        localStorage.setItem('isNormalizationEnabled', newValue);
        // Will re-run setupAudioContext logic via dependency if structured correctly, 
        // or we call it explicitly:
        // setupAudioContext(); // Effect dependency handles this
    }, [isNormalizationEnabled]);


    // --- Effects ---
    
    // Volume application
    useEffect(() => {
        if (audioRef1.current) audioRef1.current.volume = volume;
        if (audioRef2.current) audioRef2.current.volume = volume;
    }, [volume]);

    // Time Update & Duration Listeners
    useEffect(() => {
        const audio = activePlayer.current === 1 ? audioRef1.current : audioRef2.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => {
            if (!Number.isNaN(audio.duration)) setDuration(audio.duration);
        };
        
        // Handling 'ended' event is usually done by the parent ensuring 'onEnded' callback 
        // calling 'skipNext', but here we can expose an event or accept a callback.
        
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        
        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
        };
    }, [activePlayer.current, currentSong]); // Re-attach when player swaps or song changes


    // --- Public API ---
    return {
        // State
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        eqGains,
        isNormalizationEnabled,
        analyser: analyserRef.current,
        
        // Actions
        play,
        pause,
        togglePlayPause,
        seek,
        setVolume: handleVolumeChange,
        toggleMute,
        toggleShuffle: () => setIsShuffle(prev => !prev),
        toggleRepeat: () => setRepeatMode(prev => (prev + 1) % 3),
        updateEqGain,
        toggleNormalization,
        setupAudioContext,
        
        // Refs (Advanced usage)
        audioRef1,
        audioRef2,
        activePlayer,
    };
};
