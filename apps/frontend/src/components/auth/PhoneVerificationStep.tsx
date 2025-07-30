'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PhoneVerificationStepProps {
  phone: string;
  otp: string;
  error: string;
  loading: boolean;
  resendCooldown: number;
  onOtpChange: (value: string) => void;
  onVerify: (e: React.FormEvent) => void;
  onResendOTP: () => void;
  onBack: () => void;
}

const PhoneVerificationStep: React.FC<PhoneVerificationStepProps> = ({
  phone,
  otp,
  error,
  loading,
  resendCooldown,
  onOtpChange,
  onVerify,
  onResendOTP,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Verify Phone Number</h2>
        <p className="text-gray-600">
          We sent a verification code to{' '}
          <span className="font-medium">{phone}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={onVerify} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verification Code
          </label>
          <Input
            type="text"
            value={otp}
            onChange={(e) => onOtpChange(e.target.value)}
            required
            className="w-full text-center text-lg tracking-widest"
            placeholder="Enter 6-digit code"
            maxLength={6}
          />
        </div>

        <Button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full bg-[#4AAAFF] hover:bg-blue-600 text-white"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Didn't receive the code?
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={onResendOTP}
          disabled={resendCooldown > 0}
          className="text-[#4AAAFF] hover:bg-blue-50"
        >
          {resendCooldown > 0 
            ? `Resend in ${resendCooldown}s`
            : 'Resend Code'
          }
        </Button>
      </div>

      <div className="text-center">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="text-gray-600 hover:bg-gray-50"
        >
          ← Back to form
        </Button>
      </div>
    </div>
  );
};

export default PhoneVerificationStep;
