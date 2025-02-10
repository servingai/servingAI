import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { HomeIcon, HeartIcon, UserIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, HeartIcon as HeartSolid, UserIcon as UserSolid, SparklesIcon as SparklesSolid } from '@heroicons/react/24/solid';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleHomeClick = () => {
    // 현재 홈 페이지에 있을 경우에만 필터 초기화
    if (location.pathname === '/') {
      setSearchParams('');
    }
    navigate('/');
  };

  const handleAIRecommendClick = (e) => {
    e.preventDefault();
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 2000);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1e2128] border-t border-[#2b2f38] px-6 py-2 z-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-around items-center">
            <button
              onClick={handleHomeClick}
              className={`flex flex-col items-center text-sm ${
                location.pathname === '/' ? 'text-white' : 'text-gray-400'
              }`}
            >
              {location.pathname === '/' ? (
                <HomeSolid className="w-6 h-6" />
              ) : (
                <HomeIcon className="w-6 h-6" />
              )}
              <span className="mt-1">홈</span>
            </button>

            <Link
              to="#"
              onClick={handleAIRecommendClick}
              className="flex flex-col items-center text-sm text-gray-400"
            >
              {location.pathname === '/ai-recommend' ? (
                <SparklesSolid className="w-6 h-6" />
              ) : (
                <SparklesIcon className="w-6 h-6" />
              )}
              <span className="mt-1">AI추천</span>
            </Link>

            <Link
              to="/favorites"
              className={`flex flex-col items-center text-sm ${
                location.pathname === '/favorites' ? 'text-white' : 'text-gray-400'
              }`}
            >
              {location.pathname === '/favorites' ? (
                <HeartSolid className="w-6 h-6" />
              ) : (
                <HeartIcon className="w-6 h-6" />
              )}
              <span className="mt-1">찜</span>
            </Link>

            <Link
              to="/profile"
              className={`flex flex-col items-center text-sm ${
                location.pathname === '/profile' ? 'text-white' : 'text-gray-400'
              }`}
            >
              {location.pathname === '/profile' ? (
                <UserSolid className="w-6 h-6" />
              ) : (
                <UserIcon className="w-6 h-6" />
              )}
              <span className="mt-1">마이</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 준비중 팝업 */}
      {showComingSoon && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black/90 text-white px-6 py-3 rounded-xl text-base backdrop-blur-sm shadow-lg">
            준비중인 기능입니다!
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNavigation;
