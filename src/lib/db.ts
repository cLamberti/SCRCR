
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
      max: 20, // Máximo de conexiones en el pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Manejar errores del pool
    this.pool.on('error', (err) => {
      console.error('Error inesperado en el pool de conexiones:', err);
    });
  }

  /**
   * Obtiene la instancia única de la conexión (Singleton)
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Obtiene el pool de conexiones
   */
  public getPool(): Pool {
    return this.pool;
  }

  /**
   * Ejecuta una consulta SQL
   */
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

  /**
   * Obtiene un cliente del pool para transacciones
   */
  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Cierra todas las conexiones del pool
   */
  public async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Verifica la conexión a la base de datos
   */
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
