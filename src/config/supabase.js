import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables:', {
    url: supabaseUrl,
    key: supabaseAnonKey?.substring(0, 10) + '...'
  });
}

export const supabase = createClient(
  supabaseUrl || 'https://qhzznkfrwbokeabbcrgj.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoenpua2Zyd2Jva2VhYmJjcmdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxNzA2NzcsImV4cCI6MjA1NDc0NjY3N30.IvS9-_Lr3dsYWSK4v4N6ZDDugSH9tNDBag4qvNAMZtY'
);
