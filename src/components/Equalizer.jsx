import React from 'react';

const Equalizer = ({ gains, onUpdateGain, onClose }) => {
    const bands = [
        { label: '60 Hz', value: 60, min: -12, max: 12 },
        { label: '230 Hz', value: 230, min: -12, max: 12 },
        { label: '910 Hz', value: 910, min: -12, max: 12 },
        { label: '3.6 kHz', value: 3600, min: -12, max: 12 },
        { label: '14 kHz', value: 14000, min: -12, max: 12 },
    ];

    return (
        <div className="absolute bottom-20 right-4 bg-neutral-900 border border-gray-700 p-4 rounded-lg shadow-xl z-50 w-64">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold text-sm">Equalizer</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>
            </div>

            <div className="flex justify-between h-32 gap-2">
                {bands.map((band, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                        <input
                            type="range"
                            min={band.min}
                            max={band.max}
                            value={gains[index] || 0}
                            onChange={(e) => onUpdateGain(index, Number(e.target.value))}
                            className="h-24 w-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-vertical"
                            style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
                        />
                        <span className="text-[10px] text-gray-400 mt-2 whitespace-nowrap">{
                            band.value >= 1000 ? `${band.value / 1000}k` : band.value
                        }</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-2">
                <span className="text-[10px] text-gray-500">-12dB</span>
                <span className="text-[10px] text-gray-500">0dB</span>
                <span className="text-[10px] text-gray-500">+12dB</span>
            </div>
        </div>
    );
};

export default Equalizer;
