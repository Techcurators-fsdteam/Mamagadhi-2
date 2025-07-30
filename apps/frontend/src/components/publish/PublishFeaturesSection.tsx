'use client';

import React from 'react';

const PublishFeaturesSection: React.FC = () => {
  return (
    <>
      {/* Section 2: Drive. Share. Save. */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            Drive. <span className="text-[#4AAAFF]">Share.</span> Save.
          </h2>
        </div>
      </section>

      {/* Section 3: Three-column Info */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Drive.</h3>
              <p className="text-gray-600 leading-relaxed">
                Keep your plans! Hit the road just as you anticipated and make the most of your vehicle's empty seats.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4 text-[#4AAAFF]">Share.</h3>
              <p className="text-gray-600 leading-relaxed">
                Travel with good company. Share a memorable ride with travellers from all walks of life.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Save.</h3>
              <p className="text-gray-600 leading-relaxed">
                Tolls, petrol, electricity... Easily divvy up all the costs with other passengers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PublishFeaturesSection;
