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
  const [imageError, setImageError] = useState(false);
  const { isFavorited, isLoading, toggleFavorite } = useFavorite(id);

  useEffect(() => {
    fetchToolDetails();
  }, [id]);

  const fetchToolDetails = async () => {
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

      if (error) {
        console.error('Error fetching tool details:', error);
        throw error;
      }
      
      setTool(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const renderPlaceholder = () => {
    return (
      <div className="w-full h-full bg-[#1e2128] flex items-center justify-center">
        <div className="text-5xl font-bold text-gray-600">
          {tool?.title ? tool.title.charAt(0).toUpperCase() : 'AI'}
        </div>
      </div>
    );
  };

  const getPriceTypeLabel = (type) => {
    switch (type) {
      case 'free':
        return '무료';
      case 'paid':
        return '유료';
      case 'free_trial':
        return '무료체험';
      default:
        return type;
    }
  };

  const getPriceTypeColor = (type) => {
    switch (type) {
      case 'free':
        return 'bg-green-500/20 text-green-500';
      case 'paid':
        return 'bg-red-500/20 text-red-500';
      case 'free_trial':
        return 'bg-yellow-500/20 text-yellow-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (!tool) return <div className="pt-[60px] text-center">로딩중...</div>;

  return (
    <main className="pt-[60px] pb-[80px] px-4 max-w-4xl mx-auto">
      {/* Tool Header */}
      <div className="bg-[#1e2128] rounded-xl overflow-hidden mb-6 border border-[#2b2f38]">
        <div className="relative aspect-[2/1] bg-white">
          {tool.image_url && !imageError ? (
            <div className="w-full h-full flex items-center justify-center p-12">
              <img
                src={tool.image_url}
                alt={tool.title}
                className="max-w-[400px] w-full h-full object-contain"
                onError={handleImageError}
              />
            </div>
          ) : (
            renderPlaceholder()
          )}
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {tool.tool_categories?.map((tc) => (
                  <span
                    key={tc.categories.name}
                    className="text-xs bg-[#2b2f38] text-gray-300 px-2 py-1 rounded-full"
                  >
                    {tc.categories.name}
                  </span>
                ))}
                <span className={`text-xs px-2 py-1 rounded-full ${getPriceTypeColor(tool.price_type)}`}>
                  {getPriceTypeLabel(tool.price_type)}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{tool.title}</h1>
              <p className="text-gray-400 whitespace-pre-wrap">{tool.description}</p>
            </div>
            <button
              onClick={toggleFavorite}
              disabled={isLoading}
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
