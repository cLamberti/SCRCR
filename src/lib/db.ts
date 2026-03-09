import { neon, NeonQueryFunction } from "@neondatabase/serverless";

const sql: NeonQueryFunction<false, false> = neon(process.env.POSTGRES_URL!);

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private sql: NeonQueryFunction<false, false>;

  private constructor() {
    this.sql = sql;
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      // sql.query acepta el formato convencional con $1, $2...
      const result = await (this.sql as any).query(text, params ?? []);
      const rows = result.rows ?? result;
      const duration = Date.now() - start;
      console.log("Consulta ejecutada:", { text, duration, rows: rows.length });
      return { rows, rowCount: rows.length };
    } catch (error) {
      console.error("Error en la consulta:", { text, error });
      throw error;
    }
  }

  public async getClient() {
    throw new Error("getClient no está disponible con Neon serverless, usa db.query directamente");
  }

  public async close(): Promise<void> {
    // sin-op: neon serverless no mantiene conexiones persistentes
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await (this.sql as any).query("SELECT NOW()");
      const rows = result.rows ?? result;
      console.log("Conexión exitosa a la base de datos:", rows[0]);
      return true;
    } catch (error) {
      console.error("Error al conectar con la base de datos:", error);
      return false;
    }
  }
}

export const db = DatabaseConnection.getInstance();

export const pool = db;