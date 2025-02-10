import React, { useState } from 'react';
import { supabase } from '../config/supabase';

const ReviewForm = ({ toolId, onSuccess }) => {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('리뷰를 작성하려면 로그인이 필요합니다.');
        return;
      }

      const { error } = await supabase
        .from('reviews')
        .insert([
          {
            tool_id: toolId,
            user_id: user.id,
            content,
            rating
          }
        ]);

      if (error) throw error;
      
      setContent('');
      setRating(5);
      onSuccess?.();
      
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('리뷰 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">평점</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={`text-xl ${
                value <= rating ? 'text-yellow-400' : 'text-gray-400'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">리뷰 내용</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white"
          rows="4"
          placeholder="이 AI 도구에 대한 경험을 공유해주세요"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-custom py-2 rounded-lg font-medium disabled:opacity-50"
      >
        {isSubmitting ? '제출 중...' : '리뷰 작성'}
      </button>
    </form>
  );
};

export default ReviewForm;
