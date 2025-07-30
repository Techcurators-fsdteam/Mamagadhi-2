'use client';

import React, { useState } from 'react';

const PublishFAQSection: React.FC = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-16">
          Everything you need as a driver, in our Help Centre
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* FAQ Item 1 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              How do I set the passenger contribution for my ride?
            </h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              We recommend a contribution per passenger on your rides. These suggestions help you set fair contributions for your rides (those most likely to get your seats filled!), but can still be adjusted...
              {expandedFaq === 0 && (
                <span>
                  {" "}The recommended price is calculated based on distance, fuel costs, tolls, and vehicle wear. You have complete freedom to adjust this amount up or down based on your preferences. Higher prices may result in fewer booking requests, while lower prices tend to attract more passengers. Consider factors like vehicle comfort, route popularity, and travel time when setting your price.
                </span>
              )}
            </p>
            <button 
              onClick={() => toggleFaq(0)}
              className="text-[#4AAAFF] font-medium hover:underline transition-colors"
            >
              {expandedFaq === 0 ? 'Read less' : 'Read more'}
            </button>
          </div>

          {/* FAQ Item 2 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              When do I get my money?
            </h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              We send your money 48 hours after the ride if you travelled as planned. You'll get your money 1 to 5 weekdays (not counting weekends and holidays) after we send it...
              {expandedFaq === 1 && (
                <span>
                  {" "}Payment processing times may vary depending on your bank and payment method. We use secure payment systems to ensure your earnings are transferred safely. If there are any issues with the ride (no-shows, cancellations, disputes), payment may be delayed until the matter is resolved. You can track all your earnings and payment history in your driver dashboard.
                </span>
              )}
            </p>
            <button 
              onClick={() => toggleFaq(1)}
              className="text-[#4AAAFF] font-medium hover:underline transition-colors"
            >
              {expandedFaq === 1 ? 'Read less' : 'Read more'}
            </button>
          </div>

          {/* FAQ Item 3 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              What should I do if there's an error with my ride?
            </h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              You should edit your ride as soon as you spot the error. If you can't edit your ride because passengers have already...
              {expandedFaq === 2 && (
                <span>
                  {" "}booked, you'll need to contact customer support immediately. Common errors include wrong departure times, pickup locations, or passenger capacity. For minor changes that don't affect the core details, you can often modify the ride details in your dashboard. For major changes, it's best to cancel the current ride and create a new one with correct information. Always communicate with your passengers about any changes through the platform's messaging system.
                </span>
              )}
            </p>
            <button 
              onClick={() => toggleFaq(2)}
              className="text-[#4AAAFF] font-medium hover:underline transition-colors"
            >
              {expandedFaq === 2 ? 'Read less' : 'Read more'}
            </button>
          </div>

          {/* FAQ Item 4 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              How do I cancel a ride sharing as a driver of a ride?
            </h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              It only takes a minute to cancel a listed ride. However, if a driver cannot fulfill a ride that has been already booked, it is their responsibility to cancel in a timely manner to allow the passenge...
              {expandedFaq === 3 && (
                <span>
                  {" "}rs to make alternative arrangements. Cancellations should be done at least 24 hours before departure when possible. Frequent last-minute cancellations may affect your driver rating and account status. When you cancel a booked ride, passengers are automatically refunded and notified immediately. You can cancel through your driver dashboard or by contacting customer support. Emergency cancellations are understood, but please provide as much notice as possible to minimize inconvenience to passengers.
                </span>
              )}
            </p>
            <button 
              onClick={() => toggleFaq(3)}
              className="text-[#4AAAFF] font-medium hover:underline transition-colors"
            >
              {expandedFaq === 3 ? 'Read less' : 'Read more'}
            </button>
          </div>
        </div>

        {/* See more answers button */}
        <div className="text-center mt-12">
          <button className="bg-[#4AAAFF] text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow-md">
            See more answers
          </button>
        </div>
      </div>
    </section>
  );
};

export default PublishFAQSection;
