import { config } from 'dotenv';
config({ path: '.env.local' });

import { sql } from '@vercel/postgres';

class DatabaseConnection {
  private static instance: DatabaseConnection;

  private constructor() {
    if (!process.env.POSTGRES_URL) {
      console.error('CRITICAL: POSTGRES_URL is undefined in db.ts');
    }
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async query(text: string, params?: any[]) {
    try {
      return await sql.query(text, params || []);
    } catch (error) {
      console.error('Error en la consulta SERVERLESS:', { text, error });
      throw error;
    }
  }

  public async getClient(): Promise<any> {
    throw new Error('getClient() no soportado con el driver Neon Serverless HTTP directo. Usa query()');
  }

  public async close(): Promise<void> {
    // El cliente neon HTTP no tiene conexiones persistentes para cerrar
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await sql.query('SELECT NOW()');
      return !!result.rows[0];
    } catch (error) {
      console.error('Error al conectar con la base de datos:', error);
      return false;
    }
  }
}

export const db = DatabaseConnection.getInstance();
export const pool = undefined as any;