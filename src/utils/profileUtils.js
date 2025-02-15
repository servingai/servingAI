import { supabase } from '../config/supabase';

export const checkAndRedirectProfile = async (userId, navigate) => {
  if (!userId) return false;

  try {
    // 프로필 데이터 조회
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // 프로필이 없거나 필수 정보가 없는 경우
    if (profileError?.code === 'PGRST116' || !profile?.job_category || !profile?.job_title) {
      console.log('필수 프로필 정보 누락, 온보딩 페이지로 이동');
      navigate('/onboarding', { replace: true });
      return false;
    }

    return true;
  } catch (error) {
    console.error('프로필 체크 오류:', error);
    return false;
  }
}; 