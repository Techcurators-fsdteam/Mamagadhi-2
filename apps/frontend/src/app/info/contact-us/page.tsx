"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Google Form settings
 * ───────────────────────────────────────────
 * action URL  : https://docs.google.com/forms/u/0/d/e/1FAIpQLSe_uvjl5cR2yliB4VicZ0FerL7cZ9EDBGpc3cAe-pNcC3SxtA/formResponse
 * entry IDs   : Name  → entry.1756287264
 *               Email → entry.849535191
 *               Phone → entry.467055906
 *               Query → entry.1398166451
 */
const GOOGLE_FORM_ACTION =
  "https://docs.google.com/forms/u/0/d/e/1FAIpQLSe_uvjl5cR2yliB4VicZ0FerL7cZ9EDBGpc3cAe-pNcC3SxtA/formResponse";

export default function ContactUsPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    query: "",
  });
  const [submitted, setSubmitted] = useState(false);

  /** keep two-way binding so the UI is controlled */
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  /**
   * Convert the state object → URL-encoded body and POST
   * Use mode:"no-cors" so the browser doesn’t block the request;
   * we can’t read Google’s response, but that’s fine—just flip the UI.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const body = new URLSearchParams({
      "entry.1756287264": form.name,
      "entry.849535191": form.email,
      "entry.467055906": form.contact,
      "entry.1398166451": form.query,
    });

    try {
      await fetch(GOOGLE_FORM_ACTION, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Unable to submit form", err);
      // Optional: show an error toast or fallback UI here
    }
  }

  return (
    <>
      <Navbar />

      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-white">
        <main className="max-w-[600px] w-full mx-auto p-8 font-sans text-slate-800 rounded-2xl text-center">
          <h1 className="text-4xl font-extrabold text-[#4AAAFF] mb-4 tracking-wide text-center">
            Contact Us
          </h1>
          <p className="mb-7 text-base text-slate-600">
            We'd love to hear from you! Fill out the form below and we'll get back to you soon.
          </p>

          <div className="bg-white rounded-xl shadow p-6 mb-8">
            {!submitted ? (
              <form
                className="space-y-5"
                onSubmit={handleSubmit}
                autoComplete="off"
              >
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-[#e6f0fa] focus:border-[#4AAAFF] focus:ring-2 focus:ring-[#4AAAFF]/30 outline-none transition text-base bg-[#f8fafc] placeholder:text-slate-400 text-left"
                />

                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email ID"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-[#e6f0fa] focus:border-[#4AAAFF] focus:ring-2 focus:ring-[#4AAAFF]/30 outline-none transition text-base bg-[#f8fafc] placeholder:text-slate-400 text-left"
                />

                <input
                  type="tel"
                  name="contact"
                  placeholder="Contact Number (optional)"
                  value={form.contact}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-[#e6f0fa] focus:border-[#4AAAFF] focus:ring-2 focus:ring-[#4AAAFF]/30 outline-none transition text-base bg-[#f8fafc] placeholder:text-slate-400 text-left"
                />

                <textarea
                  name="query"
                  required
                  placeholder="Your Query"
                  value={form.query}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-[#e6f0fa] focus:border-[#4AAAFF] focus:ring-2 focus:ring-[#4AAAFF]/30 outline-none transition text-base bg-[#f8fafc] placeholder:text-slate-400 text-left resize-none"
                />

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-[#4AAAFF] text-white font-bold text-base shadow hover:bg-[#38a0e6] transition"
                >
                  Send Message
                </button>
              </form>
            ) : (
              <div className="text-green-600 font-semibold text-lg py-8">
                Thank you for reaching out! We'll get back to you soon.
              </div>
            )}
          </div>

          {/* Direct-contact section unchanged */}
          <section className="mt-8 pt-4 border-t border-[#e6f0fa]">
            <h2 className="text-base font-bold text-[#4AAAFF] mb-2 tracking-wide">
              Or contact us directly
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

