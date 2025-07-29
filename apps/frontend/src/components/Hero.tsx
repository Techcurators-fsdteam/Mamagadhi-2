import React, { useState } from 'react';
import Image from 'next/image';
import SearchBar from './SearchBar';
import FeatureSection from './FeatureSection';
import PopularRoutes from './PopularRoutes';

const Hero = () => {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <>
      {/* Hero image section */}
      <section className="w-full flex flex-col items-center bg-white pb-8 sm:pb-12">
        <div className="w-full max-w-6xl px-4 sm:px-8 mt-6 sm:mt-10 overflow-hidden">
          <div className="w-full rounded-xl overflow-hidden relative">
            <Image
              src="/hero.png"
              alt="Ride Sharing"
              width={1277}
              height={272}
              className="w-full object-cover rounded-xl hero-img-mobile"
              style={{
                aspectRatio: '1277/272',
                maxHeight: '420px',
                minHeight: '220px',
                height: 'clamp(220px, 45vw, 420px)',
              }}
            />
            <style>{`
              @media (max-width: 640px) {
                .hero-img-mobile {
                  aspect-ratio: 1/1.3 !important;
                  min-height: 320px !important;
                  max-height: 520px !important;
                  object-fit: cover;
                }
              }
            `}</style>
          </div>
        </div>

        {/* Search bar */}
        <div className="w-full flex justify-center mt-[-28px] z-10 px-4">
          <div className="w-full max-w-4xl">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Features section - FULL WIDTH */}
      <section className="w-screen bg-white ">
        <FeatureSection />
      </section>



      {/* Ride Sharing With Mamaghadi */}
      <section className="w-screen relative left-1/2 right-1/2 -mx-[50vw] bg-[#4AAEFF] py-6 sm:py-10 px-4 sm:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1 text-white">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-5 leading-tight">
              Ride Sharing With Mamaghadi?
            </h2>
            <p className="mb-6 max-w-lg text-sm sm:text-base md:text-lg leading-relaxed opacity-90">
              Mamaghadi is a flexible, community-driven ride-sharing platform connecting travelers with everyday people offering rides—bikes, cars, vans, or shared buses.
            </p>
            <button className="bg-white text-[#4AAEFF] px-8 py-3 rounded-full font-semibold shadow-md hover:bg-blue-50 transition text-base">
              Share a Ride
            </button>
          </div>
          <div className="flex-1 flex justify-center">
            <Image src="/hero2.svg" alt="Carpool" width={420} height={420} className="w-[280px] sm:w-[360px] md:w-[420px] h-auto" />
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section className="w-full bg-white py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 flex justify-center md:justify-start">
            <Image
              src="/hero3.png"
              alt="Stay Safe from Scams"
              width={280}
              height={280}
              className="w-[220px] sm:w-[300px] md:w-[360px] h-auto"
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#222] mb-5 leading-tight">
              Help us keep you safe from scams
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto md:mx-0 text-base sm:text-lg leading-relaxed">
              We&apos;re working hard to make Mamaghadi as secure as possible. Know how to avoid and report scams by following our safety guidelines.
            </p>
            <button className="bg-[#F8FAFF] text-[#4AAEFF] px-8 py-3 rounded-full font-semibold border border-[#4AAEFF] hover:bg-[#E6F2FF] transition-colors text-base">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Popular routes */}
      <PopularRoutes />

      {/* Help Centre */}
      <section className="w-full bg-white py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-4 text-[#222]">
            Ride-Sharing Help Centre
          </h2>
          <div className="flex justify-center mb-12">
            <div className="h-1 w-24 bg-[#4AAEFF] rounded-full"></div>
          </div>

          {/* Help Centre Cards with expandable descriptions */}
          {(() => {
            const helpItems = [
              {
                title: "How do I book a ride?",
                desc: "You can book ride on Mamaghadi.com. Simply search for your destination, choose the date you want to travel and pick the ride-share that suits you best! Some rides may require approval from the driver.",
              },
              {
                title: "How do I cancel my ride?",
                desc: "If you have a change of plans, you can always cancel your ride sharing from the &apos;Your rides&apos; section of our website. The sooner you cancel, the better. That way the driver has time to accept new passengers.",
              },
              {
                title: "How much does a ride-share cost?",
                desc: "The costs of a ridesharing ride can vary greatly, and depend on factors like distance, time of departure, the demand of that ride and more. It is also up to the driver to decide how much to charge.",
              },
              {
                title: "How do I publish a ride?",
                desc: "Offering a ride on Mamaghadi is easy. To publish your ride, use our website Mamaghadi.com. Indicate your departure and arrival points, the date and time of your departure, how many seats you have, and set your price.",
              },
              {
                title: "What are the benefits of travelling by Ride-sharing?",
                desc: "There are multiple advantages to ridesharing, over other means of transport. Travelling by ridesharing is usually more affordable, especially for longer distances. Ridesharing is also more eco-friendly and social!",
              },
              {
                title: "How do I start ride-sharing?",
                desc: "Ridesharing with Mamaghadi is super easy, and free! Simply sign up for an account and tell us some basic details about yourself. Once you have a Mamaghadi account, you can start booking or publishing rides.",
              },
            ];
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {helpItems.map((item, idx) => (
                  <div key={idx} className="bg-white px-2 sm:px-4 py-8 flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-semibold text-xl text-[#1A2A36] mb-2 leading-snug">
                        {item.title}
                      </h3>
                      <p className={`text-gray-400 text-lg leading-relaxed mb-4 transition-all duration-200 ${expanded === idx ? '' : 'line-clamp-2'}`}>{item.desc}</p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        className="text-[#2196f3] text-base font-medium hover:underline transition focus:outline-none"
                        onClick={() => setExpanded(expanded === idx ? null : idx)}
                        aria-expanded={expanded === idx}
                      >
                        {expanded === idx ? 'Read less' : 'Read more'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div className="flex justify-center mt-12">
            <a href="#" className="bg-[#4AAEFF] hover:bg-[#2196f3] text-white px-7 py-3 rounded-full font-semibold text-base sm:text-lg transition-all">
              Read our Help Centre
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
