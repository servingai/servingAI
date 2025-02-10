import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useFavorite } from '../hooks/useFavorite';

const ToolCard = ({ id, title, description, price_type, image_url, categories }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const { isFavorited, isLoading, toggleFavorite } = useFavorite(id);

  const priceTypeConfig = {
    'free': {
      label: '무료',
      className: 'bg-green-500/20 text-green-500'
    },
    'paid': {
      label: '유료',
      className: 'bg-red-500/20 text-red-500'
    },
    'free_trial': {
      label: '무료체험',
      className: 'bg-yellow-500/20 text-yellow-500'
    }
  }[price_type] || {
    label: price_type,
    className: 'bg-gray-500/20 text-gray-500'
  };

  const handleImageError = () => {
    setImageError(true);
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
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 bg-[#3d4251] rounded-lg" />
          </div>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col min-h-0">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {categories && categories.length > 0 && (
              categories.map((category, index) => (
                <span
                  key={index}
                  className="text-xs bg-[#2b2f38] text-gray-300 px-2 py-1 rounded-full"
                >
                  {category}
                </span>
              ))
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${priceTypeConfig.className}`}>
              {priceTypeConfig.label}
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
