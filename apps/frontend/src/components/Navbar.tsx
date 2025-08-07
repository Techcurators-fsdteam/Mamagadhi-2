"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import Link from "next/link";
import { useAuth } from "../lib/auth";
import { useRouter } from "next/navigation";
import LoginRequiredPopup from "./LoginRequiredPopup";
import LoginPopup from "./LoginPopup";
import SignupPopup from "./SignupPopup";
import { supabase } from "../lib/supabase";

const Navbar = () => {
  const { user, userProfile, loading, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const [showDriverPopup, setShowDriverPopup] = useState(false);
  const [showLoginRequired, setShowLoginRequired] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };

  const handleBookRide = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLogin(true);
      return;
    }
    router.push("/book");
  };

  const handlePostRide = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      setShowLogin(true);
      return;
    }

    try {
      if (!supabase) {
        console.error("Supabase client not initialized");
        setShowDriverPopup(true);
        return;
      }

      const { data } = await supabase
        .from("driver_profiles")
        .select("id_verified, dl_verified")
        .eq("user_profile_id", user.uid)
        .single();

      if (data) {
        const isFullyVerified = data.id_verified && data.dl_verified;
        if (!isFullyVerified) {
          setShowDriverPopup(true);
          return;
        }
      } else {
        setShowDriverPopup(true);
        return;
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setShowDriverPopup(true);
      return;
    }

    router.push("/publish");
  };

  const getUserInitials = () => {
    if (userProfile?.display_name) {
      return userProfile.display_name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
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
              width={170}
              height={50}
              className="h-6 sm:h-8 md:h-10 object-contain"
            />
          </Link>
        </div>

        {/* Desktop: Book and Post a ride buttons */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          <Button
            variant="outline"
            className="rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium h-10 min-w-[110px]"
            onClick={handleBookRide}
          >
            <span className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="text-gray-700"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span className="text-gray-500">Book a ride</span>
            </span>
          </Button>

          <Button
            variant="outline"
            className="rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium h-10 min-w-[110px]"
            onClick={handlePostRide}
          >
            <span className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="text-gray-700"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span className="text-gray-500">Publish a ride</span>
            </span>
          </Button>
        </div>

        {/* Mobile: Smaller Publish button */}
        <div className="flex md:hidden items-center">
          <Button
            variant="outline"
            className="rounded-full px-2 py-1 flex items-center gap-1 text-xs font-medium h-8 min-w-[80px]"
            onClick={handlePostRide}
          >
            <span className="flex items-center gap-1">
              <svg
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="text-gray-700"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span className="text-gray-500">Publish</span>
            </span>
          </Button>
        </div>

        {/* User Auth Section */}
        <div className="flex items-center relative h-full ml-3">
          {loading ? (
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-gray-200 animate-pulse"></div>
          ) : !user ? (
            <button
              onClick={() => setShowLogin(true)}
              className="text-sm bg-[#4AAAFF] text-white hover:bg-[#2196f3] font-medium px-3 py-1.5 rounded-md transition"
            >
              Sign In
            </button>
          ) : (
            <div className="flex items-center gap-2 h-full">
              <span className="hidden lg:block text-sm font-medium text-gray-700">
                {userProfile?.display_name ||
                  user.email?.split("@")[0] ||
                  "User"}
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

              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className="hidden sm:block text-gray-400 cursor-pointer"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>

              {showDropdown && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-medium text-gray-900 truncate">
                      {userProfile?.display_name || "User"}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
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
                      onClick={(e) => {
                        setShowDropdown(false);
                        handleBookRide(e);
                      }}
                      className="block md:hidden w-full text-left rounded px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    >
                      Book a ride
                    </button>
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
      </nav>

      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}

      <LoginRequiredPopup
        isOpen={showLoginRequired}
        onClose={() => setShowLoginRequired(false)}
        setShowLogin={setShowLogin}
      />

      <LoginPopup
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToSignup={() => {
          setShowLogin(false);
          setShowSignup(true);
        }}
      />

      <SignupPopup
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={() => {
          setShowSignup(false);
          setShowLogin(true);
        }}
      />

      {showDriverPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-white/30">
          <div
            className="relative bg-gradient-to-br from-[#4AAAFF] to-white rounded-2xl shadow-2xl max-w-xs w-full text-center p-8"
            style={{ backdropFilter: "blur(16px)" }}
          >
            <button
              className="absolute top-3 right-3 text-white hover:text-[#2196f3] text-xl font-bold focus:outline-none transition-colors"
              onClick={() => setShowDriverPopup(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="mb-4 text-2xl font-bold text-white">
              You are not verified as a Driver
            </div>
            <div className="mb-6 text-base text-black/50">
              Update your profile to publish a ride.
            </div>
            <button
              className="bg-[#4AAAFF] text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 w-full mb-2 transition"
              onClick={() => {
                setShowDriverPopup(false);
                router.push("/profile");
              }}
            >
              Go to Profile
            </button>
            <button
              className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 hover:text-black transition"
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
