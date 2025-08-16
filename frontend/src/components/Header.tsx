
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import { Menu, X, DollarSign, User, LogOut, Settings, Database, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';

const Header = () => {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="sticky top-0 z-50 pt-8 px-4">
      <header className="w-full max-w-7xl mx-auto py-3 px-6 md:px-8 flex items-center justify-between">
        <div className="p-3">
          <Logo />
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden p-3 rounded-2xl text-muted-foreground hover:text-foreground"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center absolute left-1/2 transform -translate-x-1/2">
          <div className="rounded-full px-1 py-1 backdrop-blur-md bg-background/80 border border-border shadow-lg">
            <div className="flex items-center gap-2">
              <Link to="/video-generation">
                <Button variant="ghost" className="px-4 py-2 rounded-full">
                  <Video size={16} className="inline-block mr-1.5" /> Create Videos
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="ghost" className="px-4 py-2 rounded-full">
                  <DollarSign size={16} className="inline-block mr-1.5" /> Pricing
                </Button>
              </Link>
              {user && (
                <>
                  <Link to="/settings">
                    <Button variant="ghost" className="px-4 py-2 rounded-full">
                      <Settings size={16} className="inline-block mr-1.5" /> Settings
                    </Button>
                  </Link>
                  {user.email === 'admin@example.com' && (
                    <Link to="/admin">
                      <Button variant="ghost" className="px-4 py-2 rounded-full">
                        <Database size={16} className="inline-block mr-1.5" /> Admin
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </nav>
        
        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-4 right-4 bg-background/95 backdrop-blur-md py-4 px-6 border border-border rounded-2xl shadow-lg z-50">
            <div className="flex flex-col gap-4">
              <Link to="/video-generation" className="px-3 py-2 text-sm rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                <Video size={16} className="inline-block mr-1.5" /> Create Videos
              </Link>
              <Link to="/pricing" className="px-3 py-2 text-sm rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                <DollarSign size={16} className="inline-block mr-1.5" /> Pricing
              </Link>
              {user && (
                <>
                  <Link to="/settings" className="px-3 py-2 text-sm rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                    <Settings size={16} className="inline-block mr-1.5" /> Settings
                  </Link>
                  {user.email === 'admin@example.com' && (
                    <Link to="/admin" className="px-3 py-2 text-sm rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                      <Database size={16} className="inline-block mr-1.5" /> Admin
                    </Link>
                  )}
                </>
              )}
              
              {/* Add theme toggle for mobile */}
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
        
        <div className="hidden md:flex items-center gap-4">
          {/* Theme toggle for desktop */}
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <LogOut size={16} />
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl">
              <Link to="/auth">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                  <User size={16} className="mr-2" />
                  Log in
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default Header;
