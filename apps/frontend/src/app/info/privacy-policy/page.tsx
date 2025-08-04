"use client"

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-[#f8fafc]">
        <main className="max-w-[600px] w-full mx-auto p-8 font-sans text-slate-800 rounded-2xl text-center">
          <h1 className="text-3xl font-extrabold text-[#4AAAFF] mb-4 tracking-wide text-center">
            Privacy Policy and Terms &amp; Conditions
          </h1>
          <div className="text-sm text-slate-500 mb-6">Effective Date: [Insert Date]</div>
          <p className="text-base mb-5">
            At <span className="font-bold text-[#4AAAFF]">MAMAGHADI.com</span>, your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services.
          </p>
          <h2 className="text-lg font-bold text-[#4AAAFF] mt-6 mb-2">1. Information We Collect</h2>
          <p className="mb-3">
            We collect the following types of information:
          </p>
          <ul className="mb-4 list-disc list-inside text-center">
            <li>
              <span className="font-semibold">Personal Information:</span> Name, phone number, email address, and any other information you provide during registration or trip inquiry.
            </li>
            <li>
              <span className="font-semibold">Usage Data:</span> Pages visited, search queries, and interactions on the platform.
            </li>
            <li>
              <span className="font-semibold">Location Data:</span> If enabled, we may use your location to improve trip matching and service relevance.
            </li>
          </ul>

          <h2 className="text-lg font-bold text-[#4AAAFF] mt-6 mb-2">2. How We Use Your Information</h2>
          <ul className="mb-4 list-disc list-inside text-center">
            <li>Facilitate communication between travelers and transporters.</li>
            <li>Display available trips and search results.</li>
            <li>Improve and personalize user experience.</li>
            <li>Send notifications or important service updates.</li>
            <li>Ensure security and prevent fraud.</li>
          </ul>

          <h2 className="text-lg font-bold text-[#4AAAFF] mt-6 mb-2">3. Information Sharing</h2>
          <p className="mb-3">
            We do not sell your personal information. However, we may share limited information with:
          </p>
          <ul className="mb-4 list-disc list-inside text-center">
            <li>Transporters or Travelers you choose to connect with.</li>
            <li>Third-party service providers for website hosting, analytics, or communication (under strict confidentiality).</li>
            <li>Law enforcement or regulators if required by law.</li>
          </ul>

          <h2 className="text-lg font-bold text-[#4AAAFF] mt-6 mb-2">4. Data Security</h2>
          <p className="mb-4">
            We use industry-standard encryption and security practices to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-lg font-bold text-[#4AAAFF] mt-6 mb-2">5. Cookies and Tracking</h2>
          <p className="mb-4">
            Our website uses cookies to remember preferences and improve user experience. You can modify your browser settings to manage cookie usage.
          </p>

          <h2 className="text-lg font-bold text-[#4AAAFF] mt-6 mb-2">6. Your Rights</h2>
          <ul className="mb-4 list-disc list-inside text-center">
            <li>Access or update your personal information.</li>
            <li>Request deletion of your account.</li>
            <li>Opt out of marketing communications.</li>
          </ul>

          <h2 className="text-lg font-bold text-[#4AAAFF] mt-6 mb-2">7. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. Changes will be posted on this page with a new effective date.
          </p>
        </main>
      </div>
      <Footer />
    </>
  );
}
