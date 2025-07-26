import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cargar solo variables que comiencen con FIREBASE_
  const env = loadEnv(mode, process.cwd(), 'FIREBASE_');
  
  return {
    plugins: [react()],
    define: {
      'process.env': env
    }
  };
});
