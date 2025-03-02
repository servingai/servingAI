import { supabase } from '../config/supabase';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1초

export const checkAndRedirectProfile = async (userId, navigate, currentPath) => {
  if (!userId) return false;

  let retryCount = 0;

  const checkProfile = async () => {
    try {
      console.log('프로필 체크 시도:', { userId, retryCount, currentPath });

      // 이미 온보딩 페이지에 있는 경우 체크 스킵
      if (currentPath === '/onboarding') {
        console.log('이미 온보딩 페이지에 있음, 체크 스킵');
        return true;
      }

      // 세션 유효성 검증
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('세션 조회 오류:', sessionError);
        throw sessionError;
      }

      if (!session?.user) {
        console.log('세션 없음');
        return false;
      }

      // 프로필 데이터 조회
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('프로필 조회 결과:', { 
        profile, 
        errorCode: profileError?.code,
        hasJobCategory: !!profile?.job_category,
        hasJobTitle: !!profile?.job_title
      });

      // 프로필이 없거나 필수 정보가 없는 경우
      const needsOnboarding = profileError?.code === 'PGRST116' || !profile?.job_category || !profile?.job_title;
      
      if (needsOnboarding) {
        console.log('프로필 정보 불완전:', {
          isNew: profileError?.code === 'PGRST116',
          hasJobCategory: !!profile?.job_category,
          hasJobTitle: !!profile?.job_title
        });

        // 프로필이 없는 경우 기본 프로필 생성
        if (profileError?.code === 'PGRST116') {
          console.log('프로필 없음, 기본 프로필 생성 시도');
          const { error: createError } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: userId,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
              avatar_url: session.user.user_metadata?.avatar_url || null,
              job_category: '',
              job_title: '',
              years_of_experience: 0,
              organization: ''
            });

          if (createError) {
            console.error('프로필 생성 오류:', createError);
            throw createError;
          }
          console.log('기본 프로필 생성 완료');
        }

        // 리다이렉션 수행
        console.log('온보딩 페이지로 리다이렉션 시도');
        navigate('/onboarding', { replace: true });
        
        // 리다이렉션 확인을 위한 지연
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (window.location.pathname !== '/onboarding') {
          console.log('리다이렉션 재시도');
          window.location.href = '/onboarding';
        }
        
        return false;
      }

      console.log('프로필 체크 완료: 정상');
      return true;
    } catch (error) {
      console.error('프로필 체크 오류:', error);
      
      // 재시도 로직
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`${RETRY_DELAY}ms 후 재시도 (${retryCount}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return checkProfile();
      }
      
      return false;
    }
  };

  return checkProfile();
}; 