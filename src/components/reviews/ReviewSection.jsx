import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { ko } from 'date-fns/locale';

export const ReviewSection = ({ toolId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 리뷰 목록 불러오기
  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('tool_id', toolId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      const userIds = reviewsData.map(review => review.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const reviewsWithProfiles = reviewsData.map(review => ({
        ...review,
        profiles: profilesData.find(profile => profile.user_id === review.user_id)
      }));

      setReviews(reviewsWithProfiles);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('리뷰를 불러오는 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [toolId]);

  // 리뷰 작성
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!newReview.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('reviews')
        .insert([
          {
            tool_id: toolId,
            user_id: user.id,
            content: newReview.trim()
          }
        ]);

      if (error) throw error;

      setNewReview('');
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('리뷰 작성 중 오류가 발생했습니다.');
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
      fetchReviews();
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

      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      setError('리뷰 삭제 중 오류가 발생했습니다.');
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

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-6">리뷰</h2>
      
      {/* 리뷰 작성 폼 */}
      {user && !editingReview && (
        <form onSubmit={handleSubmitReview} className="mb-8">
          <div className="flex flex-col space-y-2">
            <textarea
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder="이 AI 도구에 대한 경험을 공유해주세요"
              className="w-full px-4 py-3 bg-[#1e2128] border border-[#2b2f38] rounded-xl text-sm focus:outline-none focus:border-[#3d4251] hover:border-[#3d4251] transition-colors"
              rows="3"
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? '작성 중...' : '리뷰 작성'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 리뷰 수정 폼 */}
      {editingReview && (
        <form onSubmit={handleUpdateReview} className="mb-8">
          <div className="flex flex-col space-y-2">
            <textarea
              value={editingReview.content}
              onChange={(e) => setEditingReview({...editingReview, content: e.target.value})}
              className="w-full px-4 py-3 bg-[#1e2128] border border-[#2b2f38] rounded-xl text-sm focus:outline-none focus:border-[#3d4251] hover:border-[#3d4251] transition-colors"
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

      {!user && (
        <div className="mb-8 p-4 bg-[#1e2128] border border-[#2b2f38] rounded-xl text-sm text-gray-400">
          리뷰를 작성하려면 로그인이 필요합니다.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* 리뷰 목록 */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 bg-[#1e2128] border border-[#2b2f38] rounded-xl"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <img
                  src={review.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.profiles?.full_name || 'User')}`}
                  alt="User"
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="font-medium">
                    {review.profiles?.full_name || '사용자'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {review.profiles?.job_title || ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-400">
                  {formatDate(review.created_at)}
                </div>
                {user && user.id === review.user_id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingReview(review)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm whitespace-pre-wrap">{review.content}</div>
          </div>
        ))}
        
        {reviews.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            아직 작성된 리뷰가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};
