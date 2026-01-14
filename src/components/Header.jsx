import { Menu, User, LogOut } from 'lucide-react';

const Header = ({ onOpenMobileMenu, user, onLogin, onLogout }) => {
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
                {user ? (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-bg-highlight rounded-full px-1 py-1 pr-4">
                            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-black">
                                <User size={18} />
                            </div>
                            <span className="text-sm font-bold truncate max-w-[100px]">{user.name}</span>
                        </div>
                        <button 
                            onClick={onLogout}
                            className="text-text-secondary hover:text-white p-2 rounded-full hover:bg-bg-highlight transition"
                            title="Log Out"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                ) : (
                    <>
                        <button className="text-text-secondary hover:text-text-primary text-xs md:text-sm font-bold uppercase tracking-wider px-2 py-1">
                            Sign Up
                        </button>
                        <button 
                            onClick={onLogin}
                            className="bg-text-primary text-bg-primary px-4 md:px-8 py-2 md:py-3 rounded-full text-xs md:text-sm font-bold hover:scale-105 transition transform whitespace-nowrap"
                        >
                            Log In
                        </button>
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;
