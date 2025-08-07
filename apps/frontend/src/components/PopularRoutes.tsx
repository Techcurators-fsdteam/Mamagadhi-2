"use client";
import React from "react";
import { useInView } from "react-intersection-observer";

const routes = [
  {
    label: "Delhi → Chandigarh",
    height: "60px",
  },
  {
    label: "Goa → Mumbai",
    height: "60px",
  },
  {
    label: "Chennai → Gujarat",
    height: "60px",
  },
];

const PopularRoutes = () => {
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section
      ref={ref}
      className="w-screen relative left-1/2 right-1/2 -mx-[50vw] bg-[#4AAEFF] py-12 px-4 sm:px-8 overflow-hidden"
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-8">
        <div
          className={`text-center transform transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Plan Your Ride Now
          </h2>
          <p className="mt-2 text-white text-sm sm:text-base opacity-90">
            Explore the most popular routes in India
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center w-full mt-2">
          {routes.map((route, index) => (
            <button
              key={route.label}
              className={`bg-white text-[#222] rounded-xl px-6 py-4 shadow-md hover:shadow-lg transform transition-all duration-700 ease-out group focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#4AAEFF] w-full md:w-[280px] whitespace-nowrap ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{
                height: inView ? route.height : "0px",
                transitionDelay: `${index * 150}ms`,
              }}
            >
              <div className="flex items-center justify-center gap-2">
                {/* Optional SVG Icon Placeholder */}
                {/* <YourIcon /> */}
                <span className="truncate text-base sm:text-lg font-medium">
                  {route.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularRoutes;
