import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { config } from 'dotenv';

// Cargar variables de entorno desde .env.local
const loadedEnv = config({ path: '.env.local' }).parsed;

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        environment: 'node',
        setupFiles: ['./vitest.setup.ts'],
        env: loadedEnv as any,
        include: ['src/__tests__/**/*.test.ts'],
    },
});
