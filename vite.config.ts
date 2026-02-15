import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
    }
  };
});
