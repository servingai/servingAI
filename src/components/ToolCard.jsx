import React, { useState } from 'react';

const ToolCard = ({ title, description, price_type, image_url, tool_categories }) => {
  console.log('ToolCard props:', { title, description, price_type, image_url, tool_categories }); // 디버깅용 로그

  const [imageError, setImageError] = useState(false);

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

  return (
    <div className="bg-[#1e2128] rounded-xl overflow-hidden border border-[#2b2f38] hover:border-[#3d4251] transition-colors h-[360px] flex flex-col">
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
            {Array.isArray(tool_categories) && [...new Set(tool_categories.map(tc => tc.categories.name))].map((categoryName) => (
              <span
                key={categoryName}
                className="text-xs bg-[#2b2f38] text-gray-300 px-2 py-1 rounded-full"
              >
                {categoryName}
              </span>
            ))}
            <span className={`text-xs px-2 py-1 rounded-full ${getPriceTypeColor(price_type)}`}>
              {getPriceTypeLabel(price_type)}
            </span>
          </div>
          <h3 className="mt-2.5 font-medium text-[15px] line-clamp-1">{title}</h3>
          <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{description}</p>
        </div>
        <div className="mt-3">
          <button className="w-full bg-[#2b2f38] hover:bg-[#3d4251] text-sm py-2 rounded-lg transition-colors">
            자세히 보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolCard;
