// fig/supabaseConfig.js
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js'; // Fixed package name
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Quick debug check (Optional - remove for production)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing! Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: { 'x-application-name': 'clearday' },
    fetch: (...args) => fetch(...args).catch(err => {
      console.log("Network Bridge Error:", err);
      throw err;
    })
  }
});