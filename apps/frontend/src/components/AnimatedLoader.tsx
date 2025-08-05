'use client';

import React from 'react';
import Image from 'next/image';

const AnimatedLoader = () => {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        {/* Animated Logo */}
        <div className="relative">
          <Image
            src="/logo.png"
            alt="Loading..."
            width={150}
            height={120}
            className="animate-pulse"
          />
        </div>
      </div>
    </div>
  );
};

export default AnimatedLoader;
