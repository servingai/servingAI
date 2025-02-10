import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUser(user);

      // 프로필 정보 가져오기
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      // 찜한 도구 가져오기
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('*, tools(*)')
        .eq('user_id', user.id);
      
      setFavorites(favoritesData);

      // 작성한 리뷰 가져오기
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, tools(*)')
        .eq('user_id', user.id);
      
      setReviews(reviewsData);

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  if (!user) {
    return (
      <div className="pt-[60px] pb-[80px] px-4 text-center">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <main className="pt-[60px] pb-[80px] px-4">
      {/* 프로필 정보 */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-4">
          <img
            src={profile?.avatar_url || 'https://via.placeholder.com/100'}
            alt="Profile"
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h1 className="text-xl font-bold">{profile?.username || '사용자'}</h1>
            <p className="text-gray-400">{user.email}</p>
          </div>
        </div>
      </div>

      {/* 찜한 도구 */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-bold mb-3">찜한 도구</h2>
        <div className="space-y-3">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="flex items-center gap-3 p-2 bg-gray-700 rounded-lg"
            >
              <img
                src={favorite.tools.image_url}
                alt={favorite.tools.title}
                className="w-12 h-12 rounded object-cover"
              />
              <div>
                <h3 className="font-medium">{favorite.tools.title}</h3>
                <p className="text-sm text-gray-400">{favorite.tools.category}</p>
              </div>
            </div>
          ))}
          {favorites.length === 0 && (
            <p className="text-gray-400 text-center">찜한 도구가 없습니다.</p>
          )}
        </div>
      </div>

      {/* 작성한 리뷰 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-bold mb-3">작성한 리뷰</h2>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-t border-gray-700 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium">{review.tools.title}</h3>
                <span className="text-yellow-400 text-sm">
                  {'★'.repeat(review.rating)}
                </span>
              </div>
              <p className="text-sm text-gray-300">{review.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-gray-400 text-center">작성한 리뷰가 없습니다.</p>
          )}
        </div>
      </div>
    </main>
  );
};

export default Profile;
