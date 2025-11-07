import { pool } from '@/lib/db';
import { Usuario } from '@/models/Usuario';

export class UsuarioDAO {
  /**
   * Obtiene un usuario por su username
   */
  async obtenerPorUsername(username: string): Promise<Usuario | null> {
    console.log('=== DAO: Buscando usuario ===');
    console.log('Username:', username);

    const query = `
      SELECT 
        id,
        username,
        email,
        password_hash as "passwordHash",
        nombre_completo as "nombreCompleto",
        rol,
        estado,
        ultimo_acceso as "ultimoAcceso",
        intentos_fallidos as "intentosFallidos",
        bloqueado_hasta as "bloqueadoHasta",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM usuarios
      WHERE username = $1
    `;

    const result = await pool.query(query, [username]);
    console.log('Resultados encontrados:', result.rows.length);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    console.log('Usuario encontrado - ID:', row.id, 'Estado:', row.estado);

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.passwordHash,
      nombreCompleto: row.nombreCompleto,
      rol: row.rol,
      estado: row.estado,
      ultimoAcceso: row.ultimoAcceso,
      intentosFallidos: row.intentosFallidos,
      bloqueadoHasta: row.bloqueadoHasta,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Alias para mantener compatibilidad
   */
  async findByUsername(username: string): Promise<Usuario | null> {
    return this.obtenerPorUsername(username);
  }

  /**
   * Obtiene un usuario por su ID
   */
  async obtenerPorId(id: number): Promise<Usuario | null> {
    const query = `
      SELECT 
        id,
        username,
        email,
        password_hash as "passwordHash",
        nombre_completo as "nombreCompleto",
        rol,
        estado,
        ultimo_acceso as "ultimoAcceso",
        intentos_fallidos as "intentosFallidos",
        bloqueado_hasta as "bloqueadoHasta",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM usuarios
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.passwordHash,
      nombreCompleto: row.nombreCompleto,
      rol: row.rol,
      estado: row.estado,
      ultimoAcceso: row.ultimoAcceso,
      intentosFallidos: row.intentosFallidos,
      bloqueadoHasta: row.bloqueadoHasta,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        email: row.email,
        passwordHash: row.password_hash,
        nombreCompleto: row.nombre_completo,
        rol: row.rol,
        estado: row.estado,
        ultimoAcceso: row.ultimo_acceso,
        intentosFallidos: row.intentos_fallidos,
        bloqueadoHasta: row.bloqueado_hasta,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error en DAO findByEmail:', error);
      throw error;
    }
  }

  async create(usuario: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Usuario> {
    try {
      const result = await pool.query(
        `INSERT INTO usuarios (
          username, email, password_hash, nombre_completo, rol, estado
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          usuario.username,
          usuario.email,
          usuario.passwordHash,
          usuario.nombreCompleto,
          usuario.rol,
          usuario.estado,
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        email: row.email,
        passwordHash: row.password_hash,
        nombreCompleto: row.nombre_completo,
        rol: row.rol,
        estado: row.estado,
        ultimoAcceso: row.ultimo_acceso,
        intentosFallidos: row.intentos_fallidos,
        bloqueadoHasta: row.bloqueado_hasta,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error en DAO create:', error);
      throw error;
    }
  }

  async findAll(): Promise<Usuario[]> {
    try {
      const result = await pool.query('SELECT * FROM usuarios ORDER BY id DESC');
      
      return result.rows.map(row => ({
        id: row.id,
        username: row.username,
        email: row.email,
        passwordHash: row.password_hash,
        nombreCompleto: row.nombre_completo,
        rol: row.rol,
        estado: row.estado,
        ultimoAcceso: row.ultimo_acceso,
        intentosFallidos: row.intentos_fallidos,
        bloqueadoHasta: row.bloqueado_hasta,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('Error en DAO findAll:', error);
      throw error;
    }
  }

  async actualizarIntentos(id: number, intentos: number, bloqueadoHasta?: Date | null): Promise<void> {
    let query: string;
    let params: any[];

    if (bloqueadoHasta) {
      query = 'UPDATE usuarios SET intentos_fallidos = $1, bloqueado_hasta = $2, estado = 2 WHERE id = $3';
      params = [intentos, bloqueadoHasta, id];
    } else {
      query = 'UPDATE usuarios SET intentos_fallidos = $1 WHERE id = $2';
      params = [intentos, id];
    }
    
    try {
      await pool.query(query, params);
    } catch (error) {
      console.error('Error en UsuarioDAO.actualizarIntentos:', error);
      throw new Error('Error al actualizar los intentos de login.');
    }
  }

  async resetearIntentos(id: number): Promise<void> {
    const query = 'UPDATE usuarios SET intentos_fallidos = 0, ultimo_acceso = NOW(), bloqueado_hasta = NULL, estado = 1 WHERE id = $1';
    try {
      await pool.query(query, [id]);
    } catch (error) {
      console.error('Error en UsuarioDAO.resetearIntentos:', error);
      throw new Error('Error al resetear los intentos de login.');
    }
  }
}