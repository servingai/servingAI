import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { ko } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { jobCategories } from '../constants/jobCategories';
import { useAuth } from '../contexts/AuthContext';
import { HeartIcon as HeartOutline, HeartIcon as HeartSolid, UserCircleIcon, PencilSquareIcon, TrashIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  const navigate = useNavigate();
  const { user: authUser, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [editedReviewContent, setEditedReviewContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    job_category: '',
    job_title: '',
    years_of_experience: '',
    organization: ''
  });

  useEffect(() => {
    if (authUser) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, [authUser]);

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
      // 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authUser.id)
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
          review_likes (
            user_id
          ),
          review_tool_mentions (
            tools (
              id,
              title
            )
          ),
          tools (
            id,
            title,
            image_url
          )
        `)
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        return;
      }

      console.log('Raw reviews data:', reviewsData);

      // 이미지 URL 유효성 검사
      const processedReviews = reviewsData?.map(review => ({
        ...review,
        tool: review.tools,
        likes: review.review_likes ? review.review_likes.length : 0,
        isLiked: review.review_likes ? review.review_likes.some(like => like.user_id === authUser?.id) : false,
        mentionedTools: review.review_tool_mentions?.map(mention => mention.tools) || []
      }));

      console.log('Processed reviews data:', processedReviews);
      setReviews(processedReviews || []);
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
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

  // 리뷰 수정 처리
  const handleEditReview = async (reviewId, content) => {
    try {
      // 기존 tool mentions 삭제
      const { error: deleteMentionsError } = await supabase
        .from('review_tool_mentions')
        .delete()
        .eq('review_id', reviewId);

      if (deleteMentionsError) throw deleteMentionsError;

      // 새로운 content와 mentions 처리
      const { processedContent, toolMentions } = processReviewContent(content);

      // 리뷰 내용 업데이트
      const { error: updateError } = await supabase
        .from('reviews')
        .update({ content: processedContent || '' })
        .eq('id', reviewId)
        .eq('user_id', authUser.id);

      if (updateError) throw updateError;

      // 새로운 mentions 추가
      if (toolMentions && toolMentions.length > 0) {
        const { error: mentionError } = await supabase
          .from('review_tool_mentions')
          .insert(
            toolMentions.map(mentionedToolId => ({
              review_id: reviewId,
              tool_id: mentionedToolId
            }))
          );

        if (mentionError) throw mentionError;
      }

      // 리뷰 목록 새로고침
      fetchUserData();
      setEditingReview(null);
    } catch (error) {
      console.error('Error editing review:', error);
      setError('리뷰 수정 중 오류가 발생했습니다.');
    }
  };

  // 리뷰 내용에서 @mentions 처리
  const processReviewContent = (content) => {
    const mentionRegex = /@(\w+)/g;
    const toolMentions = [];
    let lastIndex = 0;
    const parts = [];

    content.replace(mentionRegex, (match, toolName, index) => {
      const tool = jobCategories.find(t => 
        t.value.toLowerCase() === toolName.toLowerCase() ||
        t.value.replace(/\s+/g, '').toLowerCase() === toolName.toLowerCase()
      );
      
      if (tool) {
        toolMentions.push(tool.value);
        parts.push(content.slice(lastIndex, index));
        parts.push(`@[${tool.label}](${tool.value})`);
        lastIndex = index + match.length;
      } else {
        parts.push(content.slice(lastIndex, index + match.length));
        lastIndex = index + match.length;
      }
    });

    parts.push(content.slice(lastIndex));
    return {
      processedContent: parts.join(''),
      toolMentions
    };
  };

  // 리뷰 내용 렌더링
  const renderReviewContent = (content) => {
    if (!content) return '';

    const parts = [];
    let lastIndex = 0;
    const mentionRegex = /@\[(.*?)\]\((.*?)\)/g;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // 매치 이전의 일반 텍스트 추가
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      // 도구 링크 추가
      const [, toolName, toolId] = match;
      parts.push(
        <Link
          key={`${toolId}-${match.index}`}
          to={`/tool/${toolId}`}
          className="text-blue-500 hover:underline"
        >
          @{toolName}
        </Link>
      );

      lastIndex = mentionRegex.lastIndex;
    }

    // 남은 텍스트 추가
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts;
  };

  // 좋아요 토글
  const handleLikeToggle = async (reviewId) => {
    if (!authUser) return;

    try {
      const { data: existingLike } = await supabase
        .from('review_likes')
        .select()
        .eq('review_id', reviewId)
        .eq('user_id', authUser.id)
        .single();

      if (existingLike) {
        // 좋아요 취소
        await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', authUser.id);
      } else {
        // 좋아요 추가
        await supabase
          .from('review_likes')
          .insert([{ review_id: reviewId, user_id: authUser.id }]);
      }

      // 리뷰 목록 새로고침
      fetchUserData();
    } catch (error) {
      console.error('Error toggling like:', error);
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
        .eq('user_id', authUser.id);

      if (updateError) throw updateError;

      // 프로필 정보 새로고침
      const { data: updatedProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authUser.id)
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

  const handleLogout = async () => {
    try {
      // 1. Supabase 로그아웃
      await supabase.auth.signOut();
      
      // 2. 로컬 스토리지 초기화
      window.localStorage.clear();
      
      // 3. 세션 스토리지 초기화
      window.sessionStorage.clear();
      
      // 4. 모든 쿠키 삭제
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
      
      // 5. 페이지 새로고침 (강제 리로드)
      window.location.reload(true);
    } catch (error) {
      console.error('Error logging out:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  // 로그인하지 않은 경우 로그인 화면 표시
  if (!authUser) {
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
                <UserCircleIcon className="w-full h-full text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile.full_name || '사용자'}</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditingProfile(true)}
              className="text-gray-400 hover:text-white transition-colors p-1"
              title="프로필 수정"
            >
              <PencilSquareIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="로그아웃"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
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
                  <div className="flex items-center space-x-3">
                    <img
                      src={review.tool?.image_url || '/default-tool-image.png'}
                      alt={review.tool?.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <Link
                      to={`/tool/${review.tool?.id}`}
                      className="text-blue-500 hover:underline font-medium"
                    >
                      {review.tool?.title || '삭제된 도구'}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLikeToggle(review.id)}
                      className="flex items-center space-x-1 text-sm"
                    >
                      {review.isLiked ? (
                        <HeartSolid className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartOutline className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-gray-400">{review.likes}</span>
                    </button>
                    {authUser?.id === review.user_id && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingReview(review);
                            setEditedReviewContent(review.content);
                          }}
                          className="text-gray-400 hover:text-white transition-colors p-1"
                          title="리뷰 수정"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="리뷰 삭제"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {editingReview?.id === review.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editedReviewContent}
                      onChange={(e) => setEditedReviewContent(e.target.value)}
                      placeholder="AI도구 사용팁과 리뷰를 남겨보세요"
                      className="w-full px-4 py-3 bg-[#1e2128] border border-[#2b2f38] rounded-xl text-sm focus:outline-none focus:border-[#3d4251] hover:border-[#3d4251] transition-colors"
                      rows="3"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-400">
                        다른 도구를 태그하려면 '@'를 입력하세요
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingReview(null)}
                          className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-gray-600 hover:bg-gray-700"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleEditReview(review.id, editedReviewContent)}
                          className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700"
                        >
                          수정하기
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-gray-200 whitespace-pre-wrap">
                      {renderReviewContent(review.content)}
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      {formatDate(review.created_at)}
                    </div>
                  </div>
                )}
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
