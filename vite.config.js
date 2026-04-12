import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        // Output production build to Django's static files directory
        outDir: '../frontend/dist',
        emptyOutDir: true,
    },
    server: {
        proxy: {
            '/api': 'http://127.0.0.1:8000',
            '/media': 'http://127.0.0.1:8000',
        }
    }
})
