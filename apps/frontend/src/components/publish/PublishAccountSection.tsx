'use client';

import React from 'react';

const PublishAccountSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left: Image - Hidden on mobile, visible on lg+ */}
          <div className="hidden lg:flex justify-center lg:justify-start">
            <div className="w-full max-w-md">
              <img 
                src="/publish2.svg" 
                alt="Create account illustration" 
                className="w-full h-full rounded-xl"
              />
            </div>
          </div>
          
          {/* Right: Steps */}
          <div className="space-y-6 sm:space-y-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center lg:text-left">
              Create Your Account On <span className="text-[#4AAAFF]">Mamaghadi</span>
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#4AAAFF] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Create an account</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Add your profile picture, a few words about you and your phone number to increase trust between members.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#4AAAFF] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Publish your ride</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Indicate departure and arrival points, the date of the ride and check our recommended price to increase your chances of getting your first passengers and ratings.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#4AAAFF] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Accept booking requests</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Review passenger profiles and accept their requests to ride with you. That's how easy it is to start saving on travel costs!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublishAccountSection;
