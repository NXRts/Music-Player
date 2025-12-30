import { Menu } from 'lucide-react';

const Header = ({ onOpenMobileMenu }) => {
    return (
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-bg-primary sticky top-0 z-10 transition-colors duration-200">
            <div className="flex gap-2 md:gap-4 items-center">
                <button
                    className="md:hidden text-text-primary p-2 -ml-2"
                    onClick={onOpenMobileMenu}
                >
                    <Menu size={24} />
                </button>
                <div className="hidden md:flex gap-4">
                    <button className="w-8 h-8 rounded-full bg-bg-highlight flex items-center justify-center text-text-primary cursor-not-allowed opacity-50">
                        ❮
                    </button>
                    <button className="w-8 h-8 rounded-full bg-bg-highlight flex items-center justify-center text-text-primary cursor-not-allowed opacity-50">
                        ❯
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <button className="text-text-secondary hover:text-text-primary text-xs md:text-sm font-bold uppercase tracking-wider px-2 py-1">
                    Sign Up
                </button>
                <button className="bg-text-primary text-bg-primary px-4 md:px-8 py-2 md:py-3 rounded-full text-xs md:text-sm font-bold hover:scale-105 transition transform whitespace-nowrap">
                    Log In
                </button>
            </div>
        </header>
    );
};

export default Header;
