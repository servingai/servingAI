import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { ReviewSection } from '../components/reviews/ReviewSection';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useFavorite } from '../hooks/useFavorite';

const ToolDetail = () => {
  const { id } = useParams();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { isFavorited, isLoading: favoriteLoading, toggleFavorite } = useFavorite(id);

  useEffect(() => {
    fetchTool();
  }, [id]);

  const fetchTool = async () => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select(`
          *,
          tool_categories!inner (
            categories!inner (
              name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // 카테고리 정보 정리
      const categories = data.tool_categories
        .map(tc => tc.categories?.name)
        .filter(Boolean);

      setTool({ ...data, categories });
    } catch (error) {
      console.error('Error fetching tool:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (loading) return <div className="pt-[60px] text-center">로딩중...</div>;
  if (!tool) return <div className="pt-[60px] text-center">도구를 찾을 수 없습니다.</div>;

  return (
    <main className="pt-[60px] pb-[80px] px-4 max-w-4xl mx-auto">
      <div className="bg-[#1e2128] border border-[#2b2f38] rounded-xl overflow-hidden mb-6">
        {/* 이미지 섹션 */}
        <div className="relative aspect-[2/1] bg-[#2b2f38] flex items-center justify-center p-4">
          {!imageError && tool.image_url ? (
            <img
              src={tool.image_url}
              alt={tool.title}
              className="max-w-full max-h-full object-contain"
              onError={handleImageError}
            />
          ) : (
            <div className="w-24 h-24 bg-[#3d4251] rounded-lg" />
          )}
        </div>

        {/* 내용 섹션 */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {tool.categories.map((category, index) => (
                  <span
                    key={index}
                    className="text-xs bg-[#2b2f38] text-gray-300 px-2 py-1 rounded-full"
                  >
                    {category}
                  </span>
                ))}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  tool.price_type === 'free'
                    ? 'bg-green-500/20 text-green-500'
                    : tool.price_type === 'paid'
                    ? 'bg-red-500/20 text-red-500'
                    : 'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {tool.price_type === 'free'
                    ? '무료'
                    : tool.price_type === 'paid'
                    ? '유료'
                    : '무료체험'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{tool.title}</h1>
              <p className="text-gray-400 whitespace-pre-wrap">{tool.description}</p>
            </div>
            <button
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className="flex-shrink-0 p-3 rounded-xl bg-[#2b2f38] hover:bg-[#3d4251] transition-colors"
            >
              {isFavorited ? (
                <HeartSolid className="w-6 h-6 text-red-500" />
              ) : (
                <HeartOutline className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
          
          {tool.url && (
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block w-full bg-blue-600 hover:bg-blue-700 text-center py-3 rounded-xl transition-colors"
            >
              서비스 바로가기
            </a>
          )}
        </div>
      </div>

      {/* Reviews */}
      <ReviewSection toolId={id} />
    </main>
  );
};

export default ToolDetail;
