import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { useNavigate } from 'react-router-dom';

const Auth = ({ onClose }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // 로그인 성공 후 프로필 정보 체크
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('job_category, job_title')
          .eq('user_id', data.user.id)
          .single();

        onClose();
        
        // 필수 프로필 정보가 없으면 온보딩으로 리다이렉트
        if (!profile?.job_category || !profile?.job_title) {
          navigate('/onboarding');
        }
      } else {
        // 회원가입
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        // 기본 프로필 생성
        if (authData?.user) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([
              {
                user_id: authData.user.id,
                full_name: email.split('@')[0], // 임시로 이메일의 아이디 부분을 이름으로 사용
                avatar_url: null,
                job_category: '',
                job_title: '',
                years_of_experience: 0,
                organization: ''
              }
            ]);
          
          if (profileError) {
            console.error('프로필 생성 실패:', profileError);
            throw new Error('프로필 생성에 실패했습니다. 관리자에게 문의해주세요.');
          }
        }

        alert('가입 확인 이메일을 확인해주세요.');
        onClose();
        // 온보딩 페이지로 리다이렉트
        navigate('/onboarding');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {isLogin ? '로그인' : '회원가입'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-custom py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? '처리중...' : isLogin ? '로그인' : '회원가입'}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full text-center text-sm text-gray-400 mt-4"
        >
          {isLogin ? '회원가입하기' : '로그인하기'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
