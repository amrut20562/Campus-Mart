// CampusMart — Responsive Navigation Bar

import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, BookMarked, ShoppingBag, List, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/components/feedback/ToastContext';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    showToast('Signed out successfully');
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? 'active' : ''}`;

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-hairline-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-6">
          {/* Wordmark */}
          <Link
            to="/"
            className="text-body-sm font-medium text-gallery-black shrink-0 tracking-tight"
          >
            CampusMart
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 flex-1" aria-label="Main navigation">
            <NavLink to="/" end className={navLinkClass}>Home</NavLink>
            {user && (
              <>
                <NavLink to="/sell" className={navLinkClass}>Sell Product</NavLink>
                <NavLink to="/saved" className={navLinkClass}>Saved</NavLink>
                <NavLink to="/requests" className={navLinkClass}>Requests</NavLink>
                <NavLink to="/my-listings" className={navLinkClass}>My Listings</NavLink>
              </>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
            )}
          </nav>

          {/* Desktop auth controls */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            {user ? (
              <>
                <NavLink to="/profile" className={navLinkClass}>
                  <User size={15} className="inline-block mr-1" aria-hidden />
                  Profile
                </NavLink>
                <button
                  onClick={handleSignOut}
                  className="btn-ghost text-caption py-1.5 px-4"
                  aria-label="Sign out"
                >
                  <LogOut size={14} aria-hidden />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>Log In</NavLink>
                <Link to="/register" className="btn-primary text-caption py-1.5 px-4">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden ml-auto p-2 rounded-full border border-hairline-gray"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden bg-card border-t border-hairline-gray px-4 pb-4 flex flex-col gap-3">
          <NavLink to="/" end className={navLinkClass} onClick={() => setMenuOpen(false)}>Home</NavLink>
          {user ? (
            <>
              <NavLink to="/sell" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                <ShoppingBag size={14} className="inline mr-1.5" aria-hidden />Sell Product
              </NavLink>
              <NavLink to="/saved" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                <BookMarked size={14} className="inline mr-1.5" aria-hidden />Saved
              </NavLink>
              <NavLink to="/requests" className={navLinkClass} onClick={() => setMenuOpen(false)}>Requests</NavLink>
              <NavLink to="/my-listings" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                <List size={14} className="inline mr-1.5" aria-hidden />My Listings
              </NavLink>
              <NavLink to="/profile" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                <User size={14} className="inline mr-1.5" aria-hidden />Profile
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={navLinkClass} onClick={() => setMenuOpen(false)}>
                  <Shield size={14} className="inline mr-1.5" aria-hidden />Admin
                </NavLink>
              )}
              <hr className="section-divider" />
              <button onClick={handleSignOut} className="btn-ghost w-full justify-center">
                <LogOut size={14} aria-hidden />Sign Out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass} onClick={() => setMenuOpen(false)}>Log In</NavLink>
              <Link to="/register" className="btn-primary w-full justify-center" onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
