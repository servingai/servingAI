import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { jobCategories } from '../../constants/jobCategories';

export const OnboardingForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    job_category: '',
    job_title: '',
    years_of_experience: '',
    organization: ''
  });

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // 기존 프로필 확인
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // 프로필이 이미 있으면 메인 페이지로 이동
      if (profile?.job_category && profile?.job_title) {
        navigate('/');
        return;
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error checking profile:', error);
      setError('프로필 확인 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // 필수 필드 검증
    if (!formData.job_category || !formData.job_title) {
      setError('직무 분야와 직무는 필수 입력 항목입니다.');
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // 프로필 데이터 준비
      const profileData = {
        user_id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        job_category: formData.job_category,
        job_title: formData.job_title,
        years_of_experience: parseInt(formData.years_of_experience) || 0,
        organization: formData.organization || ''
      };

      // 기존 프로필 확인 및 업데이트/생성
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([profileData]);
        error = insertError;
      }

      if (error) throw error;

      // 성공 메시지 표시 후 홈으로 이동
      alert('프로필 정보가 저장되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen pt-[60px] pb-[80px] px-4">
      <div className="max-w-md mx-auto bg-[#1e2128] p-6 rounded-xl border border-[#2b2f38]">
        <h2 className="text-xl font-bold mb-6">프로필 설정</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">직군</label>
            <select
              name="job_category"
              value={formData.job_category}
              onChange={handleChange}
              className="w-full bg-[#2b2f38] rounded-lg px-3 py-2 text-white"
              required
            >
              <option value="">선택해주세요</option>
              {jobCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">직무</label>
            <input
              type="text"
              name="job_title"
              value={formData.job_title}
              onChange={handleChange}
              placeholder="예: 프론트엔드 개발자"
              className="w-full bg-[#2b2f38] rounded-lg px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">연차</label>
            <input
              type="number"
              name="years_of_experience"
              value={formData.years_of_experience}
              onChange={handleChange}
              min="0"
              max="50"
              className="w-full bg-[#2b2f38] rounded-lg px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">소속</label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              placeholder="회사/조직명"
              className="w-full bg-[#2b2f38] rounded-lg px-3 py-2 text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? '저장 중...' : '프로필 저장'}
          </button>
        </form>
      </div>
    </div>
  );
};
