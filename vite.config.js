import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/marcel-lutik-portfolio/',
  plugins: [react()],
});