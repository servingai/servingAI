import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        console.log('AuthCallback: 콜백 처리 시작');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthCallback: 세션 조회 오류', sessionError);
          throw sessionError;
        }
        
        if (!session?.user) {
          console.log('AuthCallback: 세션 없음, 홈으로 이동');
          if (isMounted) navigate('/', { replace: true });
          return;
        }

        console.log('AuthCallback: 세션 확인됨', session.user);

        // 프로필 체크
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        console.log('AuthCallback: 프로필 조회 결과', { profile, profileError });

        // 프로필이 없는 경우 (PGRST116: 데이터 없음)
        if (profileError?.code === 'PGRST116') {
          console.log('AuthCallback: 프로필 없음, 신규 프로필 생성 시작');
          
          const { data: newProfile, error: createError } = await supabase
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
            ])
            .select()
            .single();

          if (createError) {
            console.error('AuthCallback: 프로필 생성 오류', createError);
            throw createError;
          }

          console.log('AuthCallback: 프로필 생성 완료', newProfile);
          if (isMounted) {
            console.log('AuthCallback: 온보딩 페이지로 이동');
            navigate('/onboarding', { replace: true });
          }
          return;
        }

        // 다른 프로필 조회 오류
        if (profileError) {
          console.error('AuthCallback: 프로필 조회 중 오류 발생', profileError);
          throw profileError;
        }

        // 프로필은 있지만 필수 정보가 없는 경우
        if (!profile?.job_category || !profile?.job_title) {
          console.log('AuthCallback: 프로필 정보 불완전', profile);
          if (isMounted) {
            console.log('AuthCallback: 온보딩 페이지로 이동');
            navigate('/onboarding', { replace: true });
          }
          return;
        }

        // 프로필이 완성된 경우
        console.log('AuthCallback: 프로필 완성됨', profile);
        if (isMounted) {
          console.log('AuthCallback: 홈으로 이동');
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('AuthCallback: 처리 중 오류 발생', error);
        if (isMounted) navigate('/', { replace: true });
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