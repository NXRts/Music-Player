import React, { useRef, useState } from 'react';
import { X, Download, Upload, Database, CheckCircle, AlertCircle, Moon, Sun, Palette, Settings, Clock } from 'lucide-react';
import { exportData, importData } from '../services/db';

const SettingsModal = ({ onClose, onDataRestored, theme, setTheme, accentColor, setAccentColor, crossfadeDuration, setCrossfadeDuration, onSetSleepTimer, isSleepTimerActive }) => {
    const fileInputRef = useRef(null);
    const [status, setStatus] = useState(null); // 'success', 'error', or null

    const handleExport = async () => {
        try {
            const data = await exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `music_library_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setStatus({ type: 'success', message: 'Export successful!' });
        } catch (error) {
            console.error("Export failed", error);
            setStatus({ type: 'error', message: 'Export failed.' });
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                await importData(data);
                setStatus({ type: 'success', message: 'Library restored successfully!' });
                if (onDataRestored) onDataRestored();
                setTimeout(() => window.location.reload(), 1000); // Reload to reflect changes
            } catch (error) {
                console.error("Import failed", error);
                setStatus({ type: 'error', message: 'Import failed: Invalid file.' });
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    const colors = [
        '#1db954', // Spotify Green
        '#3b82f6', // Blue
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#ef4444', // Red
        '#f97316', // Orange
        '#06b6d4', // Cyan
        '#ffffff', // White
    ];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-bg-card border border-border-subtle rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-border-subtle bg-bg-highlight/30 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                        <Settings size={28} className="text-accent" />
                        Settings
                    </h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-8">

                    {/* Appearance Section */}
                    <div>
                        <h3 className="text-text-primary font-bold text-lg mb-4 flex items-center gap-2">
                            <Palette size={20} className="text-accent" /> Appearance
                        </h3>

                        <div className="space-y-6">
                            {/* Theme Toggle */}
                            <div>
                                <label className="block text-sm text-text-secondary mb-3">Theme Mode</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition ${theme === 'dark' ? 'border-accent bg-accent/10 text-accent' : 'border-border-subtle bg-bg-highlight/50 text-text-secondary hover:bg-bg-highlight'}`}
                                    >
                                        <Moon size={20} /> Dark
                                    </button>
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition ${theme === 'light' ? 'border-accent bg-accent/10 text-accent' : 'border-border-subtle bg-bg-highlight/50 text-text-secondary hover:bg-bg-highlight'}`}
                                    >
                                        <Sun size={20} /> Light
                                    </button>
                                </div>
                            </div>

                            {/* Crossfade Slider */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm text-text-secondary italic">Crossfade (Gapless Transition)</label>
                                    <span className="text-accent font-bold text-sm bg-accent/10 px-2 py-0.5 rounded">{crossfadeDuration}s</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="12"
                                    step="1"
                                    value={crossfadeDuration}
                                    onChange={(e) => setCrossfadeDuration(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-bg-highlight rounded-full appearance-none cursor-pointer accent-accent"
                                />
                                <div className="flex justify-between mt-1 text-[10px] text-text-secondary uppercase">
                                    <span>Off</span>
                                    <span>Smooth</span>
                                    <span>Extreme</span>
                                </div>
                            </div>

                            {/* Accent Colors */}
                            <div>
                                <label className="block text-sm text-text-secondary mb-3">Accent Color</label>
                                <div className="flex flex-wrap gap-3">
                                    {colors.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setAccentColor(c)}
                                            className={`w-10 h-10 rounded-full transition-all border-2 ${accentColor === c ? 'border-text-primary scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                            style={{ backgroundColor: c }}
                                            aria-label={c}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border-subtle"></div>

                    {/* Sleep Timer Section */}
                    <div>
                        <h3 className="text-text-primary font-bold text-lg mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-accent" /> Sleep Timer
                        </h3>
                        <p className="text-text-secondary text-sm mb-4">
                            Automatically stop music playback after a set duration.
                            {isSleepTimerActive && <span className="ml-2 text-accent font-bold animate-pulse">• Active</span>}
                        </p>

                        <div className="grid grid-cols-5 gap-2">
                            {[15, 30, 45, 60].map(mins => (
                                <button
                                    key={mins}
                                    onClick={() => onSetSleepTimer(mins)}
                                    className="p-2 rounded-lg bg-bg-highlight hover:bg-opacity-80 border border-border-subtle transition font-bold text-sm text-text-primary hover:border-accent"
                                >
                                    {mins}m
                                </button>
                            ))}
                            <button
                                onClick={() => onSetSleepTimer(0)}
                                className="p-2 rounded-lg bg-bg-highlight hover:bg-opacity-80 border border-border-subtle transition font-bold text-sm text-red-500 hover:border-red-500"
                            >
                                Off
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-border-subtle"></div>

                    {/* Data Section */}
                    <div>
                        <h3 className="text-text-primary font-bold text-lg mb-4 flex items-center gap-2">
                            <Database size={20} className="text-accent" /> Data Management
                        </h3>
                        <p className="text-text-secondary text-sm mb-4">
                            Backup your library to JSON or restore from backup.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={handleExport}
                                className="flex items-center justify-center gap-3 p-4 bg-bg-highlight hover:bg-opacity-80 rounded-xl transition group border border-border-subtle hover:border-text-secondary/20"
                            >
                                <div className="bg-blue-500/20 p-2 rounded-full group-hover:bg-blue-500/30 transition text-blue-400">
                                    <Download size={20} />
                                </div>
                                <span className="font-bold text-text-primary">Export</span>
                            </button>
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="flex items-center justify-center gap-3 p-4 bg-bg-highlight hover:bg-opacity-80 rounded-xl transition group border border-border-subtle hover:border-text-secondary/20"
                            >
                                <div className="bg-green-500/20 p-2 rounded-full group-hover:bg-green-500/30 transition text-green-400">
                                    <Upload size={20} />
                                </div>
                                <span className="font-bold text-text-primary">Import</span>
                            </button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImport}
                            accept=".json"
                            className="hidden"
                        />
                    </div>

                    {status && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 animate-fade-in ${status.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <span className="font-medium">{status.message}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-bg-highlight/30 text-center text-xs text-text-secondary border-t border-border-subtle flex-shrink-0">
                    Music Player v1.1 • Built with React & Web Audio API
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
