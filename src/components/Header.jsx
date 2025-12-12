import React from 'react';

const Header = () => {
    return (
        <header className="h-16 flex items-center justify-between px-6 bg-transparent sticky top-0 z-10 transition-colors duration-200">
            <div className="flex gap-4">
                <button className="w-8 h-8 rounded-full bg-black bg-opacity-70 flex items-center justify-center text-white cursor-not-allowed opacity-50">
                    ❮
                </button>
                <button className="w-8 h-8 rounded-full bg-black bg-opacity-70 flex items-center justify-center text-white cursor-not-allowed opacity-50">
                    ❯
                </button>
            </div>

            <div className="flex items-center gap-4">
                <button className="text-text-secondary hover:text-white text-sm font-bold uppercase tracking-wider">
                    Sign Up
                </button>
                <button className="bg-white text-black px-8 py-3 rounded-full text-sm font-bold hover:scale-105 transition transform">
                    Log In
                </button>
            </div>
        </header>
    );
};

export default Header;
