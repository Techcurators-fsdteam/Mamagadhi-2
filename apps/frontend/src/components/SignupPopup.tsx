'use client';

import { useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { 
  createUserWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  AuthError,
  AuthCredential
} from 'firebase/auth';
import { createUserProfile, UserProfile } from '../lib/supabase';

interface SignupPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

type SignupStep = 'form' | 'phone-verification' | 'account-creation' | 'success';

export default function SignupPopup({ isOpen, onClose, onSwitchToLogin }: SignupPopupProps) {
  const [step, setStep] = useState<SignupStep>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationId, setVerificationId] = useState('');
  const [otp, setOtp] = useState('');
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [selectedRole, setSelectedRole] = useState<'driver' | 'passenger' | 'both'>('passenger');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (isOpen && !recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'signup-recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      });
      setRecaptchaVerifier(verifier);
    }
  }, [isOpen, recaptchaVerifier]);

  if (!isOpen) return null;

  const isValidPhone = (phone: string) => {
    return /^\+[1-9]\d{1,14}$/.test(phone);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!isValidPhone(formData.phone)) {
      setError('Please enter a valid phone number in E.164 format (e.g., +1234567890)');
      return;
    }

    setLoading(true);

    try {
      // First verify phone number with OTP
      if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized');
      }

      const confirmationResult = await signInWithPhoneNumber(auth, formData.phone, recaptchaVerifier);
      setVerificationId(confirmationResult.verificationId);
      setStep('phone-verification');
      setResendCooldown(30);
    } catch (error: unknown) {
      console.error('Phone verification error:', error);
      const authError = error as AuthError;
      setError(authError.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Verify phone OTP
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      
      // Move to account creation step
      setStep('account-creation');
      
      // Automatically proceed to create account
      await createUserAccount(credential);
    } catch (error: unknown) {
      console.error('Phone verification error:', error);
      const authError = error as AuthError;
      if (authError.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP code. Please try again.');
      } else if (authError.code === 'auth/code-expired') {
        setError('OTP code has expired. Please request a new one.');
      } else {
        setError(authError.message || 'Phone verification failed');
      }
      setStep('phone-verification'); // Go back to phone verification step
    } finally {
      setLoading(false);
    }
  };

  const createUserAccount = async (phoneCredential: AuthCredential) => {
    let firebaseUser = null;
    
    try {
      console.log('Starting account creation...');
      
      // Create user with email and password in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      firebaseUser = userCredential.user;
      console.log('Firebase user created:', firebaseUser.uid);

      // Update user profile with name in Firebase
      await updateProfile(firebaseUser, {
        displayName: `${formData.firstName} ${formData.lastName}`
      });
      console.log('Firebase profile updated');

      // Link the verified phone credential to the email account
      try {
        await linkWithCredential(firebaseUser, phoneCredential);
        console.log('Phone credential linked successfully');
      } catch (linkError) {
        console.error('Phone linking error:', linkError);
        // Continue even if linking fails - phone is already verified
      }

      // Create user profile in Supabase
      const userProfileData: Omit<UserProfile, 'created_at' | 'updated_at'> = {
        id: firebaseUser.uid,
        email: formData.email,
        phone: formData.phone,
        first_name: formData.firstName,
        last_name: formData.lastName,
        display_name: `${formData.firstName} ${formData.lastName}`,
        role: selectedRole,
        is_email_verified: firebaseUser.emailVerified,
        is_phone_verified: true
      };

      console.log('Creating Supabase profile...', userProfileData);
      
      try {
        await createUserProfile(userProfileData);
        console.log('Supabase profile created successfully');
      } catch (supabaseError) {
        console.error('Supabase profile creation failed:', supabaseError);
        
        // Clean up Firebase user since Supabase failed
        if (firebaseUser) {
          try {
            await firebaseUser.delete();
            console.log('Firebase user cleaned up due to Supabase error');
          } catch (deleteError) {
            console.error('Failed to delete Firebase user:', deleteError);
          }
        }
        
        // Sign out to clear any auth state
        await auth.signOut();
        
        throw new Error('Failed to create user profile in database. Please try again.');
      }

      setStep('success');
      
      // Auto close after 3 seconds and redirect
      setTimeout(() => {
        onClose();
        // Add your redirect logic here (e.g., router.push('/dashboard'))
      }, 3000);

    } catch (error: unknown) {
      console.error('Account creation error:', error);
      
      // If we have a Firebase user but something failed, clean it up
      if (firebaseUser && auth.currentUser) {
        try {
          await auth.currentUser.delete();
          console.log('Firebase user cleaned up due to general error');
        } catch (deleteError) {
          console.error('Failed to delete Firebase user:', deleteError);
        }
      }
      
      // Sign out to clear any auth state
      try {
        await auth.signOut();
      } catch (signOutError) {
        console.error('Failed to sign out:', signOutError);
      }
      
      const authError = error as AuthError;
      
      if (authError.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else if (authError.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else if (authError.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (authError.message?.includes('Failed to create user profile')) {
        setError('Failed to create user profile in database. Please try again.');
      } else {
        setError(authError.message || 'Failed to create account. Please try again.');
      }
      
      // Go back to form step to show error
      setStep('form');
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown === 0) {
      setError('');
      setLoading(true);
      
      try {
        if (!recaptchaVerifier) {
          throw new Error('reCAPTCHA not initialized');
        }
        const confirmationResult = await signInWithPhoneNumber(auth, formData.phone, recaptchaVerifier);
        setVerificationId(confirmationResult.verificationId);
        setResendCooldown(30);
      } catch (error: unknown) {
        const authError = error as AuthError;
        setError(authError.message || 'Failed to resend OTP');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setStep('form');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: ''
    });
    setOtp('');
    setError('');
    setVerificationId('');
    setSelectedRole('passenger');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-white/30">
      <div className="relative bg-gradient-to-br from-[#4AAAFF] to-white rounded-2xl shadow-2xl max-w-md w-full p-8 mx-4 max-h-[90vh] overflow-y-auto" style={{backdropFilter: 'blur(16px)'}}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black/50 hover:text-[#2196f3] text-2xl font-bold"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-black/50 mb-2">
            Mamagadhi
          </h1>
          <div className="w-16 h-1 bg-black/20 mx-auto rounded-full"></div>
          <p className="text-sm text-black/90 mt-2">
            {step === 'form' && 'Create your account'}
            {step === 'phone-verification' && 'Verify your phone number'}
            {step === 'account-creation' && 'Creating your account...'}
            {step === 'success' && 'Account created successfully!'}
          </p>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-black/50 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#35a4c9] focus:border-transparent outline-none transition-all text-black/80 placeholder-gray-500"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-black/50 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#35a4c9] focus:border-transparent outline-none transition-all text-black/80 placeholder-gray-500"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black/50 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#35a4c9] focus:border-transparent outline-none transition-all text-black/80 placeholder-gray-500"
                placeholder="john.doe@email.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-black/50 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#35a4c9] focus:border-transparent outline-none transition-all text-black/80 placeholder-gray-500"
                placeholder="+1234567890"
              />
              <p className="text-xs text-black/80 mt-1">
                Use E.164 format (e.g., +1234567890)
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-black/50 mb-2">
                I want to use Mamagadhi as a:
              </label>
              <div className="space-y-2">
                {[
                  {
                    value: 'passenger',
                    label: 'Passenger (Book rides)'
                  },
                  {
                    value: 'driver',
                    label: 'Driver (Offer rides)'
                  },
                  {
                    value: 'both',
                    label: 'Both (Book & Offer rides)'
                  }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={selectedRole === option.value}
                      onChange={(e) => setSelectedRole(e.target.value as typeof selectedRole)}
                      className="mr-3 text-[#35a4c9] focus:ring-[#35a4c9]"
                    />
                    <span className="text-black/80 text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black/50 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#35a4c9] focus:border-transparent outline-none transition-all text-black/80 placeholder-gray-500"
                placeholder="Create a strong password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-black/50 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#35a4c9] focus:border-transparent outline-none transition-all text-black/80 placeholder-gray-500"
                placeholder="Confirm your password"
              />
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 rounded border-gray-300 text-[#35a4c9] focus:ring-[#35a4c9]"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-black/80">
                I agree to the{' '}
                <a href="#" className="text-black/80 font-medium hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-black/80 font-medium hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {error && (
              <div className="text-red-200 text-sm bg-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4aaaff] text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors shadow-lg disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {step === 'phone-verification' && (
          <form onSubmit={handleVerifyPhone} className="space-y-6">
            <div>
              <label htmlFor="signup-otp" className="block text-sm font-medium text-black/50 mb-2">
                Enter 6-Digit SMS Code
              </label>
              <input
                type="text"
                id="signup-otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#35a4c9] focus:border-transparent outline-none transition-all text-black/80 placeholder-gray-500 text-center text-2xl tracking-widest"
                placeholder="000000"
              />
              <p className="text-xs text-black/80 mt-1">
                SMS sent to {formData.phone}
              </p>
              <p className="text-xs text-black/70 mt-2">
                After verification, we&apos;ll create your account automatically.
              </p>
            </div>

            {error && (
              <div className="text-red-200 text-sm bg-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-[#4aaaff] text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors shadow-lg disabled:opacity-50"
            >
              {loading ? 'Verifying & Creating Account...' : 'Verify & Create Account'}
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || loading}
                className="text-black/80 text-sm hover:underline disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend SMS'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="text-black/80 text-sm hover:underline"
              >
                Change details
              </button>
            </div>
          </form>
        )}

        {step === 'account-creation' && (
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black/50 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-black/80">Creating Your Account</h3>
            <p className="text-black/90 text-sm">
              Phone verified! Setting up your account...
            </p>
            {/* Add error display for account creation step */}
            {error && (
              <div className="text-red-200 text-sm bg-red-500/20 rounded-lg p-3 mt-4">
                {error}
              </div>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="text-black/80 text-6xl mb-4">✓</div>
            <h3 className="text-xl font-bold text-black/80">Welcome to Mamagadhi!</h3>
            <p className="text-black/90 text-sm">
              Your account has been created successfully with verified phone number.
              Redirecting you to the dashboard...
            </p>
          </div>
        )}

        {step === 'form' && (
          <>
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-black/50"></div>
              <span className="px-4 text-sm text-black/80">OR</span>
              <div className="flex-1 border-t border-black/50"></div>
            </div>

            <div className="text-center">
              <p className="text-sm text-black/80">
                Already have an account?{' '}
                <button 
                  onClick={onSwitchToLogin}
                  className="text-black/80 font-medium hover:underline"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </>
        )}

        {/* Hidden reCAPTCHA container */}
        <div id="signup-recaptcha-container"></div>
      </div>
    </div>
  );
}