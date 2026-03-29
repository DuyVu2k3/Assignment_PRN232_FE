import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    proxy: {
      '/api/auth': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        secure: false,
      },
      '/api/users': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        secure: false,
      },
      '/api/exams': {
        target: 'http://localhost:7002',
        changeOrigin: true,
        secure: false,
      },
      '/api/semesters': {
        target: 'http://localhost:7002',
        changeOrigin: true,
        secure: false,
      },
      '/api/rubrics': {
        target: 'http://localhost:7002',
        changeOrigin: true,
        secure: false,
      },
      '/api/submissions': {
        target: 'http://localhost:7003',
        changeOrigin: true,
        secure: false,
      },
      '/submission-files': {
        target: 'http://localhost:7003',
        changeOrigin: true,
        secure: false,
      },
      '/api/submission-files': {
        target: 'http://localhost:7003',
        changeOrigin: true,
        secure: false,
      },
      '/submission-batches': {
        target: 'http://localhost:7003',
        changeOrigin: true,
        secure: false,
      },
      '/api/submission-batches': {
        target: 'http://localhost:7003',
        changeOrigin: true,
        secure: false,
      },
      '/grade-entries': {
        target: 'http://localhost:7003',
        changeOrigin: true,
        secure: false,
      },
      '/api/grade-entries': {
        target: 'http://localhost:7003',
        changeOrigin: true,
        secure: false,
      },
      '/assigned-examiners': {
        target: 'http://localhost:7003',
        changeOrigin: true,
        secure: false,
      },
      '/api/assigned-examiners': {
        target: 'http://localhost:7003',
        changeOrigin: true,
        secure: false,
      },
      '/api/examiners': {
        target: 'http://localhost:7003',
        changeOrigin: true,
        secure: false,
      },
      '/submission-solutions': {
        target: 'http://localhost:7003',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
