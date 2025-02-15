import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useNavigate } from 'react-router-dom';
import { OnboardingForm } from './auth/OnboardingForm';

export const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth-callback`,
          scopes: 'email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      console.log('구글 로그인 시도:', data);
      
    } catch (error) {
      console.error('구글 로그인 오류:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 세션 및 인증 상태 감지
  useEffect(() => {
    let mounted = true;

    // 초기 세션 체크
    const checkInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted && session?.user) {
          setSession(session);
          setCurrentUser(session.user);
        }
      } catch (error) {
        console.error('초기 세션 체크 오류:', error);
      }
    };

    checkInitialSession();

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('인증 상태 변경 이벤트:', event, '세션:', session);
      
      if (!mounted) return;

      if (session?.user) {
        console.log('사용자 인증됨:', session.user);
        setSession(session);
        setCurrentUser(session.user);
        
        try {
          // 프로필 체크
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          // 프로필이 없는 경우
          if (profileError && profileError.code === 'PGRST116') {
            console.log('프로필 없음, 신규 프로필 생성');
            
            // 새 프로필 생성
            const { error: createError } = await supabase
              .from('user_profiles')
              .insert([
                {
                  user_id: session.user.id,
                  full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
                  avatar_url: session.user.user_metadata?.avatar_url || null,
                  job_category: '',
                  job_title: '',
                  years_of_experience: 0,
                  organization: ''
                }
              ]);

            if (createError) throw createError;

            console.log('프로필 생성 완료, 온보딩으로 이동');
            navigate('/onboarding', { replace: true });
            return;
          }

          // 프로필 조회 중 다른 오류 발생
          if (profileError) {
            console.error('프로필 조회 오류:', profileError);
            throw profileError;
          }

          // 프로필은 있지만 필수 정보가 없는 경우
          if (!profile.job_category || !profile.job_title) {
            console.log('프로필 정보 불완전, 온보딩으로 이동');
            navigate('/onboarding', { replace: true });
            return;
          }

          // 프로필이 완성된 경우에만 홈으로 이동
          console.log('프로필 완성됨, 홈으로 이동');
          navigate('/', { replace: true });
        } catch (error) {
          console.error('프로필 처리 오류:', error);
          setError('프로필 정보를 처리하는 중 오류가 발생했습니다.');
        }
      } else {
        if (mounted) {
          console.log('사용자 인증 해제됨');
          setSession(null);
          setCurrentUser(null);
          setShowOnboarding(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-[#1e2128] p-8 rounded-xl w-full max-w-md mx-4 border border-gray-700/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">로그인</h2>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 bg-[#2b2f38] hover:bg-[#3d4251] text-white py-3 rounded-lg transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <img
              src="/google-icon.svg"
              alt="Google"
              className="w-5 h-5"
            />
            {loading ? '로그인 중...' : 'Google로 계속하기'}
          </button>
        </div>
      </div>

      {showOnboarding && currentUser && (
        <OnboardingForm
          onClose={() => {
            setShowOnboarding(false);
            navigate('/', { replace: true });
          }}
          currentUser={currentUser}
        />
      )}
    </>
  );
}; 