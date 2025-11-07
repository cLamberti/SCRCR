import { Usuario } from '@/models/Usuario';
import { sql } from '@vercel/postgres';

export class UsuarioDAO {
  async findAll(): Promise<Omit<Usuario, 'passwordHash'>[]> {
    const result = await sql`
      SELECT 
        id, 
        nombre_completo, 
        username, 
        email, 
        rol, 
        estado, 
        ultimo_acceso, 
        intentos_fallidos,
        bloqueado_hasta,
        created_at, 
        updated_at
      FROM usuarios
      ORDER BY created_at DESC;
    `;

    return result.rows.map(row => ({
      id: row.id,
      nombreCompleto: row.nombre_completo,
      username: row.username,
      email: row.email,
      rol: row.rol,
      estado: row.estado,
      ultimoAcceso: row.ultimo_acceso,
      intentosFallidos: row.intentos_fallidos,
      bloqueadoHasta: row.bloqueado_hasta,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async create(usuarioData: {
    nombreCompleto: string;
    username: string;
    email: string;
    passwordHash: string;
    rol: 'admin' | 'tesorero' | 'pastorGeneral';
    estado: number;
  }): Promise<Usuario> {
    const { nombreCompleto, username, email, passwordHash, rol, estado } = usuarioData;
    
    const result = await sql`
      INSERT INTO usuarios (nombre_completo, username, email, password_hash, rol, estado)
      VALUES (${nombreCompleto}, ${username}, ${email}, ${passwordHash}, ${rol}, ${estado})
      RETURNING id, nombre_completo, username, email, rol, estado, ultimo_acceso, intentos_fallidos, bloqueado_hasta, created_at, updated_at;
    `;

    const newUser = result.rows[0];

    return {
      id: newUser.id,
      nombreCompleto: newUser.nombre_completo,
      username: newUser.username,
      email: newUser.email,
      passwordHash: '', // No devolvemos el hash por seguridad
      rol: newUser.rol,
      estado: newUser.estado,
      ultimoAcceso: newUser.ultimo_acceso,
      intentosFallidos: newUser.intentos_fallidos || 0,
      bloqueadoHasta: newUser.bloqueado_hasta,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at,
    };
  }

  async obtenerPorUsername(username: string): Promise<Usuario | null> {
    const result = await sql`
      SELECT 
        id, 
        nombre_completo, 
        username, 
        email, 
        password_hash,
        rol, 
        estado, 
        ultimo_acceso,
        intentos_fallidos,
        bloqueado_hasta,
        created_at, 
        updated_at
      FROM usuarios
      WHERE username = ${username}
      LIMIT 1;
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      nombreCompleto: row.nombre_completo,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      rol: row.rol,
      estado: row.estado,
      ultimoAcceso: row.ultimo_acceso,
      intentosFallidos: row.intentos_fallidos || 0,
      bloqueadoHasta: row.bloqueado_hasta,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
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
    const result = await sql`
      SELECT 
        id,
        nombre_completo as "nombreCompleto",
        username,
        email,
        password_hash as "passwordHash",
        rol,
        estado,
        ultimo_acceso as "ultimoAcceso",
        intentos_fallidos as "intentosFallidos",
        bloqueado_hasta as "bloqueadoHasta",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM usuarios
      WHERE id = ${id}
    `;

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
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    try {
      const result = await sql`
        SELECT 
          id,
          nombre_completo as "nombreCompleto",
          username,
          email,
          password_hash as "passwordHash",
          rol,
          estado,
          ultimo_acceso as "ultimoAcceso",
          intentos_fallidos as "intentosFallidos",
          bloqueado_hasta as "bloqueadoHasta",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM usuarios
        WHERE email = ${email}
      `;

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

  async actualizarIntentos(id: number, intentos: number, bloqueadoHasta?: Date | null): Promise<void> {
    if (bloqueadoHasta) {
      await sql`
        UPDATE usuarios
        SET intentos_fallidos = ${intentos},
            bloqueado_hasta = ${bloqueadoHasta.toISOString()}
        WHERE id = ${id};
      `;
    } else {
      await sql`
        UPDATE usuarios
        SET intentos_fallidos = ${intentos}
        WHERE id = ${id};
      `;
    }
  }

  async resetearIntentos(id: number): Promise<void> {
    await sql`
      UPDATE usuarios
      SET intentos_fallidos = 0,
          bloqueado_hasta = NULL
      WHERE id = ${id};
    `;
  }

  async actualizarUltimoAcceso(id: number): Promise<void> {
    await sql`
      UPDATE usuarios
      SET ultimo_acceso = NOW()
      WHERE id = ${id};
    `;
  }
}