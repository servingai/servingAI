import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useNavigate } from 'react-router-dom';
import { OnboardingForm } from './auth/OnboardingForm';

export const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);

  // URL 파라미터 체크
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const params = new URLSearchParams(window.location.search);
      const needsOnboarding = params.get('onboarding') === 'true';
      
      if (needsOnboarding) {
        console.log('URL 파라미터에서 온보딩 필요 감지');
        // URL에서 onboarding 파라미터 제거
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        
        // 현재 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('세션 존재, 프로필 체크 시작');
          const hasProfile = await checkProfile(session.user, true);
          if (!hasProfile) {
            console.log('프로필 정보 불완전, 온보딩 표시');
            setShowOnboarding(true);
          }
        }
      }
    };

    checkOnboardingStatus();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}?onboarding=true`,
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

  // 세션 상태 감지
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        console.log('현재 세션:', session);
        if (session?.user) {
          console.log('세션에서 사용자 정보 확인:', session.user);
          setSession(session);
          setCurrentUser(session.user);
          
          // 프로필 체크
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }

          // 프로필이 없거나 필수 정보가 없는 경우 온보딩 필요
          if (!profile || !profile.job_category || !profile.job_title) {
            console.log('프로필 정보 불완전, 온보딩 필요');
            setShowOnboarding(true);
          } else {
            setShowOnboarding(false);
          }
        }
      } catch (error) {
        console.error('세션 체크 오류:', error);
        setError('세션을 확인하는 중 오류가 발생했습니다.');
        setSession(null);
        setCurrentUser(null);
        setShowOnboarding(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('인증 상태 변경 이벤트:', event, '세션:', session);
      
      if (session?.user) {
        console.log('사용자 인증됨:', session.user);
        setSession(session);
        setCurrentUser(session.user);
        
        if (event === 'SIGNED_IN' || event === 'SIGNED_UP') {
          console.log('새 로그인/회원가입 감지, 프로필 체크 시작');
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }

          // 프로필이 없거나 필수 정보가 없는 경우 온보딩 필요
          if (!profile || !profile.job_category || !profile.job_title) {
            console.log('프로필 정보 불완전, 온보딩 필요');
            setShowOnboarding(true);
            return;
          }

          // 프로필이 완성된 경우에만 홈으로 이동
          if (!showOnboarding) {
            navigate('/', { replace: true });
          }
        }
      } else {
        console.log('사용자 인증 해제됨');
        setSession(null);
        setCurrentUser(null);
        setShowOnboarding(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // 프로필 체크 함수
  const checkProfile = async (user, shouldCreateProfile = false) => {
    if (!user) {
      console.log('프로필 체크: 사용자 정보 없음');
      return false;
    }

    try {
      console.log('프로필 체크 시작:', user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('프로필 조회 결과:', { profile, profileError });

      // 프로필이 없는 경우
      if (profileError && profileError.code === 'PGRST116') {
        if (!shouldCreateProfile) {
          return false;
        }

        console.log('프로필 없음, 신규 프로필 생성 시도');
        
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([
            {
              user_id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
              avatar_url: user.user_metadata?.avatar_url || null,
              job_category: '',
              job_title: '',
              years_of_experience: 0,
              organization: ''
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('프로필 생성 오류:', createError);
          throw createError;
        }

        console.log('신규 프로필 생성 성공:', newProfile);
        return false;
      }

      if (profileError) {
        console.error('프로필 조회 오류:', profileError);
        throw profileError;
      }

      const isProfileComplete = profile?.job_category && profile?.job_title;
      console.log('프로필 완성도 체크:', isProfileComplete);
      return isProfileComplete;
      
    } catch (error) {
      console.error('프로필 체크 오류:', error);
      setError('프로필 정보를 확인하는 중 오류가 발생했습니다.');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        console.log('로그인 시도:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        console.log('로그인 성공:', data);
        
        // 로그인 성공 시 홈으로 리다이렉트
        navigate('/', { replace: true });
      } else {
        console.log('회원가입 시도:', email);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
            },
          },
        });

        if (error) throw error;
        console.log('회원가입 성공:', data);

        if (data?.user) {
          setCurrentUser(data.user);
          console.log('프로필 생성 시도:', data.user.id);
          
          // 회원가입 직후 프로필 생성
          const { data: newProfile, error: profileError } = await supabase
            .from('user_profiles')
            .insert([
              {
                user_id: data.user.id,
                full_name: data.user.user_metadata?.full_name || email.split('@')[0],
                avatar_url: data.user.user_metadata?.avatar_url || null,
                job_category: '',
                job_title: '',
                years_of_experience: 0,
                organization: ''
              }
            ])
            .select()
            .single();

          if (profileError) {
            console.error('프로필 생성 오류:', profileError);
            throw profileError;
          }

          console.log('프로필 생성 성공:', newProfile);
          
          // 세션 상태 업데이트
          setSession({
            ...data,
            user: data.user
          });
          
          // 온보딩 페이지로 리다이렉트
          alert('회원가입이 완료되었습니다. 프로필 정보를 입력해주세요.');
          navigate('/onboarding', { replace: true });
          return;
        }
      }
    } catch (error) {
      console.error('인증 오류:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseOnboarding = async () => {
    try {
      console.log('온보딩 닫기 시도, currentUser:', currentUser);
      
      if (!currentUser) {
        console.log('currentUser 없음, 홈으로 이동');
        navigate('/');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (profileError) {
        console.error('프로필 확인 오류:', profileError);
        throw profileError;
      }

      console.log('온보딩 닫기 전 프로필 확인:', profile);

      if (!profile?.job_category || !profile?.job_title) {
        alert('직군과 직무는 필수 입력 항목입니다.');
        return;
      }

      setShowOnboarding(false);
      navigate('/');
    } catch (error) {
      console.error('온보딩 닫기 오류:', error);
      setError('프로필 확인 중 오류가 발생했습니다.');
    }
  };

  // 이미 로그인된 경우의 처리
  useEffect(() => {
    if (session && !showOnboarding) {
      const checkExistingProfile = async () => {
        const hasProfile = await checkProfile(session.user, true);
        if (hasProfile) {
          navigate('/', { replace: true });
        } else {
          setShowOnboarding(true);
        }
      };
      
      checkExistingProfile();
    }
  }, [session, showOnboarding, navigate]);

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-[#1e2128] p-8 rounded-xl w-full max-w-md mx-4 border border-gray-700/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {isLogin ? '로그인' : '회원가입'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#2b2f38] border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#2b2f38] border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors font-medium ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="w-full text-gray-400 hover:text-white py-2 transition-colors text-sm"
            >
              {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
            </button>
          </form>
        </div>
      </div>

      {showOnboarding && currentUser && (
        <OnboardingForm
          onClose={handleCloseOnboarding}
          currentUser={currentUser}
        />
      )}
    </>
  );
}; 