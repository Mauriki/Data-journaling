import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process for OpenAI SDK and other Node-reliant packages
      'process.env': env,
      'process.version': JSON.stringify(process.version),
    },
    server: {
      host: true
    }
  };
});