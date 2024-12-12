
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api'
    }
  },
  optimizeDeps: {
    include: ['monaco-editor/esm/vs/editor/editor.api']
  }
});