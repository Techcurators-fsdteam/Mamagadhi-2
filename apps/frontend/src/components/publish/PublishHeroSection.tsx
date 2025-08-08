'use client';

import React from 'react';
import PublishSearchForm from './PublishSearchForm';
import Image from 'next/image';

interface FormData {
  passengers: string;
  vehicleType: string;
  origin: string;
  destination: string;
}

interface PublishHeroSectionProps {
  formData: FormData;
  onInputChange: (field: string, value: string) => void;
}

const PublishHeroSection: React.FC<PublishHeroSectionProps> = ({ formData, onInputChange }) => {
  return (
    <section
      className="w-full relative py-12 sm:py-16 lg:py-20"
      style={{
        backgroundImage: "url('/publish.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.9,
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 z-0" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
            Become a <span className="text-white">Mamaghadi</span> Driver
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-white/90 font-medium max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2">
            Transform your daily commute into earnings. Share rides, save costs, and connect with fellow travelers.
          </p>
        </div>

        {/* Wider Search Form Centered */}
        <div className="flex justify-center">
          <div className="w-full max-w-lg">
            <PublishSearchForm formData={formData} onInputChange={onInputChange} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublishHeroSection;
