'use client';

import React from 'react';

const AccountCreationStep: React.FC = () => {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 border-4 border-[#4AAAFF] border-t-transparent rounded-full animate-spin"></div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-2">Creating Your Account</h2>
        <p className="text-gray-600">
          Please wait while we set up your profile...
        </p>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-[#4AAAFF] rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Verifying phone number</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-[#4AAAFF] rounded-full animate-pulse animation-delay-200"></div>
          <span className="text-sm text-gray-600">Creating user profile</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-[#4AAAFF] rounded-full animate-pulse animation-delay-400"></div>
          <span className="text-sm text-gray-600">Setting up account</span>
        </div>
      </div>
    </div>
  );
};

export default AccountCreationStep;
