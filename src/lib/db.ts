
import { Pool, PoolClient } from 'pg';

/**
 * Clase para manejar la conexión a la base de datos PostgreSQL (Neon DB)
 */
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Error inesperado en el pool de conexiones:', err);
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Consulta ejecutada:', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Error en la consulta:', { text, error });
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT NOW()');
      console.log('Conexión exitosa a la base de datos:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('Error al conectar con la base de datos:', error);
      return false;
    }
  }
}

// Exportar la instancia única
export const db = DatabaseConnection.getInstance();

// Exportar el pool directamente para compatibilidad
export const pool = db.getPool();
