'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

function PublishRide() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    passengers: '',
    vehicleType: ''
  });
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);
  const [openPassengers, setOpenPassengers] = useState(false);
  const [openVehicle, setOpenVehicle] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (user?.uid && supabase) {
        try {
          const { data } = await supabase
            .from('driver_profiles')
            .select('id_verified, dl_verified')
            .eq('user_profile_id', user.uid)
            .single();
          
          if (data) {
            // Check if both are verified
            const isFullyVerified = data.id_verified && data.dl_verified;
            if (!isFullyVerified) {
              alert('You need both ID and driving license verified by admin to publish rides. Please complete your verification in the profile page.');
              router.replace('/profile');
            }
          } else {
            alert('Driver profile not found. Please complete your profile setup.');
            router.replace('/profile');
          }
        } catch (error) {
          console.error('Error checking verification status:', error);
          alert('Error checking verification status. Please try again.');
          router.replace('/profile');
        } finally {
          setVerificationLoading(false);
        }
      }
    };

    if (user && !loading) {
      checkVerificationStatus();
    }
  }, [user, loading, router]);

  if (loading || verificationLoading || !user) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4AAAFF] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Dummy data from SearchBar
  const cities = [
    'New Delhi',
    'Mumbai', 
    'Bangalore',
    'Chennai',
    'Hyderabad',
    'Kolkata',
    'Pune',
    'Ahmedabad',
  ];
  const vehicleTypes = ['Car', 'Bike', 'Van', 'Bus'];
  const passengerCounts = [1, 2, 3, 4, 5, 6];

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isFormValid = () => {
    return formData.from && formData.to && formData.passengers && formData.vehicleType;
  };

  // Removed unused showDriverPopup, setShowDriverPopup

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <Navbar />
      {/* Hero Section */}
      <section
        className="w-full flex justify-center items-center mt-4"
        style={{ background: 'linear-gradient(135deg, #4AAAFF 0%, #6BB6FF 100%)', minHeight: 650 }}
      >
        <div className="w-full max-w-7xl flex flex-col items-center justify-center h-full px-4 md:px-8 py-12">
          {/* Heading on top */}
          <div className="text-center mb-16">
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              Become a Mamaghadi driver
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 font-medium max-w-4xl leading-relaxed">
              Save on travel costs by sharing your ride with passengers
            </p>
          </div>
          
          {/* Content Container */}
          <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-12 lg:gap-16">
            {/* Left side - Interactive Menu */}
            <div className="w-full lg:w-auto flex-shrink-0">
              <div className="bg-white rounded-3xl shadow-2xl p-6 mx-auto h-full flex flex-col justify-center" style={{ width: '100%', maxWidth: 480, height: 320 }}>
                <div className="space-y-3">
                  {/* From - Searchable */}
                  <div className="relative">
                    <Popover open={openFrom} onOpenChange={setOpenFrom}>
                      <PopoverTrigger asChild>
                        <div className="flex items-center space-x-3 p-2.5 border-2 border-gray-200 rounded-xl hover:border-[#4AAAFF] transition-all duration-200 cursor-pointer">
                          <div className="w-3 h-3 rounded-full border-2 border-gray-400"></div>
                          <div className="flex-1 text-left">
                            <span className="text-base font-medium text-gray-700">
                              {formData.from || "Delhi"}
                            </span>
                          </div>
                          {/* Swap icon */}
                          <button 
                            className="ml-auto p-1.5 hover:bg-blue-50 rounded-full transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({
                                ...prev,
                                from: prev.to,
                                to: prev.from
                              }));
                            }}
                          >
                            <svg width="16" height="16" fill="none" stroke="#4AAAFF" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                            </svg>
                          </button>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search cities..." className="h-12" />
                          <CommandEmpty>No city found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {cities.map((city) => (
                              <CommandItem
                                key={city}
                                value={city}
                                onSelect={() => {
                                  handleInputChange('from', city);
                                  setOpenFrom(false);
                                }}
                                className="text-lg py-3"
                              >
                                {city}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* To - Searchable */}
                  <div className="relative">
                    <Popover open={openTo} onOpenChange={setOpenTo}>
                      <PopoverTrigger asChild>
                        <div className="flex items-center space-x-3 p-2.5 border-2 border-gray-200 rounded-xl hover:border-[#4AAAFF] transition-all duration-200 cursor-pointer">
                          <div className="w-3 h-3 rounded-full border-2 border-gray-400"></div>
                          <div className="flex-1 text-left">
                            <span className="text-base font-medium text-gray-700">
                              {formData.to || "Jaipur"}
                            </span>
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search cities..." className="h-12" />
                          <CommandEmpty>No city found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {cities.filter(city => city !== formData.from).map((city) => (
                              <CommandItem
                                key={city}
                                value={city}
                                onSelect={() => {
                                  handleInputChange('to', city);
                                  setOpenTo(false);
                                }}
                                className="text-lg py-3"
                              >
                                {city}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Passengers - Searchable */}
                  <div className="relative">
                    <Popover open={openPassengers} onOpenChange={setOpenPassengers}>
                      <PopoverTrigger asChild>
                        <div className="flex items-center space-x-3 p-2.5 border-2 border-gray-200 rounded-xl hover:border-[#4AAAFF] transition-all duration-200 cursor-pointer">
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-400">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z"/>
                          </svg>
                          <div className="flex-1 text-left">
                            <span className="text-base font-medium text-gray-700">
                              {formData.passengers ? `${formData.passengers} ${formData.passengers === '1' ? 'passenger' : 'passengers'}` : "2 passengers"}
                            </span>
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search passenger count..." className="h-12" />
                          <CommandEmpty>No option found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {passengerCounts.map((count) => (
                              <CommandItem
                                key={count}
                                value={count.toString()}
                                onSelect={() => {
                                  handleInputChange('passengers', count.toString());
                                  setOpenPassengers(false);
                                }}
                                className="text-lg py-3"
                              >
                                {count} {count === 1 ? 'passenger' : 'passengers'}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Vehicle Type - Searchable */}
                  <div className="relative">
                    <Popover open={openVehicle} onOpenChange={setOpenVehicle}>
                      <PopoverTrigger asChild>
                        <div className="flex items-center space-x-3 p-2.5 border-2 border-gray-200 rounded-xl hover:border-[#4AAAFF] transition-all duration-200 cursor-pointer">
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-gray-400">
                            <rect x="3" y="11" width="18" height="6" rx="2"/>
                            <rect x="7" y="7" width="10" height="4" rx="2"/>
                          </svg>
                          <div className="flex-1 text-left">
                            <span className="text-base font-medium text-gray-700">
                              {formData.vehicleType || "Vehicle type"}
                            </span>
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search vehicle types..." className="h-12" />
                          <CommandEmpty>No vehicle type found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {vehicleTypes.map((type) => (
                              <CommandItem
                                key={type}
                                value={type}
                                onSelect={() => {
                                  handleInputChange('vehicleType', type);
                                  setOpenVehicle(false);
                                }}
                                className="text-lg py-3"
                              >
                                {type}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Button */}
                  <div className="pt-2">
                    <Button 
                      className={`w-full py-2.5 text-base rounded-xl font-semibold text-white shadow-lg transition-all ${
                        isFormValid() 
                          ? 'bg-[#4AAAFF] hover:bg-blue-600' 
                          : 'bg-gray-400 hover:bg-gray-500'
                      }`}
                      size="lg"
                      disabled={!isFormValid()}
                    >
                      {isFormValid() ? 'Publish a ride' : 'Ride not available'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Image */}
            <div className="w-full lg:flex-1 flex justify-center items-center">
              <div className="relative w-full max-w-4xl h-full flex items-center justify-center" style={{ height: 320 }}>
                <Image 
                  src="/publish.png" 
                  alt="Publish Ride" 
                  width={640}
                  height={320}
                  className="w-full h-full rounded-3xl object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Drive. Share. Save. */}
      <section className="w-full flex justify-center items-center" style={{height: 74, padding: '16px 24px'}}>
        <div className="w-full max-w-screen-xl flex justify-center">
          <h2 className="text-3xl font-bold text-center">
            Drive. <span className="text-[#4AAAFF]">Share.</span> Save.
          </h2>
        </div>
      </section>

      {/* Section 3: Three-column Info */}
      <section className="w-full flex justify-center items-center" style={{height: 188, padding: '48px 452px'}}>
        <div className="w-full max-w-screen-xl grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center md:text-left">
            <div className="font-bold mb-1">Drive.</div>
            <div className="text-gray-500 text-sm">Keep your plans! Hit the road just as you anticipated and make the most of your vehicle&apos;s empty seats.</div>
          </div>
          <div className="text-center md:text-left">
            <div className="font-bold mb-1 text-[#4AAAFF]">Share.</div>
            <div className="text-gray-500 text-sm">Travel with good company. Share a memorable ride with travellers from all walks of life.</div>
          </div>
          <div className="text-center md:text-left">
            <div className="font-bold mb-1">Save.</div>
            <div className="text-gray-500 text-sm">Tolls, petrol, electricity... Easily divvy up all the costs with other passengers.</div>
          </div>
        </div>
      </section>

      {/* Section 4: Create Your Account On Mamaghadi */}
      <section className="w-full flex justify-center items-center" style={{height: 464, padding: '32px 24px'}}>
        <div className="w-full max-w-screen-xl flex flex-col md:flex-row items-center gap-10">
          {/* Left: Large gray box */}
          <div className="flex-1 flex justify-center items-center">
            <div className="bg-gray-300 rounded-xl" style={{width: 400, height: 260}}></div>
          </div>
          {/* Right: Steps */}
          <div className="flex-1 flex flex-col justify-center gap-6">
            <h2 className="text-3xl font-bold mb-4 text-left">Create Your Account On <span className="text-[#4AAAFF]">Mamaghadi</span></h2>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl"> 464</span>
                <div>
                  <div className="font-bold text-left">Create an account</div>
                  <div className="text-gray-500 text-sm text-left">Add your profile picture, a few words about you and your phone number to increase trust between members.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl"> 697</span>
                <div>
                  <div className="font-bold text-left">Publish your ride</div>
                  <div className="text-gray-500 text-sm text-left">Indicate departure and arrival points, the date of the ride and check our recommended price to increase your chances of getting your first passengers and ratings.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl"> 6a1</span>
                <div>
                  <div className="font-bold text-left">Accept booking requests</div>
                  <div className="text-gray-500 text-sm text-left">Review passenger profiles and accept their requests to ride with you. That&apos;s how easy it is to start saving on travel costs!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Blue container - We're here every step of the way */}
      <section className="w-full flex justify-center items-center" style={{height: 333, background: '#4AAAFF'}}>
        <div className="w-full max-w-screen-xl flex flex-col items-center justify-center h-full px-4 md:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">We&apos;re here every step of the way</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
            {/* Chat bubble icon */}
            <div className="text-center text-white">
              <div className="flex justify-center mb-4">
                <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.04 1.05 4.39L2 22l5.61-1.05C9.96 21.64 11.46 22 13 22h-.01c5.52 0 9.99-4.48 9.99-10S17.51 2 11.99 2H12zm0 18c-1.1 0-2.18-.25-3.15-.74L8 20l.74-.85C7.25 18.18 6 16.18 6 14c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">At your service 24/7</h3>
              <p className="text-sm text-white/90">Our team is at your disposal to answer any questions by email or social media. You can also have a live chat directly with experienced members.</p>
            </div>
            
            {/* Car icon */}
            <div className="text-center text-white">
              <div className="flex justify-center mb-4">
                <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Drive on your terms</h3>
              <p className="text-sm text-white/90">Offer rides in the vehicle of your choice: bike, car, van, or bus. Set your own schedule, choose your co-travelers, and stay in control of your route, timing, and cost-sharing without restrictions.</p>
            </div>
            
            {/* Shield with checkmark icon */}
            <div className="text-center text-white">
              <div className="flex justify-center mb-4">
                <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">100% secure information</h3>
              <p className="text-sm text-white/90">Our team is dedicated to the protection of your data, which is always 100% confidential thanks to monitoring tools, secure navigation and encrypted data.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Section 6: Help Centre FAQ */}
      <section className="w-full flex justify-center items-center py-16 bg-white">
        <div className="w-full max-w-4xl px-4 md:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need as a driver, in our Help Centre
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* FAQ Item 1 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-3">
                How do I set the passenger contribution for my ride?
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                We recommend a contribution per passenger on your rides. These suggestions help you set fair contributions for your rides (those most likely to get your seats filled!), but can still be adjusted...
                {expandedFaq === 0 && (
                  <span>
                    {" "}The recommended price is calculated based on distance, fuel costs, tolls, and vehicle wear. You have complete freedom to adjust this amount up or down based on your preferences. Higher prices may result in fewer booking requests, while lower prices tend to attract more passengers. Consider factors like vehicle comfort, route popularity, and travel time when setting your price.
                  </span>
                )}
              </p>
              <button 
                onClick={() => toggleFaq(0)}
                className="text-[#4AAAFF] text-sm font-medium hover:underline"
              >
                {expandedFaq === 0 ? 'Read less' : 'Read more'}
              </button>
            </div>

            {/* FAQ Item 2 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-3">
                When do I get my money?
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                We send your money 48 hours after the ride if you travelled as planned. You&apos;ll get your money 1 to 5 weekdays (not counting weekends and holidays) after we send it...
                {expandedFaq === 1 && (
                  <span>
                    {" "}Payment processing times may vary depending on your bank and payment method. We use secure payment systems to ensure your earnings are transferred safely. If there are any issues with the ride (no-shows, cancellations, disputes), payment may be delayed until the matter is resolved. You can track all your earnings and payment history in your driver dashboard.
                  </span>
                )}
              </p>
              <button 
                onClick={() => toggleFaq(1)}
                className="text-[#4AAAFF] text-sm font-medium hover:underline"
              >
                {expandedFaq === 1 ? 'Read less' : 'Read more'}
              </button>
            </div>

            {/* FAQ Item 3 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-3">
                What should I do if there&apos;s an error with my ride?
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                You should edit your ride as soon as you spot the error. If you can&apos;t edit your ride because passengers have already...
                {expandedFaq === 2 && (
                  <span>
                    {" "}booked, you&apos;ll need to contact customer support immediately. Common errors include wrong departure times, pickup locations, or passenger capacity. For minor changes that don&apos;t affect the core details, you can often modify the ride details in your dashboard. For major changes, it&apos;s best to cancel the current ride and create a new one with correct information. Always communicate with your passengers about any changes through the platform&apos;s messaging system.
                  </span>
                )}
              </p>
              <button 
                onClick={() => toggleFaq(2)}
                className="text-[#4AAAFF] text-sm font-medium hover:underline"
              >
                {expandedFaq === 2 ? 'Read less' : 'Read more'}
              </button>
            </div>

            {/* FAQ Item 4 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-3">
                How do I cancel a ride sharing as a driver of a ride?
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                It only takes a minute to cancel a listed ride. However, if a driver cannot fulfill a ride that has been already booked, it is their responsibility to cancel in a timely manner to allow the passenge...
                {expandedFaq === 3 && (
                  <span>
                    {" "}rs to make alternative arrangements. Cancellations should be done at least 24 hours before departure when possible. Frequent last-minute cancellations may affect your driver rating and account status. When you cancel a booked ride, passengers are automatically refunded and notified immediately. You can cancel through your driver dashboard or by contacting customer support. Emergency cancellations are understood, but please provide as much notice as possible to minimize inconvenience to passengers.
                  </span>
                )}
              </p>
              <button 
                onClick={() => toggleFaq(3)}
                className="text-[#4AAAFF] text-sm font-medium hover:underline"
              >
                {expandedFaq === 3 ? 'Read less' : 'Read more'}
              </button>
            </div>
          </div>

          {/* See more answers button */}
          <div className="text-center mt-12">
            <button className="bg-[#4AAAFF] text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
              See more answers
            </button>
          </div>
        </div>
      </section>
      
      {/* Other sections will go here */}
      <Footer />
    </div>
  );
}

export default PublishRide;