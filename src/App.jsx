import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import BottomNavigation from './components/layout/BottomNavigation';
import Home from './pages/Home';
import ToolDetail from './pages/ToolDetail';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import { OnboardingForm } from './components/auth/OnboardingForm';

function AppContent() {
  const navigate = useNavigate();

  const handleSearch = (query) => {
    navigate(`/?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen pb-[72px]">
      <Header onSearch={handleSearch} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tool/:id" element={<ToolDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/onboarding" element={<OnboardingForm />} />
      </Routes>
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
