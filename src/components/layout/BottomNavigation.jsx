import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, HeartIcon, UserIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, HeartIcon as HeartSolid, UserIcon as UserSolid, SparklesIcon as SparklesSolid } from '@heroicons/react/24/solid';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1e2128] border-t border-[#2b2f38] px-6 py-2 z-50">
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
          to="/recommend"
          className={`flex flex-col items-center text-sm ${
            location.pathname === '/recommend' ? 'text-white' : 'text-gray-400'
          }`}
        >
          {location.pathname === '/recommend' ? (
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
    </nav>
  );
};

export default BottomNavigation;
