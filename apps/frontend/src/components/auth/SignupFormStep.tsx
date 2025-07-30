'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

interface SignupFormStepProps {
  formData: FormData;
  selectedRole: 'driver' | 'passenger' | 'both';
  error: string;
  loading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRoleChange: (role: 'driver' | 'passenger' | 'both') => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToLogin: () => void;
}

const SignupFormStep: React.FC<SignupFormStepProps> = ({
  formData,
  selectedRole,
  error,
  loading,
  onInputChange,
  onRoleChange,
  onSubmit,
  onSwitchToLogin,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Create Account</h2>
        <p className="text-gray-600">Join our ridesharing community</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <Input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={onInputChange}
            required
            className="w-full"
            placeholder="Enter first name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <Input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={onInputChange}
            required
            className="w-full"
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <Input
          type="email"
          name="email"
          value={formData.email}
          onChange={onInputChange}
          required
          className="w-full"
          placeholder="Enter email address"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <Input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={onInputChange}
          required
          className="w-full"
          placeholder="+1234567890"
        />
        <p className="text-xs text-gray-500 mt-1">
          Include country code (e.g., +1 for US)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <Input
          type="password"
          name="password"
          value={formData.password}
          onChange={onInputChange}
          required
          className="w-full"
          placeholder="Enter password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <Input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={onInputChange}
          required
          className="w-full"
          placeholder="Confirm password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How will you use our platform?
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onRoleChange('passenger')}
            className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
              selectedRole === 'passenger'
                ? 'bg-[#4AAAFF] text-white border-[#4AAAFF]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#4AAAFF]'
            }`}
          >
            Passenger
          </button>
          <button
            type="button"
            onClick={() => onRoleChange('driver')}
            className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
              selectedRole === 'driver'
                ? 'bg-[#4AAAFF] text-white border-[#4AAAFF]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#4AAAFF]'
            }`}
          >
            Driver
          </button>
          <button
            type="button"
            onClick={() => onRoleChange('both')}
            className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
              selectedRole === 'both'
                ? 'bg-[#4AAAFF] text-white border-[#4AAAFF]'
                : 'bg-white text-gray-700 border-gray-300 hover:border-[#4AAAFF]'
            }`}
          >
            Both
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#4AAAFF] hover:bg-blue-600 text-white"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#4AAAFF] hover:underline font-medium"
          >
            Sign In
          </button>
        </p>
      </div>

      <div id="signup-recaptcha-container"></div>
    </form>
  );
};

export default SignupFormStep;
