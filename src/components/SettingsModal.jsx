import React, { useRef } from 'react';
import { X, Download, Upload, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { exportData, importData } from '../services/db';

const SettingsModal = ({ onClose, onDataRestored }) => {
    const fileInputRef = useRef(null);
    const [status, setStatus] = React.useState(null); // 'success', 'error', or null

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
                // Optional: Close modal after short delay?
            } catch (error) {
                console.error("Import failed", error);
                setStatus({ type: 'error', message: 'Import failed: Invalid file.' });
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#181818] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#282828]">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Database size={24} className="text-accent" />
                        Settings
                    </h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-white font-bold text-lg mb-2">Data Management</h3>
                        <p className="text-text-secondary text-sm mb-4">
                            Backup your library to a JSON file or restore it from a previous backup.
                            Note: Importing will replace your current library.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={handleExport}
                                className="flex items-center justify-center gap-2 bg-[#333] hover:bg-[#444] text-white py-4 rounded-lg font-bold transition group"
                            >
                                <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
                                Export Library
                            </button>
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="flex items-center justify-center gap-2 bg-[#333] hover:bg-[#444] text-white py-4 rounded-lg font-bold transition group"
                            >
                                <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
                                Import Library
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
                        <div className={`flex items-center gap-3 p-4 rounded-lg ${status.type === 'success' ? 'bg-green-900/50 text-green-200 border border-green-700' : 'bg-red-900/50 text-red-200 border border-red-700'} animate-in slide-in-from-bottom duration-300`}>
                            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <span className="font-medium">{status.message}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-[#282828] text-center text-xs text-text-secondary border-t border-white/10">
                    Music Player v1.0 • Built with React & Web Audio API
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
