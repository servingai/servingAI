import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const Header = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-gray-900/95 backdrop-blur">
      <nav className="px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-['Roboto'] font-bold tracking-wide">ServingAI</Link>
        <div className="relative flex-1 mx-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder=""
            className="w-full px-4 py-2 bg-[#1e2128] border border-[#2b2f38] rounded-xl text-sm focus:outline-none focus:border-[#3d4251] hover:border-[#3d4251] transition-colors"
          />
          <button
            onClick={handleSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <i className="fas fa-search"></i>
          </button>
        </div>
        
        {user ? (
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-xl bg-[#2b2f38] hover:bg-[#3d4251] px-4 py-2 text-sm transition-colors"
            >
              <img 
                src={user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}`}
                alt="User"
                className="w-6 h-6 rounded-full"
              />
              <span>{user.user_metadata.full_name || user.email}</span>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1e2128] border border-[#2b2f38] rounded-xl shadow-lg overflow-hidden">
                <button
                  onClick={() => {
                    handleLogout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#2b2f38] transition-colors"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleGoogleLogin}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#2b2f38] rounded-lg hover:bg-[#3d4251] transition-colors"
          >
            <img
              src="/google-icon.svg"
              alt="Google"
              className="w-4 h-4"
            />
            회원가입
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;
