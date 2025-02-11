import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { useNavigate } from 'react-router-dom';
import { OnboardingForm } from '../components/auth/OnboardingForm';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        console.log('Checking user session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          console.log('User found:', session.user.id);
          setUser(session.user);
          
          // 프로필 정보 확인
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('job_category, job_title')
            .eq('user_id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
            throw profileError;
          }

          if (!mounted) return;

          // 필수 프로필 정보가 없으면 온보딩 모달 표시
          if (!profile?.job_category || !profile?.job_title) {
            console.log('Profile incomplete, showing onboarding');
            setShowOnboarding(true);
          } else {
            console.log('Profile complete');
          }
        } else {
          console.log('No user session found');
          setUser(null);
          setShowOnboarding(false);
        }
      } catch (error) {
        console.error('Error in checkUser:', error);
        if (!mounted) return;
        setUser(null);
        setShowOnboarding(false);
      } finally {
        if (!mounted) return;
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        
        try {
          // 프로필 정보 확인
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('job_category, job_title')
            .eq('user_id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
            throw profileError;
          }

          if (!mounted) return;

          // 필수 프로필 정보가 없으면 온보딩 모달 표시
          if (!profile?.job_category || !profile?.job_title) {
            console.log('Profile incomplete, showing onboarding');
            setShowOnboarding(true);
          } else {
            console.log('Profile complete');
            setShowOnboarding(false);
          }
        } catch (error) {
          console.error('Error checking profile:', error);
          if (!mounted) return;
          setShowOnboarding(false);
        }
      } else {
        setUser(null);
        setShowOnboarding(false);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
  };

  const value = {
    user,
    loading,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e2128] flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-200">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showOnboarding && <OnboardingForm onClose={handleOnboardingClose} />}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
