export { prisma } from '@/lib/prisma';

// Kept for backward compatibility with code that imports `db` or `pool`
export const db = null as any;
export const pool = undefined as any;
