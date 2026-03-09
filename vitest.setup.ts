import { beforeAll } from 'vitest';
import { config } from 'dotenv';

beforeAll(() => {
    config({ path: '.env.local' });
});
