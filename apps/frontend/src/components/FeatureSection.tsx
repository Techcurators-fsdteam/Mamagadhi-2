"use client";

import { motion } from "framer-motion";
import { Check, CreditCard, Rocket } from "lucide-react";
import React from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

interface Feature {
  iconName: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    iconName: "CreditCard",
    title: "Affordable Rides",
    description: "Find the perfect bus or carpool ride at prices that won't break the bank.",
  },
  {
    iconName: "Check",
    title: "Travel with Confidence",
    description: "Verified members and partners for safe, secure journeys every time.",
  },
  {
    iconName: "Rocket",
    title: "Fast & Easy Booking",
    description: "Book your ride in just a few taps with our simple, intuitive app.",
  },
];

const getIcon = (iconName: string): React.ReactNode => {
  const iconProps = { size: 48, color: "#4AAEFF" };
  
  switch (iconName) {
    case "CreditCard":
      return React.createElement(CreditCard, iconProps);
    case "Check":
      return React.createElement(Check, iconProps);
    case "Rocket":
      return React.createElement(Rocket, iconProps);
    default:
      return null;
  }
};const FeatureSection = () => {
  return (
    <section className="w-full flex flex-col items-center bg-white py-14 px-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full text-center">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
            className="flex flex-col items-center"
          >
            {getIcon(feature.iconName) as any}
            <h3 className="font-semibold text-lg mt-4 text-[#222]">{feature.title}</h3>
            <p className="text-gray-500 text-sm mt-2 max-w-xs">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeatureSection;
