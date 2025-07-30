'use client';

import React from 'react';
import Image from 'next/image';
import PublishSearchForm from './PublishSearchForm';

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
    <section className="w-full bg-gradient-to-br from-[#4AAAFF] to-[#6BB6FF] py-8 sm:py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Heading */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-3 sm:mb-4">
            Become a <span className="text-white">Mamaghadi</span> Driver
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-white/95 font-medium max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2">
            Transform your daily commute into earnings. Share rides, save costs, and connect with fellow travelers.
          </p>
        </div>
        
        {/* Content Container with centered design */}
        <div className="relative min-h-[320px] sm:min-h-[340px] lg:min-h-[360px] flex items-center justify-center">
          {/* Background Image - centered */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-6 lg:gap-8">
            {/* Search Menu - left side with matched height */}
            <div className="relative z-10 w-80 sm:w-96 h-[300px] sm:h-[320px] lg:h-[340px] flex items-center">
              <PublishSearchForm formData={formData} onInputChange={onInputChange} />
            </div>
            
            {/* Image - right side with matched height */}
            <div className="relative w-96 sm:w-[500px] lg:w-[600px] h-[300px] sm:h-[320px] lg:h-[340px] flex items-center">
              <Image 
                src="/publish.png" 
                alt="Publish Ride" 
                width={800}
                height={340}
                className="w-full h-full rounded-xl object-cover shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublishHeroSection;
