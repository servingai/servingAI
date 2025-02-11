import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { jobCategories } from '../../constants/jobCategories';

export const EditProfileForm = ({ profile, onClose, onSave }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    job_category: profile?.job_category || '',
    job_title: profile?.job_title || '',
    years_of_experience: profile?.years_of_experience || '',
    organization: profile?.organization || ''
  });

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

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/');
        return;
      }

      const profileData = {
        user_id: session.user.id,
        full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
        avatar_url: session.user.user_metadata?.avatar_url || '',
        job_category: formData.job_category,
        job_title: formData.job_title,
        years_of_experience: parseInt(formData.years_of_experience) || 0,
        organization: formData.organization || ''
      };

      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'user_id',
          returning: 'minimal'
        });

      if (updateError) throw updateError;

      if (onSave) {
        onSave(profileData);
      }
      
      onClose();
      navigate('/');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          직군<span className="text-red-500 ml-1">*</span>
        </label>
        <select
          name="job_category"
          value={formData.job_category}
          onChange={handleChange}
          className="w-full bg-[#2b2f38] border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
        <label className="block text-sm font-medium text-gray-200 mb-2">
          직무<span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="text"
          name="job_title"
          value={formData.job_title}
          onChange={handleChange}
          placeholder="예: 프론트엔드 개발자"
          className="w-full bg-[#2b2f38] border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">연차</label>
        <input
          type="number"
          name="years_of_experience"
          value={formData.years_of_experience}
          onChange={handleChange}
          min="0"
          max="50"
          placeholder="0"
          className="w-full bg-[#2b2f38] border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">소속</label>
        <input
          type="text"
          name="organization"
          value={formData.organization}
          onChange={handleChange}
          placeholder="회사/조직명"
          className="w-full bg-[#2b2f38] border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors font-medium ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>저장 중...</span>
          </div>
        ) : (
          '프로필 저장'
        )}
      </button>
    </form>
  );
};
