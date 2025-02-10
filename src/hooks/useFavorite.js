import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useFavorite = (toolId) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (toolId && user) {
      checkFavoriteStatus();
    } else {
      setIsLoading(false);
      setIsFavorited(false);
    }
  }, [toolId, user]);

  const checkFavoriteStatus = async () => {
    try {
      console.log('Checking favorite status for tool:', toolId);
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('tool_id', toolId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking favorite status:', error);
        return;
      }

      console.log('Favorite status data:', data);
      setIsFavorited(!!data);
    } catch (error) {
      console.error('Error in checkFavoriteStatus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return false;
    }

    try {
      setIsLoading(true);
      console.log('Toggling favorite for tool:', toolId);

      if (isFavorited) {
        // 찜 해제
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('tool_id', toolId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error removing favorite:', error);
          alert('찜 해제 중 오류가 발생했습니다.');
          return false;
        }
        
        setIsFavorited(false);
      } else {
        // 찜하기
        const { error } = await supabase
          .from('favorites')
          .insert([
            {
              user_id: user.id,
              tool_id: toolId
            }
          ]);

        if (error) {
          console.error('Error adding favorite:', error);
          alert('찜하기 중 오류가 발생했습니다.');
          return false;
        }
        
        setIsFavorited(true);
      }

      return true;
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      alert('오류가 발생했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFavorited,
    isLoading,
    toggleFavorite
  };
};
