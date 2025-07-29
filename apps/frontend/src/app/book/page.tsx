'use client';

import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../lib/auth';
import { useRouter } from 'next/navigation';

interface RideResult {
  id: number;
  origin: string;
  destination: string;
  date: string;
  seats: number;
  price: number;
}

function BookRide() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState({ origin: '', destination: '', date: '' });
  const [results, setResults] = useState<RideResult[]>([]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (!loading && !user) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch({ ...search, [e.target.name]: e.target.value });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder: set dummy results
    setResults([
      { id: 1, origin: 'City A', destination: 'City B', date: search.date, seats: 3, price: 200 },
      { id: 2, origin: 'City A', destination: 'City C', date: search.date, seats: 2, price: 150 },
    ]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 flex flex-col justify-center items-center w-full py-10 px-2 sm:px-6">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow p-6 md:p-10">
          <h1 className="text-2xl font-bold mb-2">Book a Ride</h1>
          <p className="mb-6 text-gray-600">Search for available rides below.</p>
          <form className="space-y-4 bg-white p-0" onSubmit={handleSearch}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
              <input type="text" name="origin" value={search.origin} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Enter starting point" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <input type="text" name="destination" value={search.destination} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="Enter destination" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" name="date" value={search.date} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded" />
            </div>
            <button type="submit" className="w-full bg-[#4AAAFF] text-white py-2 rounded font-semibold hover:bg-blue-600 transition">Search Rides</button>
          </form>
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Available Rides</h2>
            {results.length === 0 ? (
              <div className="text-gray-500">No rides found. Try searching above.</div>
            ) : (
              <ul className="space-y-4">
                {results.map((ride) => (
                  <li key={ride.id} className="border rounded p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold">{ride.origin} 192 {ride.destination}</div>
                      <div className="text-sm text-gray-600">Date: {ride.date}</div>
                      <div className="text-sm text-gray-600">Seats: {ride.seats}</div>
                    </div>
                    <div className="mt-2 sm:mt-0 font-bold text-[#4AAAFF]">0b9{ride.price} / seat</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default BookRide;