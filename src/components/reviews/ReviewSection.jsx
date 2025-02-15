import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { ko } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

export const ReviewSection = ({ toolId, className, isProfileView }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [editedReviewContent, setEditedReviewContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tools, setTools] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredTools, setFilteredTools] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  // 도구 목록 불러오기
  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('id, title');
      if (error) throw error;
      setTools(data);
    } catch (error) {
      console.error('Error fetching tools:', error);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  // 리뷰 목록 불러오기
  const fetchReviews = async () => {
    try {
      console.log('Fetching reviews for toolId:', toolId);
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          tools!reviews_tool_id_fkey (
            id,
            title,
            image_url,
            website_url
          ),
          review_likes (
            user_id
          ),
          review_tool_mentions!review_tool_mentions_review_id_fkey (
            tools!review_tool_mentions_tool_id_fkey (
              id,
              title,
              image_url,
              website_url
            )
          )
        `)
        .eq('tool_id', toolId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // 사용자 프로필 정보 가져오기
      const userIds = reviewsData?.map(review => review.user_id) || [];
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', userIds);

      // 프로필 데이터를 매핑하여 캐시
      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {});

      const reviewsWithData = reviewsData?.map(review => ({
        ...review,
        tool: {
          ...review.tools,
          logo_url: review.tools?.image_url
        },
        profile: profilesMap[review.user_id] || {
          full_name: '알 수 없는 사용자',
          avatar_url: '/default-avatar.png',
          job_title: '직무 미설정'
        },
        likes: review.review_likes?.length || 0,
        isLiked: review.review_likes?.some(like => like.user_id === user?.id) || false,
        mentionedTools: review.review_tool_mentions?.map(mention => ({
          ...mention.tools,
          logo_url: mention.tools?.image_url
        })) || []
      })) || [];

      console.log('Processed reviews:', reviewsWithData);
      setReviews(reviewsWithData);
      setError(null);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('리뷰를 불러오는 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (toolId) {
      fetchReviews();
    }
  }, [toolId, fetchReviews]);

  // 리뷰 내용에서 @mentions 처리
  const processReviewContent = (content) => {
    const mentionRegex = /@(\w+)/g;
    const toolMentions = [];
    let lastIndex = 0;
    const parts = [];

    content.replace(mentionRegex, (match, toolName, index) => {
      const tool = tools.find(t => 
        t.title.toLowerCase() === toolName.toLowerCase() ||
        t.title.replace(/\s+/g, '').toLowerCase() === toolName.toLowerCase()
      );
      
      if (tool) {
        toolMentions.push(tool.id);
        parts.push(content.slice(lastIndex, index));
        parts.push(`@[${tool.title}](${tool.id})`);
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

  // 리뷰 작성
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!newReview.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { processedContent, toolMentions } = processReviewContent(newReview);

      const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .insert([
          {
            tool_id: toolId,
            user_id: user.id,
            content: processedContent || ''  
          }
        ])
        .select()
        .single();

      if (reviewError) throw reviewError;

      if (toolMentions && toolMentions.length > 0) {
        const { error: mentionError } = await supabase
          .from('review_tool_mentions')
          .insert(
            toolMentions.map(mentionedToolId => ({
              review_id: review.id,
              tool_id: mentionedToolId
            }))
          );

        if (mentionError) throw mentionError;
      }

      setNewReview('');
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('리뷰 작성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 리뷰 좋아요 토글
  const handleLikeToggle = async (reviewId) => {
    if (!user) return;

    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      if (review.isLiked) {
        // 좋아요 취소
        await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id);
      } else {
        // 좋아요 추가
        await supabase
          .from('review_likes')
          .insert([
            {
              review_id: reviewId,
              user_id: user.id
            }
          ]);
      }

      fetchReviews();
    } catch (error) {
      console.error('Error toggling like:', error);
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

      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      setError('리뷰 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 리뷰 수정
  const handleEditReview = async (reviewId, editedContent) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // 기존 tool mentions 삭제
      const { error: deleteMentionsError } = await supabase
        .from('review_tool_mentions')
        .delete()
        .eq('review_id', reviewId);

      if (deleteMentionsError) throw deleteMentionsError;

      // 새로운 content와 mentions 처리
      const { processedContent, toolMentions } = processReviewContent(editedContent);

      // 리뷰 내용 업데이트
      const { error: updateError } = await supabase
        .from('reviews')
        .update({ content: processedContent || '' })
        .eq('id', reviewId)
        .eq('user_id', user.id);

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
      fetchReviews();
      setEditingReview(null);
    } catch (error) {
      console.error('Error editing review:', error);
      setError('리뷰 수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // @mention 제안 처리
  const handleInputChange = (e) => {
    const { value, selectionStart } = e.target;
    setNewReview(value);
    setCursorPosition(selectionStart);

    const lastAtSymbol = value.lastIndexOf('@', selectionStart);
    if (lastAtSymbol !== -1) {
      const searchTerm = value.slice(lastAtSymbol + 1, selectionStart).toLowerCase();
      const suggestions = tools
        .filter(tool => tool.title.toLowerCase().includes(searchTerm))
        .slice(0, 5);
      setFilteredTools(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // 도구 제안 선택
  const handleToolSelect = (tool) => {
    const lastAtSymbol = newReview.lastIndexOf('@', cursorPosition);
    const newValue = 
      newReview.slice(0, lastAtSymbol) + 
      '@' + tool.title + 
      newReview.slice(cursorPosition);
    setNewReview(newValue);
    setShowSuggestions(false);
  };

  // 날짜 포맷팅
  const formatDate = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
    } catch (error) {
      return new Date(date).toLocaleDateString();
    }
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 리뷰 작성 폼 - 도구 상세 페이지에서만 표시 */}
      {!isProfileView && user && (
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div className="relative">
            <textarea
              value={newReview}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              placeholder="AI도구 사용팁과 리뷰를 남겨보세요"
              className="w-full px-4 py-3 bg-[#1e2128] border border-[#2b2f38] rounded-xl text-sm focus:outline-none focus:border-[#3d4251] hover:border-[#3d4251] transition-colors"
              rows="3"
            />
            {showSuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-[#1e2128] border border-[#2b2f38] rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool)}
                    className="w-full px-4 py-2 text-left hover:bg-[#2b2f38] transition-colors"
                  >
                    {tool.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400">
              다른 도구를 태그하려면 '@'를 입력하세요
            </p>
            <button
              type="submit"
              disabled={isLoading || !newReview.trim()}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '작성 중...' : '작성하기'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className={`p-4 ${isProfileView ? 'bg-[#1e2128] rounded-xl' : 'border-b border-[#2b2f38]'} ${
              isProfileView ? '' : 'last:border-b-0'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {isProfileView ? (
                  <Link to={`/tool/${review.tool?.id}`} className="flex items-center hover:opacity-80">
                    <img
                      src={review.tool?.logo_url || '/placeholder-image.png'}
                      alt={review.tool?.title}
                      className="w-8 h-8 rounded-lg mr-2 object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder-image.png';
                      }}
                    />
                    <span className="text-white font-medium">
                      {review.tool?.title || '삭제된 도구'}
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center space-x-3">
                    <img
                      src={review.profile?.avatar_url || '/default-avatar.png'}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="font-medium">{review.profile?.full_name || '알 수 없는 사용자'}</div>
                      <div className="text-sm text-gray-400">
                        {review.profile?.job_title || '직무 미설정'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {!isProfileView && (
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
                )}
                {user?.id === review.user_id && (
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
                  placeholder="리뷰를 수정하세요."
                  className="w-full px-4 py-3 bg-[#1e2128] border border-[#2b2f38] rounded-xl text-sm focus:outline-none focus:border-[#3d4251] hover:border-[#3d4251] transition-colors"
                  rows="3"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">
                
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
                      수정
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm text-gray-200 whitespace-pre-wrap">
                  {renderReviewContent(review.content)}
                </div>
                <div className="mt-2 text-right text-sm text-gray-400">
                  {formatDate(review.created_at)}
                </div>
              </div>
            )}
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            {isProfileView ? '작성한 리뷰가 없습니다.' : '아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!'}
          </div>
        )}
      </div>
    </div>
  );
};
