import { db } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { Usuario } from '@/models/Usuario';

export class UsuarioDAO {
  async findAll(): Promise<Omit<Usuario, 'passwordHash'>[]> {
    const query = `
      SELECT 
        id, username, email, nombre_completo, rol, estado, 
        ultimo_acceso, intentos_fallidos, bloqueado_hasta, 
        created_at, updated_at 
      FROM usuarios ORDER BY nombre_completo ASC
    `;
    try {
      const result = await db.query(query);
      return result.rows.map(row => ({
        id: row.id,
        username: row.username,
        email: row.email,
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
      console.error('Error en UsuarioDAO.findAll:', error);
      throw new Error('Error al obtener todos los usuarios de la base de datos.');
    }
  }

  async create(usuarioData: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt' | 'ultimoAcceso' | 'intentosFallidos' | 'bloqueadoHasta'>): Promise<Usuario> {
    const { nombreCompleto, username, email, passwordHash, rol, estado } = usuarioData;
    
    const result = await sql`
      INSERT INTO usuarios (nombre_completo, username, email, password_hash, rol, estado)
      VALUES (${nombreCompleto}, ${username}, ${email}, ${passwordHash}, ${rol}, ${estado})
      RETURNING id, nombre_completo, username, email, rol, estado, ultimo_acceso, created_at, updated_at;
    `;

    const newUser = result.rows[0];

    return {
      id: newUser.id,
      nombreCompleto: newUser.nombre_completo,
      username: newUser.username,
      email: newUser.email,
      passwordHash: '', // No devolvemos el hash
      rol: newUser.rol,
      estado: newUser.estado,
      ultimoAcceso: newUser.ultimo_acceso,
      intentosFallidos: 0,
      bloqueadoHasta: null,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at,
    };
  }

  async obtenerPorUsername(username: string): Promise<Usuario | null> {
    const query = 'SELECT * FROM usuarios WHERE username = $1';
    try {
      const result = await db.query(query, [username]);
      if (result.rows.length === 0) {
        return null;
      }
      const row = result.rows[0];
      
      // Mapeo correcto de columnas de la BD (snake_case) a propiedades del modelo (camelCase)
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
      console.error('Error en UsuarioDAO.obtenerPorUsername:', error);
      throw new Error('Error al obtener el usuario de la base de datos.');
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
      await db.query(query, params);
    } catch (error) {
      console.error('Error en UsuarioDAO.actualizarIntentos:', error);
      throw new Error('Error al actualizar los intentos de login.');
    }
  }

  async resetearIntentos(id: number): Promise<void> {
    const query = 'UPDATE usuarios SET intentos_fallidos = 0, ultimo_acceso = NOW(), bloqueado_hasta = NULL, estado = 1 WHERE id = $1';
    try {
      await db.query(query, [id]);
    } catch (error) {
      console.error('Error en UsuarioDAO.resetearIntentos:', error);
      throw new Error('Error al resetear los intentos de login.');
    }
  }
}