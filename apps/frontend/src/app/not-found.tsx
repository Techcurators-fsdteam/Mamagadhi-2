'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
      {/* Logo */}
      <div className="mb-6">
        <Image
          src="/logo.png"
          alt="Mamaghadi Logo"
          width={100}
          height={100}
          className="mx-auto"
        />
      </div>

      {/* 404 Heading */}
      <h1 className="text-6xl font-bold text-[#4AAAFF] mb-4">404</h1>
      <p className="text-[#4AAAFF] text-lg font-medium mb-6">
        Oops! The page you’re looking for doesn’t exist.
      </p>

      {/* Action Buttons */}
      <div className="space-y-3 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
        <Link 
          href="/"
          className="inline-block bg-[#4AAAFF] text-white px-6 py-3 rounded-md font-medium hover:bg-[#3c92d4] transition"
        >
          Go Home
        </Link>
        <Link 
          href="/publish"
          className="inline-block border-2 border-[#4AAAFF] text-[#4AAAFF] px-6 py-3 rounded-md font-medium hover:bg-[#f0faff] transition"
        >
          Publish a Ride
        </Link>
        <Link 
          href="/book"
          className="inline-block border-2 border-[#4AAAFF] text-[#4AAAFF] px-6 py-3 rounded-md font-medium hover:bg-[#f0faff] transition"
        >
          Book a Ride
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
