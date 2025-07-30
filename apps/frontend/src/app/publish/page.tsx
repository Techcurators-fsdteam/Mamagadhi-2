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