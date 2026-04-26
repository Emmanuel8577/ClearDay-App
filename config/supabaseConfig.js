// fig/supabaseConfig.js
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reference the variables from your .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },

  global: {
    headers: { 'x-application-name': 'clearday' },
    // This fetch option helps catch network errors faster
    fetch: (...args) => fetch(...args).catch(err => {
      console.log("Network Bridge Error:", err);
      throw err;
    })
  }
});

