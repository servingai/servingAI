import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useFavorite } from '../hooks/useFavorite';

const ToolCard = ({ id, title, description, price_type, image_url, tool_categories }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const { isFavorited, isLoading, toggleFavorite } = useFavorite(id);

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

  const handleImageError = () => {
    setImageError(true);
  };

  const renderPlaceholder = () => {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-2xl font-bold text-gray-600">{title.charAt(0)}</div>
      </div>
    );
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    await toggleFavorite();
  };

  const handleCardClick = () => {
    navigate(`/tool/${id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-[#1e2128] rounded-xl overflow-hidden border border-[#2b2f38] hover:border-[#3d4251] transition-colors h-[360px] flex flex-col relative group cursor-pointer"
    >
      <button
        onClick={handleFavoriteClick}
        disabled={isLoading}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
      >
        {isFavorited ? (
          <HeartSolid className="w-5 h-5 text-red-500" />
        ) : (
          <HeartOutline className="w-5 h-5 text-white" />
        )}
      </button>
      
      <div className="w-full h-[180px] bg-white flex-shrink-0 p-6">
        {!imageError ? (
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={image_url}
              className="max-w-full max-h-full object-contain"
              alt={title}
              onError={handleImageError}
            />
          </div>
        ) : (
          renderPlaceholder()
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col min-h-0">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {console.log('Tool categories raw:', tool_categories)}
            {Array.isArray(tool_categories) && tool_categories.map((tc, index) => {
              console.log('Single category:', tc);
              return (
                <span
                  key={`${tc.categories?.name || index}`}
                  className="text-xs bg-[#2b2f38] text-gray-300 px-2 py-1 rounded-full"
                >
                  {tc.categories?.name || '카테고리 없음'}
                </span>
              );
            })}
            <span className={`text-xs px-2 py-1 rounded-full ${getPriceTypeColor(price_type)}`}>
              {getPriceTypeLabel(price_type)}
            </span>
          </div>
          <h3 className="mt-2.5 font-medium text-[15px] line-clamp-1">{title}</h3>
          <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{description}</p>
        </div>
        <div className="mt-3">
          <div className="w-full bg-[#2b2f38] hover:bg-[#3d4251] text-sm py-2 rounded-lg transition-colors text-center">
            자세히 보기
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolCard;
