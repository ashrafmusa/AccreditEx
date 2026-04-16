import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const productionEnv = loadEnv('production', '.', '');

  const getEnv = (key: string): string => {
    return env[key] || productionEnv[key] || '';
  };

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.VITE_API_KEY': JSON.stringify(getEnv('VITE_API_KEY')),
      'process.env.VITE_AUTH_DOMAIN': JSON.stringify(getEnv('VITE_AUTH_DOMAIN')),
      'process.env.VITE_PROJECT_ID': JSON.stringify(getEnv('VITE_PROJECT_ID')),
      'process.env.VITE_STORAGE_BUCKET': JSON.stringify(getEnv('VITE_STORAGE_BUCKET')),
      'process.env.VITE_MESSAGING_SENDER_ID': JSON.stringify(getEnv('VITE_MESSAGING_SENDER_ID')),
      'process.env.VITE_APP_ID': JSON.stringify(getEnv('VITE_APP_ID')),
      'process.env.VITE_MEASUREMENT_ID': JSON.stringify(getEnv('VITE_MEASUREMENT_ID'))
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      // Performance optimizations
      target: 'es2020',
      cssCodeSplit: true,
      sourcemap: false,
      // Silence warnings for intentionally large pre-split vendor chunks
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React — loaded first, cached long-term
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // State management — small, loads with app shell  
            'vendor-zustand': ['zustand'],
            // Firebase — defer until auth check
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
            // Heavy vendor libraries — load on demand
            'vendor-excel': ['exceljs'],
            'vendor-pdf': ['jspdf', 'jspdf-autotable'],
            'vendor-html2canvas': ['html2canvas'],
            'vendor-tiptap': [
              '@tiptap/react',
              '@tiptap/starter-kit',
              '@tiptap/extension-underline',
              '@tiptap/extension-text-align',
              '@tiptap/extension-image',
            ],
            'vendor-recharts': ['recharts'],
            'vendor-docx': ['docx'],
            // UI icons — used everywhere but can load async
            'vendor-icons': ['@heroicons/react/24/outline', '@heroicons/react/24/solid', '@heroicons/react/20/solid'],
            // Globe 3D rendering — only used on landing/login pages (desktop only)
            'vendor-globe': ['cobe', 'framer-motion'],
            // Sanitization + utilities
            'vendor-utils': ['dompurify', 'idb'],
          },
        },
      },
    },
  };
});
