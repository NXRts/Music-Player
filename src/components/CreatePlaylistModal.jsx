import React, { useState, useEffect } from 'react';
import { X, Plus, Music } from 'lucide-react';

const CreatePlaylistModal = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim());
        }
    };

    // Focus input on mount
    useEffect(() => {
        const input = document.getElementById('playlist-name-input');
        if (input) input.focus();
    }, []);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-bg-card border border-border-subtle rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 pb-0 flex justify-between items-start">
                    <div className="bg-accent/10 p-3 rounded-xl text-accent mb-4">
                        <Plus size={24} />
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary transition p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 pt-0">
                    <h2 className="text-xl font-bold text-text-primary mb-1">Create Playlist</h2>
                    <p className="text-sm text-text-secondary mb-6">Build something new for your library.</p>

                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent transition-colors">
                            <Music size={18} />
                        </div>
                        <input
                            id="playlist-name-input"
                            type="text"
                            placeholder="Enter playlist name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-bg-primary border border-border-subtle rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-secondary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-inner"
                            autoComplete="off"
                        />
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-bold text-text-primary bg-bg-highlight hover:bg-bg-highlight/80 transition-all border border-border-subtle"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePlaylistModal;
