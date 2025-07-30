import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import Link from 'next/link';
import LoginPopup from './LoginPopup';
import SignupPopup from './SignupPopup';
import { useAuth } from '../lib/auth';
import { useRouter } from 'next/navigation';
import LoginRequiredPopup from './LoginRequiredPopup';
import { supabase } from '../lib/supabase';

const Navbar = () => {
  const { user, userProfile, loading, signOut } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const [showDriverPopup, setShowDriverPopup] = useState(false);
  const [showLoginRequired, setShowLoginRequired] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };

  // Handler for Book a ride
  const handleBookRide = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginRequired(true);
      return;
    }
    router.push('/book');
  };

  // Handler for Post a ride
  const handlePostRide = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginRequired(true);
      return;
    }
    
    // Check verification status from database instead of localStorage
    try {
      if (!supabase) {
        throw new Error('Database not available');
      }
      
      const { data } = await supabase
        .from('driver_profiles')
        .select('id_verified, dl_verified')
        .eq('user_profile_id', user.uid)
        .single();
      
      if (data) {
        const isFullyVerified = data.id_verified && data.dl_verified;
        if (!isFullyVerified) {
          setShowDriverPopup(true);
          return;
        }
      } else {
        // No driver profile exists, show driver popup
        setShowDriverPopup(true);
        return;
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      // On error, still allow navigation but let publish page handle verification
    }
    
    router.push('/publish');
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (userProfile?.display_name) {
      return userProfile.display_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <>
      <nav className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white h-14 sm:h-16 mt-4 mb-2">
        {/* Logo */}
        <div className="flex items-center min-w-[100px] h-full">
          <Link href="/">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              width={140} 
              height={45} 
              className="h-8 sm:h-10 md:h-12 object-contain" 
            />
          </Link>
        </div>

        {/* Center: Book and Post a ride */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6 flex-1 justify-end h-full">
          {/* Book a ride */}
          <Button
            variant="outline"
            className="rounded-full px-3 sm:px-4 py-2 flex items-center gap-2 text-sm font-medium h-9 sm:h-10 min-w-[90px] sm:min-w-[110px]"
            onClick={handleBookRide}
          >
            <span className="flex items-center gap-2">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-700"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <span className="text-gray-500">Book a ride</span>
            </span>
          </Button>

          {/* Post a ride */}
          <Button
            variant="outline"
            className="rounded-full px-3 sm:px-4 py-2 flex items-center gap-2 text-sm font-medium h-9 sm:h-10 min-w-[90px] sm:min-w-[110px]"
            onClick={handlePostRide}
          >
            <span className="flex items-center gap-2">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-700"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <span className="text-gray-500">Publish a ride</span>
            </span>
          </Button>

          {/* User Auth */}
          <div className="ml-3 flex items-center relative h-full">
            {loading ? (
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-gray-200 animate-pulse"></div>
            ) : !user ? (
              <button
                className="bg-[#2196f3] text-white font-medium text-sm px-4 py-2 rounded-full hover:bg-[#1769aa] transition h-9 sm:h-10"
                onClick={() => setShowLogin(true)}
              >
                Sign in
              </button>
            ) : (
              <div className="flex items-center gap-2 h-full">
                {/* User name (hidden on mobile) */}
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {userProfile?.display_name || user.email?.split('@')[0] || 'User'}
                </span>
                
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center h-9 sm:h-10"
                >
                  <Avatar className="w-9 sm:w-10 h-9 sm:h-10">
                    <AvatarImage 
                      src={userProfile?.profile_url || "/avatar.png"} 
                      alt="User" 
                      className="object-cover object-center"
                    />
                    <AvatarFallback className="bg-[#4AAAFF] text-white font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <p className="font-medium text-gray-900 truncate">
                        {userProfile?.display_name || 'User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-2 px-2 flex flex-col gap-1">
                      <Link
                        href="/profile"
                        className="block rounded px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        onClick={() => setShowDropdown(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/rides"
                        className="block rounded px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        onClick={() => setShowDropdown(false)}
                      >
                        My Rides
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left rounded px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dropdown arrow (only if signed in) */}
          {user && !loading && (
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-400 ml-1 cursor-pointer" onClick={() => setShowDropdown(!showDropdown)}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          )}
        </div>
      </nav>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Popups */}
      <LoginPopup
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToSignup={() => { setShowLogin(false); setShowSignup(true); }}
      />
      {/* Login Required Popup for protected actions */}
      <LoginRequiredPopup
        isOpen={showLoginRequired}
        onClose={() => setShowLoginRequired(false)}
        setShowLogin={setShowLogin}
      />
      <SignupPopup
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true); }}
      />

      {/* Driver Verification Popup */}
      {showDriverPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-white/30">
          <div className="relative bg-gradient-to-br from-[#4AAAFF] to-white rounded-2xl shadow-2xl max-w-xs w-full text-center p-8" style={{backdropFilter: 'blur(16px)'}}>
            <button
              className="absolute top-3 right-3 text-white hover:text-[#2196f3] text-xl font-bold focus:outline-none transition-colors"
              onClick={() => setShowDriverPopup(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="mb-4 text-2xl font-bold text-white">You are not verified as a Driver</div>
            <div className="mb-6 text-base text-black/50">Update your profile to publish a ride.</div>
            <button
              className="bg-[#4AAAFF] text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 w-full mb-2 transition"
              onClick={() => { setShowDriverPopup(false); router.push('/profile'); }}
            >
              Go to Profile
            </button>
            <button
              className="w-full px-4 py-2 rounded-lg border border-gray-300 text-white hover:bg-gray-100 hover:text-black/80 transition"
              onClick={() => setShowDriverPopup(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
