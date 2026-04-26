// Constants/Colors.js
const commonColors = {
  primary: '#34495e',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  blue: '#6366F1',
};

export const lightTheme = {
  ...commonColors,
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#1F2937',      // Your textDark
  textSecondary: '#6B7280', // Your textLight
  border: '#E5E7EB',
  divider: '#F3F4F6',
  card: '#FFFFFF',
};

export const darkTheme = {
  ...commonColors,
  background: '#0F172A',   // Deep slate/black
  surface: '#1E293B',      // Lighter slate for cards
  text: '#F9FAFB',         // Near white
  textSecondary: '#9CA3AF', // lightGray
  border: '#334155',
  divider: '#1E293B',
  card: '#1E293B',
};

// Default export for legacy compatibility
export default lightTheme;