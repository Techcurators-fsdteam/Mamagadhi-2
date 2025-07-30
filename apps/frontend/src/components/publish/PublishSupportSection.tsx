'use client';

import React from 'react';

const PublishSupportSection: React.FC = () => {
  return (
    <section className="py-20 bg-[#4AAAFF]">
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <h2 className="text-3xl lg:text-4xl font-bold text-white text-center mb-16">
          We're here every step of the way
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Chat bubble icon */}
          <div className="text-center text-white">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.04 1.05 4.39L2 22l5.61-1.05C9.96 21.64 11.46 22 13 22h-.01c5.52 0 9.99-4.48 9.99-10S17.51 2 11.99 2H12zm0 18c-1.1 0-2.18-.25-3.15-.74L8 20l.74-.85C7.25 18.18 6 16.18 6 14c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-4">At your service 24/7</h3>
            <p className="text-white/90 leading-relaxed">
              Our team is at your disposal to answer any questions by email or social media. You can also have a live chat directly with experienced members.
            </p>
          </div>
          
          {/* Car icon */}
          <div className="text-center text-white">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-4">Drive on your terms</h3>
            <p className="text-white/90 leading-relaxed">
              Offer rides in the vehicle of your choice: bike, car, van, or bus. Set your own schedule, choose your co-travelers, and stay in control of your route, timing, and cost-sharing without restrictions.
            </p>
          </div>
          
          {/* Shield with checkmark icon */}
          <div className="text-center text-white">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-4">100% secure information</h3>
            <p className="text-white/90 leading-relaxed">
              Our team is dedicated to the protection of your data, which is always 100% confidential thanks to monitoring tools, secure navigation and encrypted data.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublishSupportSection;
