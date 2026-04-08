import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { config } from 'dotenv';

// Cargar variables de entorno desde .env.local
const loadedEnv = config({ path: '.env.local' }).parsed;

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        env: loadedEnv as any,
        include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    },
});
