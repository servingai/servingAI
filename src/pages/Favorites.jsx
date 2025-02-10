import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select(`
          *,
          tools!inner (
            id,
            title,
            description,
            image_url,
            price_type,
            tool_categories!inner (
              categories!inner (
                name
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (favoritesError) throw favoritesError;

      setFavorites(favoritesData || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('찜한 도구를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfavorite = async (toolId) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('tool_id', toolId);

      if (error) throw error;

      // 목록에서 제거
      setFavorites(favorites.filter(fav => fav.tool_id !== toolId));
    } catch (error) {
      console.error('Error removing favorite:', error);
      setError('찜 해제 중 오류가 발생했습니다.');
    }
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

  const handleCardClick = (toolId) => {
    navigate(`/tool/${toolId}`);
  };

  if (!user) {
    return (
      <div className="pt-[60px] pb-[80px] px-4 text-center">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pt-[60px] pb-[80px] px-4 text-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-[60px] pb-[80px] px-4 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <main className="pt-[60px] pb-[80px] px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 mt-8">찜한 도구</h1>
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                onClick={() => handleCardClick(favorite.tool_id)}
                className="bg-[#1e2128] rounded-xl overflow-hidden border border-[#2b2f38] hover:border-[#3d4251] transition-colors h-[360px] flex flex-col relative group cursor-pointer"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnfavorite(favorite.tool_id);
                  }}
                  className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <HeartSolid className="w-5 h-5 text-red-500" />
                </button>
                
                <div className="w-full h-[180px] bg-white flex-shrink-0 p-6">
                  {favorite.tools?.image_url ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={favorite.tools.image_url}
                        alt={favorite.tools?.title}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-600">
                        {favorite.tools?.title?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-4 flex flex-col min-h-0">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      {favorite.tools?.tool_categories?.map((tc, index) => (
                        <span
                          key={index}
                          className="text-xs bg-[#2b2f38] text-gray-300 px-2 py-1 rounded-full"
                        >
                          {tc.categories?.name}
                        </span>
                      ))}
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriceTypeColor(favorite.tools?.price_type)}`}>
                        {getPriceTypeLabel(favorite.tools?.price_type)}
                      </span>
                    </div>
                    <h3 className="mt-2.5 font-medium text-[15px] line-clamp-1">
                      {favorite.tools?.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1.5 line-clamp-2">
                      {favorite.tools?.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">아직 찜한 도구가 없습니다.</p>
        )}
      </div>
    </main>
  );
};

export default Favorites;
