'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface StepHeaderProps {
  currentStep: 'route' | 'booking';
  onBack: () => void;
}

const StepHeader: React.FC<StepHeaderProps> = ({ currentStep, onBack }) => {
  return (
    <div className="flex items-center gap-4 mb-8">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onBack}
        className="p-2"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {currentStep === 'route' ? 'Route Planning' : 'Booking Details'}
        </h1>
        <p className="text-gray-600">
          {currentStep === 'route' 
            ? 'Plan your route and add any stopovers' 
            : 'Set your trip details and pricing'
          }
        </p>
      </div>
    </div>
  );
};

export default StepHeader;
