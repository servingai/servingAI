import { supabase } from '../config/supabase';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1초

export const checkAndRedirectProfile = async (userId, navigate) => {
  if (!userId) return false;

  let retryCount = 0;

  const checkProfile = async () => {
    try {
      console.log('프로필 체크 시도:', { userId, retryCount });

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

      console.log('프로필 조회 결과:', { profile, errorCode: profileError?.code });

      // 프로필이 없거나 필수 정보가 없는 경우
      if (profileError?.code === 'PGRST116' || !profile?.job_category || !profile?.job_title) {
        console.log('필수 프로필 정보 누락, 온보딩 페이지로 이동');

        // 프로필이 없는 경우 기본 프로필 생성
        if (profileError?.code === 'PGRST116') {
          console.log('프로필 없음, 기본 프로필 생성');
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
        }

        navigate('/onboarding', { replace: true });
        return false;
      }

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