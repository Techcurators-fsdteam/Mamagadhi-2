import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full bg-[#4AAEFF] text-white px-4 sm:px-8 pt-10 pb-8" style={{ minHeight: 200 }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Top Routes */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Top Ride Sharing Routes</h3>
          <ul className="space-y-2 text-sm sm:text-base">
            <li>Delhi → Chandigarh</li>
            <li>Mumbai → Pune</li>
            <li>Kanpur → Lucknow</li>
            <li>Bengaluru → Chennai</li>
            <li>Pune → Mumbai</li>
            <li>All carpool routes</li>
            <li>All carpool destinations</li>
          </ul>
        </div>

        {/* About Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4">About</h3>
          <ul className="space-y-2 text-sm sm:text-base">
            <li>How It Works</li>
            <li>About Us</li>
            <li>Help Centre</li>
            <li>Press</li>
          </ul>
        </div>

        {/* Language & Socials */}
        <div className="flex flex-col items-start md:items-end">
          <div className="bg-white text-[#4AAEFF] rounded-full px-5 py-2 text-sm font-medium mb-4">
            Language - English (India)
          </div>
          <div className="flex gap-4">
            <a href="#" aria-label="Facebook" className="hover:opacity-80 transition">
              <FacebookIcon />
            </a>
            <a href="#" aria-label="X (Twitter)" className="hover:opacity-80 transition">
              <TwitterIcon />
            </a>
            <a href="#" aria-label="YouTube" className="hover:opacity-80 transition">
              <YouTubeIcon />
            </a>
            <a href="#" aria-label="Instagram" className="hover:opacity-80 transition">
              <InstagramIcon />
            </a>
          </div>
        </div>

      </div>
      <div className="mt-8 text-center text-xs text-white/80">
        © {new Date().getFullYear()} Your Company Name. All rights reserved.
      </div>
    </footer>
  );
};

const FacebookIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#1877F3" xmlns="http://www.w3.org/2000/svg" className="bg-white rounded-full p-1">
    <path d="M22 12C22 6.48 17.52 2 12 2S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8v-6.93H8v-2.87h2V9.41c0-2 1.2-3.11 3.04-3.11.88 0 1.8.16 1.8.16v1.98h-1.01c-1 0-1.31.62-1.31 1.25v1.5h2.23l-.36 2.87h-1.87V21.8c4.56-.93 8-4.96 8-9.8z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg" className="bg-white rounded-full p-1">
    <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.28 4.28 0 0 0 1.88-2.37 8.6 8.6 0 0 1-2.71 1.03A4.26 4.26 0 0 0 16.2 4c-2.36 0-4.28 1.92-4.28 4.29 0 .34.04.67.11.99A12.1 12.1 0 0 1 3.15 5.17a4.3 4.3 0 0 0 1.32 5.72 4.21 4.21 0 0 1-1.94-.54v.05c0 2.01 1.43 3.68 3.33 4.07-.35.1-.72.16-1.1.16-.27 0-.53-.03-.79-.07.53 1.65 2.08 2.85 3.92 2.89a8.55 8.55 0 0 1-5.3 1.83c-.34 0-.68-.02-1.01-.06A12.08 12.08 0 0 0 8.29 21c7.55 0 11.68-6.26 11.68-11.68 0-.18 0-.35-.01-.53A8.18 8.18 0 0 0 22.46 6z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#FF0000" xmlns="http://www.w3.org/2000/svg" className="bg-white rounded-full p-1">
    <path d="M21.8 8s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C16.6 5 12 5 12 5s-4.6 0-6.9.1c-.5 0-1.4.1-2.1.9C2.4 6.5 2.2 8 2.2 8S2 9.6 2 11.3v1.5C2 14.4 2.2 16 2.2 16s.2 1.5.8 2.1c.8.8 1.9.8 2.4.9 1.8.1 7.6.1 7.6.1s4.6 0 6.9-.1c.5 0 1.4-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.6.2-3.3v-1.5C22 9.6 21.8 8 21.8 8zM9.8 14.6v-5.2l5 2.6-5 2.6z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg" className="bg-white rounded-full p-1">
    <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm5.25-.75a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5z" />
  </svg>
);

export default Footer;
