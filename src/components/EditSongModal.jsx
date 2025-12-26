import React, { useState } from 'react';

const EditSongModal = ({ song, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        title: song.title || '',
        artist: song.artist || '',
        cover: song.cover || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(song.id, formData);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
            <div className="bg-bg-card border border-bg-highlight rounded-xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                <h2 className="text-2xl font-bold mb-6 text-white text-center">Edit Song Info</h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-bg-highlight text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                            placeholder="Song Title"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Artist</label>
                        <input
                            type="text"
                            value={formData.artist}
                            onChange={e => setFormData({ ...formData, artist: e.target.value })}
                            className="w-full bg-bg-highlight text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                            placeholder="Artist Name"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Cover Image URL</label>
                        <div className="flex gap-4 items-start">
                            <div className="w-16 h-16 bg-bg-highlight rounded shadow flex-shrink-0 overflow-hidden">
                                {formData.cover ? (
                                    <img src={formData.cover} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">No Cover</div>
                                )}
                            </div>
                            <input
                                type="text"
                                value={formData.cover}
                                onChange={e => setFormData({ ...formData, cover: e.target.value })}
                                className="w-full bg-bg-highlight text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>
                        <p className="text-[10px] text-text-secondary mt-1 ml-20">Paste a direct image link.</p>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-full hover:bg-white/10 text-white font-bold transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-accent text-black py-3 rounded-full font-bold hover:scale-105 transition"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSongModal;
