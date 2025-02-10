import React from 'react';
import { supabase } from '../../config/supabase';

export const LoginButton = () => {
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

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-lg border hover:bg-gray-50 transition-colors"
    >
      <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
      Google로 계속하기
    </button>
  );
};
