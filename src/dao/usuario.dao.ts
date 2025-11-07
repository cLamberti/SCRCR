import { Usuario, CrearUsuario, UsuarioSinPassword } from '@/models/Usuario';
import { db } from '@/lib/db';

export class UsuarioDAO {
  constructor() {}

  private get database() {
    return db;
  }

  /**
   * Crear un nuevo usuario
   */
  async crear(usuario: CrearUsuario): Promise<UsuarioSinPassword> {
    const query = `
      INSERT INTO usuarios (username, email, password_hash, nombre_completo, rol, estado, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
      RETURNING id, username, email, nombre_completo, rol, estado, ultimo_acceso, intentos_fallidos, 
                bloqueado_hasta, created_at, updated_at
    `;

    try {
      const result = await this.database.query(query, [
        usuario.username,
        usuario.email,
        usuario.passwordHash,
        usuario.nombreCompleto,
        usuario.rol
      ]);

      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        email: row.email,
        nombreCompleto: row.nombre_completo,
        rol: row.rol,
        estado: row.estado,
        ultimoAcceso: row.ultimo_acceso,
        intentosFallidos: row.intentos_fallidos || 0,
        bloqueadoHasta: row.bloqueado_hasta,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      
      // Manejo de errores específicos
      if (error.code === '23505') { // Constraint violation (duplicate key)
        if (error.constraint?.includes('username')) {
          throw new Error('El nombre de usuario ya existe');
        }
        if (error.constraint?.includes('email')) {
          throw new Error('El correo electrónico ya está registrado');
        }
      }
      
      throw new Error('Error al crear el usuario en la base de datos');
    }
  }

  /**
   * Obtener usuario por username (incluye password para autenticación)
   */
  async obtenerPorUsername(username: string): Promise<Usuario | null> {
    const query = `
      SELECT id, username, email, password_hash, nombre_completo, rol, estado, 
             ultimo_acceso, intentos_fallidos, bloqueado_hasta, created_at, updated_at
      FROM usuarios 
      WHERE username = $1 AND estado = 1
    `;

    try {
      const result = await this.database.query(query, [username]);
      
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
        intentosFallidos: row.intentos_fallidos || 0,
        bloqueadoHasta: row.bloqueado_hasta,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error al obtener usuario por username:', error);
      throw new Error('Error al consultar usuario en la base de datos');
    }
  }

  /**
   * Obtener usuario por ID (sin password)
   */
  async obtenerPorId(id: number): Promise<UsuarioSinPassword | null> {
    const query = `
      SELECT id, username, email, nombre_completo, rol, estado, 
             ultimo_acceso, intentos_fallidos, bloqueado_hasta, created_at, updated_at
      FROM usuarios 
      WHERE id = $1 AND estado = 1
    `;

    try {
      const result = await this.database.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        email: row.email,
        nombreCompleto: row.nombre_completo,
        rol: row.rol,
        estado: row.estado,
        ultimoAcceso: row.ultimo_acceso,
        intentosFallidos: row.intentos_fallidos || 0,
        bloqueadoHasta: row.bloqueado_hasta,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      throw new Error('Error al consultar usuario en la base de datos');
    }
  }

  /**
   * Actualizar último acceso del usuario
   */
  async actualizarUltimoAcceso(id: number): Promise<void> {
    const query = `
      UPDATE usuarios 
      SET ultimo_acceso = NOW(), updated_at = NOW()
      WHERE id = $1
    `;

    try {
      await this.database.query(query, [id]);
    } catch (error) {
      console.error('Error al actualizar último acceso:', error);
      throw new Error('Error al actualizar último acceso del usuario');
    }
  }

  /**
   * Incrementar intentos fallidos de login
   */
  async incrementarIntentosFallidos(id: number): Promise<void> {
    const query = `
      UPDATE usuarios 
      SET intentos_fallidos = COALESCE(intentos_fallidos, 0) + 1,
          bloqueado_hasta = CASE 
            WHEN COALESCE(intentos_fallidos, 0) + 1 >= 5 
            THEN NOW() + INTERVAL '30 minutes'
            ELSE bloqueado_hasta
          END,
          updated_at = NOW()
      WHERE id = $1
    `;

    try {
      await this.database.query(query, [id]);
    } catch (error) {
      console.error('Error al incrementar intentos fallidos:', error);
      throw new Error('Error al actualizar intentos fallidos');
    }
  }

  /**
   * Resetear intentos fallidos después de login exitoso
   */
  async resetearIntentosFallidos(id: number): Promise<void> {
    const query = `
      UPDATE usuarios 
      SET intentos_fallidos = 0, 
          bloqueado_hasta = NULL,
          updated_at = NOW()
      WHERE id = $1
    `;

    try {
      await this.database.query(query, [id]);
    } catch (error) {
      console.error('Error al resetear intentos fallidos:', error);
      throw new Error('Error al resetear intentos fallidos');
    }
  }

  /**
   * Verificar si usuario está bloqueado
   */
  async estaBlocked(id: number): Promise<boolean> {
    const query = `
      SELECT bloqueado_hasta
      FROM usuarios 
      WHERE id = $1
    `;

    try {
      const result = await this.database.query(query, [id]);
      
      if (result.rows.length === 0) {
        return false;
      }

      const bloqueadoHasta = result.rows[0].bloqueado_hasta;
      if (!bloqueadoHasta) {
        return false;
      }

      return new Date() < new Date(bloqueadoHasta);
    } catch (error) {
      console.error('Error al verificar bloqueo:', error);
      return false; // En caso de error, permitir el intento
    }
  }
}