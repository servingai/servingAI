import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ onLoginClick, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      if (onSearch) {
        onSearch(searchQuery.trim());
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-gray-900/95 backdrop-blur">
      <nav className="px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-['Pacifico']">ServingAI</Link>
        <div className="relative flex-1 mx-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="AI 도구 검색"
            className="w-full px-4 py-2 bg-[#1e2128] border border-[#2b2f38] rounded-xl text-sm focus:outline-none focus:border-[#3d4251] hover:border-[#3d4251] transition-colors"
          />
          <button
            onClick={handleSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <i className="fas fa-search"></i>
          </button>
        </div>
        <button 
          onClick={onLoginClick}
          className="rounded-xl bg-[#2b2f38] hover:bg-[#3d4251] px-4 py-2 text-sm transition-colors"
        >
          로그인
        </button>
      </nav>
    </header>
  );
};

export default Header;
