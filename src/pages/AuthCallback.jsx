import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1초

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;

    const handleCallback = async () => {
      try {
        console.log('AuthCallback: 콜백 처리 시작', { retryCount });
        
        // 세션 상태 변경 감지
        const {
          data: { subscription }
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('AuthCallback: 인증 상태 변경', { event, session });
          
          if (event === 'SIGNED_IN' || event === 'SIGNED_UP') {
            handleProfileCheck(session);
          }
        });
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthCallback: 세션 조회 오류', sessionError);
          throw sessionError;
        }
        
        if (!session?.user) {
          console.log('AuthCallback: 세션 없음', { retryCount });
          
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`AuthCallback: ${RETRY_DELAY}ms 후 재시도`);
            setTimeout(handleCallback, RETRY_DELAY);
            return;
          }
          
          console.log('AuthCallback: 최대 재시도 횟수 초과, 홈으로 이동');
          if (isMounted) navigate('/', { replace: true });
          return;
        }

        await handleProfileCheck(session);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('AuthCallback: 처리 중 오류 발생', error);
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`AuthCallback: 오류 발생으로 ${RETRY_DELAY}ms 후 재시도`);
          setTimeout(handleCallback, RETRY_DELAY);
          return;
        }
        
        if (isMounted) navigate('/', { replace: true });
      }
    };

    const handleProfileCheck = async (session) => {
      if (!session?.user || !isMounted) return;

      console.log('AuthCallback: 세션 확인됨', {
        userId: session.user.id,
        email: session.user.email,
        metadata: session.user.user_metadata
      });

      try {
        // 프로필 체크
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        console.log('AuthCallback: 프로필 조회 결과', {
          profile,
          errorCode: profileError?.code,
          errorMessage: profileError?.message
        });

        // 프로필이 없거나 불완전한 경우
        if (profileError?.code === 'PGRST116' || !profile?.job_category || !profile?.job_title) {
          console.log('AuthCallback: 프로필 없음 또는 불완전함, 기본 프로필 생성/업데이트');
          
          const profileData = {
            user_id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
            avatar_url: session.user.user_metadata?.avatar_url || null,
            job_category: profile?.job_category || '',
            job_title: profile?.job_title || '',
            years_of_experience: profile?.years_of_experience || 0,
            organization: profile?.organization || ''
          };
          
          console.log('AuthCallback: 저장할 프로필 데이터', profileData);

          const { error: upsertError } = await supabase
            .from('user_profiles')
            .upsert(profileData, {
              onConflict: 'user_id',
              returning: 'minimal'
            });

          if (upsertError) {
            console.error('AuthCallback: 프로필 저장 오류', upsertError);
            throw upsertError;
          }

          console.log('AuthCallback: 프로필 저장 완료');
          if (isMounted) {
            console.log('AuthCallback: 온보딩 페이지로 이동');
            navigate('/onboarding', { replace: true });
            return;
          }
        }

        // 프로필이 완성된 경우
        console.log('AuthCallback: 프로필 완성됨', profile);
        if (isMounted) {
          console.log('AuthCallback: 홈으로 이동');
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('AuthCallback: 프로필 체크 중 오류 발생', error);
        throw error;
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#13151a] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 