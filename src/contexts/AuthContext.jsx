import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 세션 상태 업데이트
  const updateSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('Error updating session:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    // 초기 세션 체크
    updateSession().finally(() => setLoading(false));

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 로딩 중일 때는 아무것도 렌더링하지 않음
  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, updateSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
