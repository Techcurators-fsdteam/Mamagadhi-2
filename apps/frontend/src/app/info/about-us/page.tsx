"use client"

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, MapPin, Shield, Clock } from "lucide-react";

export default function AboutUsPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-white">
        <main className="max-w-[600px] w-full mx-auto p-8 font-sans text-slate-800 rounded-2xl text-center">
          <h1 className="text-4xl font-extrabold text-[#4AAAFF] mb-4 tracking-wide text-center">
            About Us
          </h1>
          <p className="text-lg mb-5">
            Welcome to{" "}
            <strong className="text-[#4AAAFF]">MAMAGHADI.com</strong> – your
            trusted travel and transport companion.
          </p>
          <p className="text-base mb-4">
            At Mamaghadi.com, we believe travel should be simple, seamless, and
            stress-free. That’s why we’ve created a powerful web platform that
            connects travelers and transport providers in real time. Whether you're
            planning a short city trip or a long-distance journey, we bring all
            your transport options together on one easy-to-use interface.
          </p>
          <p className="text-base mb-7">
            Our goal is to empower transporters to share their routes and connect
            with potential passengers, while giving travelers the freedom to
            search, compare, and contact transport providers directly. No
            middlemen, no confusion – just travel made easy.
          </p>
          <section className="mt-7 pt-4 border-t border-[#e6f0fa]">
            <h2 className="text-base font-bold text-[#4AAAFF] mb-2 tracking-wide">
              Contact
            </h2>
            <div className="mb-1.5 text-base">
              <span className="font-semibold">Phone:</span>{" "}
              <a
                href="tel:+919963477751"
                className="text-[#4AAAFF] underline font-semibold tracking-wide"
              >
                +91 99634 77751
              </a>
            </div>
            <div className="text-base">
              <span className="font-semibold">Email:</span>{" "}
              <a
                href="mailto:venuch@mamaghadi.com"
                className="text-[#4AAAFF] underline font-semibold tracking-wide"
              >
                venuch@mamaghadi.com
              </a>
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}