"use client";
import React from "react";
import { useInView } from "react-intersection-observer";

const routes = [
  {
    label: "New Delhi → Chandigarh",
    height: "60px",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="mr-2">
        <path d="M12 2C13.1 2 14 2.9 14 4V6H10V4C10 2.9 10.9 2 12 2ZM6 8V22H18V8H6ZM8 10H16V20H8V10Z" fill="#222" />
      </svg>
    ),
  },
  {
    label: "New Delhi → Jaipur",
    height: "60px",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="mr-2">
        <path d="M4 12L12 4L20 12H4ZM4 14H20V20H4V14Z" fill="#222" />
      </svg>
    ),
  },
  {
    label: "New Delhi → Agra",
    height: "60px",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" className="mr-2">
        <path d="M12 2L14 6H10L12 2ZM6 8L8 12H4L6 8ZM18 8L20 12H16L18 8ZM2 14H22V22H2V14ZM10 14V18H14V14H10Z" fill="#222" />
      </svg>
    ),
  },
];

const PopularRoutes = () => {
  const { ref, inView } = useInView({
    threshold: 0.2, // Trigger when 20% of the section is visible
    triggerOnce: true, // Only animate once
  });

  return (
    <section ref={ref} className="w-screen relative left-1/2 right-1/2 -mx-[50vw] bg-[#4AAEFF] py-8 px-4 sm:px-8 overflow-hidden">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-5">
        <div
          className={`text-center transition-all duration-500 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-wide">
            Plan Your Ride Now
          </h2>
          <p className="text-white text-base sm:text-sm opacity-70">
            Choose from our most popular routes
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full mt-4">
          {routes.map((route, index) => (
            <button
              key={route.label}
              className={`bg-white text-[#222] rounded-xl px-6 text-base sm:text-lg font-medium flex items-center justify-center w-full md:w-[300px] transition-all duration-500 ease-out group whitespace-nowrap ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{
                height: inView ? route.height : "0px",
                transitionDelay: `${index * 150}ms`,
              }}
            >
              <div className="flex items-center justify-center gap-2">
                {route.svg}
                <span className="truncate">{route.label}</span>
              </div>
            </button>
          ))}
        </div>

        <a
          href="#"
          className={`text-white text-sm hover:underline mt-3 transition-all duration-500 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          See all available rides
        </a>
      </div>
    </section>
  );
};

export default PopularRoutes;
