import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="fixed bottom-0 w-full bg-gray-900/95 backdrop-blur border-t border-gray-800">
      <div className="grid grid-cols-4 py-2">
        <Link to="/" className="flex flex-col items-center gap-1">
          <i className="fas fa-home text-custom"></i>
          <span className="text-xs text-custom">홈</span>
        </Link>
        <Link to="/explore" className="flex flex-col items-center gap-1">
          <i className="fas fa-compass text-gray-400"></i>
          <span className="text-xs text-gray-400">둘러보기</span>
        </Link>
        <Link to="/favorites" className="flex flex-col items-center gap-1">
          <i className="fas fa-heart text-gray-400"></i>
          <span className="text-xs text-gray-400">찜</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center gap-1">
          <i className="fas fa-user text-gray-400"></i>
          <span className="text-xs text-gray-400">마이</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
