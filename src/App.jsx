import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import BottomNavigation from './components/layout/BottomNavigation';
import Home from './pages/Home';
import ToolDetail from './pages/ToolDetail';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import Onboarding from './pages/Onboarding';
import AuthCallback from './pages/AuthCallback';
import AIRecommend from './pages/AIRecommend';

function AppContent() {
  const navigate = useNavigate();

  const handleSearch = (query) => {
    navigate(`/?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="bg-[#13151c] text-white min-h-screen flex flex-col">
      <Header onSearch={handleSearch} />
      <main className="flex-1 pt-[52px]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tool/:id" element={<ToolDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth-callback" element={<AuthCallback />} />
          <Route path="/recommend" element={<AIRecommend />} />
        </Routes>
      </main>
      <BottomNavigation />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
