import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import ToolDetail from './pages/ToolDetail';
import Profile from './pages/Profile';
import Auth from './components/Auth';

function AppContent() {
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (query) => {
    navigate(`/?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Header 
        onLoginClick={() => setShowAuth(true)}
        onSearch={handleSearch}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tool/:id" element={<ToolDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <Navigation />
      {showAuth && <Auth onClose={() => setShowAuth(false)} />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
