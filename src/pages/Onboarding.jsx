import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OnboardingForm } from '../components/auth/OnboardingForm';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  useEffect(() => {
    // 로그인하지 않은 사용자는 홈으로 리다이렉트
    if (!authUser) {
      navigate('/', { replace: true });
    }
  }, [authUser, navigate]);

  const handleOnboardingComplete = async () => {
    // 온보딩 완료 후 홈으로 리다이렉트
    navigate('/', { replace: true });
  };

  if (!authUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#13151a] pt-[60px]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="py-8">
          <OnboardingForm
            onClose={handleOnboardingComplete}
            currentUser={authUser}
            isStandalone={true}
          />
        </div>
      </div>
    </div>
  );
};

export default Onboarding;  