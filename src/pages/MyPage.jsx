import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';

export default function MyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  if (!user) {
    return (
      <div className="pt-[60px] pb-[80px] px-4">
        <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center">
          <p className="text-lg text-white mb-4">회원가입 후 더 많은 기능을 이용해보세요!</p>
          <button
            onClick={handleGoogleLogin}
            className="px-6 py-2.5 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563eb] transition-colors"
          >
            회원가입하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[60px] pb-[80px] px-4">
      <h1 className="text-2xl font-bold mb-6">마이 페이지</h1>
      {/* 마이 페이지 컨텐츠 */}
    </div>
  );
}
