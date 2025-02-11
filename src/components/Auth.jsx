import React, { useState } from 'react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // 로그인
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // 로그인 성공 후 프로필 체크
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        // 프로필이 있고 필수 정보가 있으면 홈으로 이동
        if (profile?.job_category && profile?.job_title) {
          navigate('/');
        } else {
          // 프로필이 없거나 필수 정보가 없는 경우에만 온보딩 모달 표시
          setShowOnboarding(true);
        }
      } else {
        // 회원가입
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          // 프로필 생성
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([
              {
                user_id: data.user.id,
                full_name: email.split('@')[0],
                avatar_url: null,
                job_category: '',
                job_title: '',
                years_of_experience: 0,
                organization: ''
              }
            ]);

          if (profileError) {
            throw new Error('프로필 생성에 실패했습니다. 관리자에게 문의해주세요.');
          }

          // 회원가입 후에는 항상 온보딩 모달 표시
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    navigate('/');
  };

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
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-gray-400 hover:text-white py-2 transition-colors text-sm"
            >
              {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
            </button>
          </form>
        </div>
      </div>

      {showOnboarding && (
        <OnboardingForm onClose={handleCloseOnboarding} />
      )}
    </>
  );
};
