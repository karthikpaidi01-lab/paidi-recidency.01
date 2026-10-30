import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Supports root domain for Vercel, and subpath for GitHub Pages if GITHUB_ACTIONS is true
  base: process.env.VITE_BASE_PATH || (process.env.GITHUB_ACTIONS ? '/paidi-recidency.01/' : '/'),
  plugins: [react()],
  server: {
    port: 5173,
    open: false
  }
});
