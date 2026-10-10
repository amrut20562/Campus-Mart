import '@testing-library/jest-dom';

// Provide mock environment variables for test execution
if (!import.meta.env.VITE_SUPABASE_URL) {
  import.meta.env.VITE_SUPABASE_URL = 'https://demo-test-project.supabase.co';
}
if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';
}
