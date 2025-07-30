'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';

const SuccessStep: React.FC = () => {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="w-16 h-16 text-green-500" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">
          Account Created Successfully!
        </h2>
        <p className="text-gray-600">
          Welcome to our ridesharing community. You can now start booking and publishing rides.
        </p>
      </div>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-700">
          🎉 You're all set! This window will close automatically in a few seconds.
        </p>
      </div>
    </div>
  );
};

export default SuccessStep;
