import React from 'react';
import { Sliders } from 'lucide-react';

const Equalizer = ({ gains, onUpdateGain, onClose }) => {
    const bands = [
        { label: '60 Hz', value: 60, min: -12, max: 12 },
        { label: '230 Hz', value: 230, min: -12, max: 12 },
        { label: '910 Hz', value: 910, min: -12, max: 12 },
        { label: '3.6 kHz', value: 3600, min: -12, max: 12 },
        { label: '14 kHz', value: 14000, min: -12, max: 12 },
    ];

    const presets = {
        'Flat': [0, 0, 0, 0, 0],
        'Rock': [3, 2, -2, 1, 3],
        'Pop': [-1, 2, 3, 2, -1],
        'Jazz': [3, 2, 1, 2, 3],
        'Classical': [3, 2, 0, 2, 4],
        'Bass Boost': [5, 3, 0, 0, 0],
        'Treble Boost': [0, 0, 0, 3, 5],
        'Electronic': [4, 2, 0, 2, 4]
    };

    const handlePresetChange = (presetName) => {
        const presetGains = presets[presetName];
        presetGains.forEach((gain, index) => {
            onUpdateGain(index, gain);
        });
    };

    return (
        <div className="absolute bottom-24 right-4 bg-bg-card border border-border-subtle p-5 rounded-2xl shadow-2xl z-[100] w-72 animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-text-primary font-bold text-lg flex items-center gap-2">
                    <Sliders size={20} className="text-accent" />
                    Equalizer
                </h3>
                <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-bg-highlight transition">
                    <span className="text-xl">✕</span>
                </button>
            </div>

            {/* Presets Dropdown */}
            <div className="mb-6">
                <label className="text-[10px] uppercase font-bold text-text-secondary mb-2 block tracking-wider">Presets</label>
                <select
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full bg-bg-highlight border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                    <option value="Flat">Flat (Default)</option>
                    <option value="Rock">Rock</option>
                    <option value="Pop">Pop</option>
                    <option value="Jazz">Jazz</option>
                    <option value="Classical">Classical</option>
                    <option value="Bass Boost">Bass Boost</option>
                    <option value="Treble Boost">Treble Boost</option>
                    <option value="Electronic">Electronic</option>
                </select>
            </div>

            <div className="flex justify-between h-40 gap-3">
                {bands.map((band, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 relative group">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-highlight px-1.5 rounded text-[10px] font-bold text-accent border border-border-subtle">
                            {gains[index] > 0 ? '+' : ''}{gains[index]}
                        </div>
                        <input
                            type="range"
                            min={band.min}
                            max={band.max}
                            step="1"
                            value={gains[index] || 0}
                            onChange={(e) => onUpdateGain(index, Number(e.target.value))}
                            className="h-full w-1.5 bg-bg-highlight rounded-full appearance-none cursor-pointer hover:bg-accent/20 transition-colors"
                            style={{
                                writingMode: 'bt-lr',
                                WebkitAppearance: 'slider-vertical',
                                accentColor: 'var(--accent)'
                            }}
                        />
                        <span className="text-[10px] font-bold text-text-secondary mt-3 whitespace-nowrap">{
                            band.value >= 1000 ? `${band.value / 1000}k` : band.value
                        }</span>
                    </div>
                ))}
            </div>

            <div className="flex justify-between mt-4">
                <span className="text-[9px] font-bold text-text-secondary/50">-12dB</span>
                <div className="flex-1 mx-2 border-b border-dashed border-border-subtle/30 h-1.5"></div>
                <span className="text-[9px] font-bold text-text-secondary/50">0dB</span>
                <div className="flex-1 mx-2 border-b border-dashed border-border-subtle/30 h-1.5"></div>
                <span className="text-[9px] font-bold text-text-secondary/50">+12dB</span>
            </div>
        </div>
    );
};

export default Equalizer;
