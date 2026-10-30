import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/paidi-recidency.01/',
  plugins: [react()],
  server: {
    port: 5173,
    open: false
  }
});
