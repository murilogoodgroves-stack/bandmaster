import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
        'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY || env.VITE_GROQ_API_KEY),
        'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY || env.VITE_GROQ_API_KEY),
        'import.meta.env.VITE_OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY),
        'import.meta.env.VITE_MINIMAX_API_KEY': JSON.stringify(env.MINIMAX_API_KEY || env.VITE_MINIMAX_API_KEY),
        global: 'globalThis',
        'process.env.NODE_ENV': JSON.stringify('production')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'firebase', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
        exclude: ['express', 'node-cron', 'pg', 'cors', 'dotenv', 'tsx']
      },
      build: {
        rollupOptions: {
          external: ['express', 'node-cron', 'pg', 'cors', 'dotenv', 'tsx', 'express-async-errors'],
          output: {
            manualChunks: {
              icons: ['react-icons'],
              charts: ['recharts']
            }
          }
        },
        chunkSizeWarningLimit: 1000,
        sourcemap: false,
        target: 'esnext'
      }
    };
});
