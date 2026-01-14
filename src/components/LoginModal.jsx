import React, { useState } from 'react';
import { X } from 'lucide-react';

const LoginModal = ({ onClose, onLogin }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onLogin(name.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-bg-card border border-bg-highlight w-full max-w-md p-6 rounded-xl shadow-2xl relative animate-fade-in">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-text-secondary hover:text-white transition"
                >
                    <X size={24} />
                </button>
                
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-text-secondary mb-6">Enter your name to personalize your experience.</p>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. NXRts"
                            className="w-full bg-bg-highlight border border-transparent focus:border-accent rounded-md px-4 py-3 text-white placeholder-text-secondary outline-none transition"
                            autoFocus
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={!name.trim()}
                        className="bg-accent text-black font-bold py-3 rounded-full hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        Start Listening
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
