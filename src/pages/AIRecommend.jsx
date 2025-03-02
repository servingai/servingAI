import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon } from '@heroicons/react/24/outline';
import { checkAndRedirectProfile } from '../utils/profileUtils';

const AIRecommend = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (authUser?.id) {
        await checkAndRedirectProfile(authUser.id, navigate, window.location.pathname);
      }
    };

    checkProfile();
  }, [authUser, navigate]);

  const handlePromptSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // 로그인 체크
    if (!authUser) {
      setShowLoginModal(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 사용자 프로필 정보 조회
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('job_category, job_title')
        .eq('user_id', authUser.id)
        .single();

      if (profileError) {
        throw new Error('사용자 정보를 가져오는데 실패했습니다.');
      }

      // n8n webhook URL로 프롬프트와 사용자 정보 전송
      const response = await fetch('https://servingai.work/webhook/345192bd-faad-4dac-9f16-4b7d4a5ba96d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          job_category: userProfile.job_category,
          job_title: userProfile.job_title
        }),
      });

      if (!response.ok) {
        throw new Error('추천을 가져오는데 실패했습니다.');
      }

      const data = await response.json();
      setRecommendation(data);
    } catch (error) {
      console.error('Error getting recommendation:', error);
      setError(error.message || '추천을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
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
    } catch (error) {
      console.error('Error logging in:', error);
      setError('로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <main className="pt-[60px] pb-[80px] px-4">
      <div className="max-w-4xl mx-auto">
        <section className="mb-12">
          <style>
            {`
              @keyframes gradient {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              @keyframes shine {
                to {
                  background-position: 200% center;
                }
              }
              .gradient-text {
                background: linear-gradient(to right, #7950F2, #9775fa, #7950F2);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
              }
            `}
          </style>
          <h1 className="text-[32px] font-bold text-center gradient-text mb-3">
            어떤 일을 해야하나요?
          </h1>
          <p className="text-center text-gray-400 text-[15px] font-medium mb-10 tracking-tight">
            쉽고 빠르게 해결할 수 있는 방법을 알려드릴게요
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="할일을 입력해보세요!"
                className="w-full px-6 py-4 bg-white dark:bg-[#1e2128] border border-[#e5e7eb] dark:border-[#2b2f38] rounded-2xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#7950F2]/50 focus:border-[#7950F2] hover:border-[#7950F2] transition-all"
              />
              <button
                onClick={handlePromptSubmit}
                disabled={isLoading || !prompt.trim()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl text-white bg-gradient-to-r from-[#7950F2] via-[#9775fa] to-[#7950F2] bg-[length:200%_100%] transition-all flex items-center gap-2
                  ${isLoading || !prompt.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:from-[#6741d9] hover:via-[#845ef7] hover:to-[#6741d9] animate-[shine_2s_ease-in-out_infinite] animate-[gradient_3s_ease-in-out_infinite]'
                  }`}
              >
                <PlusIcon className="w-5 h-5" />
                <span>시작하기</span>
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <button
                onClick={() => setPrompt("마케팅 문구 작성하기")}
                className="px-4 py-2 rounded-full bg-white dark:bg-[#1e2128] border border-[#e5e7eb] dark:border-[#2b2f38] text-sm hover:border-[#7950F2] hover:bg-[#7950F2]/5 transition-all"
              >
                "마케팅 문구 작성하기"
              </button>
              <button
                onClick={() => setPrompt("웹서비스 만들기")}
                className="px-4 py-2 rounded-full bg-white dark:bg-[#1e2128] border border-[#e5e7eb] dark:border-[#2b2f38] text-sm hover:border-[#7950F2] hover:bg-[#7950F2]/5 transition-all"
              >
                "웹서비스 만들기"
              </button>
              <button
                onClick={() => setPrompt("디자인 초안 제작하기")}
                className="px-4 py-2 rounded-full bg-white dark:bg-[#1e2128] border border-[#e5e7eb] dark:border-[#2b2f38] text-sm hover:border-[#7950F2] hover:bg-[#7950F2]/5 transition-all"
              >
                "디자인 초안 제작하기"
              </button>
              <button
                onClick={() => setPrompt("영상 콘텐츠 만들기")}
                className="px-4 py-2 rounded-full bg-white dark:bg-[#1e2128] border border-[#e5e7eb] dark:border-[#2b2f38] text-sm hover:border-[#7950F2] hover:bg-[#7950F2]/5 transition-all"
              >
                "영상 콘텐츠 만들기"
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {isLoading && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7950F2]"></div>
                <p className="mt-2 text-sm text-gray-400">AI가 도구를 찾고 있습니다...</p>
              </div>
            )}

            {recommendation && (
              <div className="mt-6 space-y-4">
                {/* 여기에 추천 결과를 표시 */}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1e2128] p-8 rounded-xl w-full max-w-md mx-4 border border-[#2b2f38]">
            <h2 className="text-xl font-bold text-white mb-4">로그인이 필요합니다</h2>
            <p className="text-gray-400 mb-6">AI 추천 기능은 로그인 후 이용할 수 있습니다.</p>
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 w-full bg-[#2b2f38] hover:bg-[#3d4251] text-white py-3 rounded-lg transition-colors"
              >
                <img
                  src="/google-icon.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                Google로 계속하기
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full py-3 text-gray-400 hover:text-white transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AIRecommend; 