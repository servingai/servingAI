import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { ko } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { jobCategories } from '../constants/jobCategories';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    job_category: '',
    job_title: '',
    years_of_experience: '',
    organization: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        job_category: profile.job_category || '',
        job_title: profile.job_title || '',
        years_of_experience: profile.years_of_experience || '',
        organization: profile.organization || ''
      });
    }
  }, [profile]);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }
      
      console.log('Current user:', user);
      setUser(user);

      // 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile data:', profileError);
        setError('프로필 데이터를 불러오는 중 오류가 발생했습니다.');
        return;
      }

      console.log('Profile data:', profileData);
      setProfile(profileData);

      // 작성한 리뷰 가져오기
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          tool:tools (
            id,
            title,
            description,
            image_url,
            price_type
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        return;
      }

      console.log('Raw reviews data:', reviewsData);

      // 이미지 URL 유효성 검사
      const processedReviews = reviewsData?.map(review => ({
        ...review,
        tool: review.tool ? {
          ...review.tool,
          image_url: review.tool.image_url || null // 빈 문자열이나 undefined인 경우 null로 처리
        } : null
      }));

      console.log('Processed reviews data:', processedReviews);
      setReviews(processedReviews || []);

    } catch (error) {
      console.error('Error:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 리뷰 수정
  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!editingReview || !editingReview.content.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          content: editingReview.content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingReview.id);

      if (error) throw error;

      setEditingReview(null);
      fetchUserData();
    } catch (error) {
      console.error('Error updating review:', error);
      setError('리뷰 수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 리뷰 삭제
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('리뷰를 삭제하시겠습니까?')) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      fetchUserData();
    } catch (error) {
      console.error('Error deleting review:', error);
      setError('리뷰 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          job_category: profileForm.job_category,
          job_title: profileForm.job_title,
          years_of_experience: parseInt(profileForm.years_of_experience) || null,
          organization: profileForm.organization
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // 프로필 정보 새로고침
      const { data: updatedProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(updatedProfile);
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('프로필 수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
    } catch (error) {
      return new Date(date).toLocaleDateString();
    }
  };

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
    <main className="pt-[60px] pb-[80px] px-4 max-w-4xl mx-auto">
      {/* 프로필 정보 */}
      {profile && (
        <div className="bg-[#1e2128] rounded-xl p-6 mb-6 border border-[#2b2f38]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#2b2f38] flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full rounded bg-white object-contain p-1"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                    {profile.full_name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{profile.full_name || '사용자'}</h2>
              </div>
            </div>
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-4 py-2 bg-[#2b2f38] text-white rounded-lg text-sm hover:bg-[#3d4251] transition-colors"
            >
              프로필 수정
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400">직군</h3>
                <p className="mt-1 text-base font-medium text-white">
                  {jobCategories.find(cat => cat.value === profile.job_category)?.label || '미설정'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">직무</h3>
                <p className="mt-1 text-base font-medium text-white">
                  {profile.job_title || '미설정'}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400">연차</h3>
                <p className="mt-1 text-base font-medium text-white">
                  {profile.years_of_experience ? `${profile.years_of_experience}년차` : '미설정'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400">소속</h3>
                <p className="mt-1 text-base font-medium text-white">
                  {profile.organization || '미설정'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 작성한 리뷰 */}
      <div className="bg-[#1e2128] rounded-xl p-6 border border-[#2b2f38]">
        <h2 className="text-xl font-bold text-white mb-4">작성한 리뷰</h2>
        {reviews?.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-lg border border-[#2b2f38] hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <Link
                    to={`/tool/${review.tool_id}`}
                    className="group flex items-center gap-3"
                  >
                    <div className="w-10 h-10 flex-shrink-0">
                      {review.tool?.image_url ? (
                        <img
                          src={review.tool.image_url}
                          alt={review.tool?.title}
                          className="w-full h-full rounded bg-white object-contain p-1"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full rounded bg-[#2b2f38] items-center justify-center ${!review.tool?.image_url ? 'flex' : 'hidden'}`}
                      >
                        <span className="text-lg font-bold text-gray-400">
                          {review.tool?.title?.charAt(0) || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {review.tool?.title || '알 수 없는 서비스'}
                      </span>
                      <span className="text-sm text-gray-400">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingReview(review)}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <p className="text-gray-300 whitespace-pre-wrap ml-[52px]">{review.content}</p>
                <p className="text-sm text-gray-400 mt-2 ml-[52px]">
                  {formatDate(review.created_at)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">아직 작성한 리뷰가 없습니다.</p>
        )}
      </div>

      {/* 리뷰 수정 폼 */}
      {editingReview && (
        <form onSubmit={handleUpdateReview} className="mb-6">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <span>{editingReview.tool.title}</span>
              <span>•</span>
              <span>{formatDate(editingReview.created_at)}</span>
            </div>
            <textarea
              value={editingReview.content}
              onChange={(e) => setEditingReview({...editingReview, content: e.target.value})}
              className="w-full px-4 py-3 bg-[#2b2f38] border border-[#3d4251] rounded-xl text-sm focus:outline-none focus:border-[#4d5261] hover:border-[#4d5261] transition-colors"
              rows="3"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? '수정 중...' : '수정 완료'}
              </button>
            </div>
          </div>
        </form>
      )}
      
      {/* 프로필 수정 모달 */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1e2128] rounded-xl p-6 max-w-md w-full mx-4 border border-[#2b2f38]">
            <h2 className="text-xl font-bold text-white mb-6">프로필 수정</h2>
            <form onSubmit={handleUpdateProfile}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    직군
                  </label>
                  <select
                    value={profileForm.job_category}
                    onChange={(e) => setProfileForm({...profileForm, job_category: e.target.value})}
                    className="w-full px-4 py-2 bg-[#2b2f38] border border-[#3d4251] rounded-lg text-white text-sm focus:outline-none focus:border-[#4d5261]"
                  >
                    <option value="">선택하세요</option>
                    {jobCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    직무
                  </label>
                  <input
                    type="text"
                    value={profileForm.job_title}
                    onChange={(e) => setProfileForm({...profileForm, job_title: e.target.value})}
                    className="w-full px-4 py-2 bg-[#2b2f38] border border-[#3d4251] rounded-lg text-white text-sm focus:outline-none focus:border-[#4d5261]"
                    placeholder="예: UI/UX 디자이너"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    연차
                  </label>
                  <input
                    type="number"
                    value={profileForm.years_of_experience}
                    onChange={(e) => setProfileForm({...profileForm, years_of_experience: e.target.value})}
                    className="w-full px-4 py-2 bg-[#2b2f38] border border-[#3d4251] rounded-lg text-white text-sm focus:outline-none focus:border-[#4d5261]"
                    placeholder="예: 3"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    소속
                  </label>
                  <input
                    type="text"
                    value={profileForm.organization}
                    onChange={(e) => setProfileForm({...profileForm, organization: e.target.value})}
                    className="w-full px-4 py-2 bg-[#2b2f38] border border-[#3d4251] rounded-lg text-white text-sm focus:outline-none focus:border-[#4d5261]"
                    placeholder="예: 카카오"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Profile;
