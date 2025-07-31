'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AnimatedLoader from '../../components/AnimatedLoader';
import PublishHeroSection from '../../components/publish/PublishHeroSection';
import PublishFeaturesSection from '../../components/publish/PublishFeaturesSection';
import PublishAccountSection from '../../components/publish/PublishAccountSection';
import PublishSupportSection from '../../components/publish/PublishSupportSection';
import PublishFAQSection from '../../components/publish/PublishFAQSection';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../lib/api-client-enhanced';
import toast from 'react-hot-toast';

function PublishRide() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [formData, setFormData] = useState({
    passengers: '',
    vehicleType: '',
    origin: '',
    destination: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (user?.uid && supabase) {
        try {
          const result = await apiClient.checkVerification(user.uid);
          
          if (result.success && result.data) {
            if (!result.data.hasProfile) {
              toast.error('Driver profile not found. Please complete your profile setup.');
              router.replace('/profile');
            } else if (!result.data.isVerified) {
              toast.error('You need both ID and driving license verified by admin to publish rides. Please complete your verification in the profile page.');
              router.replace('/profile');
            }
          } else {
            toast.error('Error checking verification status. Please try again.');
            router.replace('/profile');
          }
        } catch (error) {
          console.error('Error checking verification status:', error);
          toast.error('Error checking verification status. Please try again.');
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
    return <AnimatedLoader />;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <Navbar />
      <PublishHeroSection formData={formData} onInputChange={handleInputChange} />
      <PublishFeaturesSection />
      <PublishAccountSection />
      <PublishSupportSection />
      <PublishFAQSection />
      <Footer />
    </div>
  );
}

export default PublishRide;