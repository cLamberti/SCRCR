
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginDTO, UsuarioResponse } from '@/dto/usuario.dto';
import { UsuarioDAO } from '@/dao/usuario.dao';
import { Usuario } from '@/models/Usuario';

/**
 * Clase de error personalizada para errores del servicio de Usuario
 */
export class UsuarioServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'UsuarioServiceError';
  }
}

export class UsuarioService {
  private usuarioDAO: UsuarioDAO;

  constructor() {
    this.usuarioDAO = new UsuarioDAO();
  }

  /**
   * Autentica a un usuario, genera un JWT y devuelve el token y los datos del usuario.
   * @param data - DTO con `username` y `password`.
   * @returns Un objeto con el token JWT y los datos del usuario.
   */
  async login(data: LoginDTO): Promise<{ token: string; usuario: UsuarioResponse }> {
    try {
      const usuario = await this.usuarioDAO.obtenerPorUsername(data.username);

      if (!usuario) {
        throw new UsuarioServiceError('Credenciales inválidas', 401);
      }

      const passwordValida = await bcrypt.compare(data.password, usuario.passwordHash);

      if (!passwordValida) {
        throw new UsuarioServiceError('Credenciales inválidas', 401);
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...usuarioSinPassword } = usuario;

      // Generar el JWT
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error('JWT_SECRET no está definida en las variables de entorno');
        throw new UsuarioServiceError('Error de configuración del servidor', 500);
      }

      const payload = {
        id: usuario.id,
        username: usuario.username,
        rol: usuario.rol,
      };

      const token = jwt.sign(payload, secret, {
        expiresIn: '1h', // El token expirará en 1 hora
      });

      const usuarioResponse: UsuarioResponse = {
        ...usuarioSinPassword,
        ultimoAcceso: usuarioSinPassword.ultimoAcceso,
        createdAt: usuarioSinPassword.createdAt,
        // Si UsuarioResponse también incluye updatedAt, añádelo aquí
        // updatedAt: usuarioSinPassword.updatedAt, 
      };

      return { token, usuario: usuarioResponse };

    } catch (error) {
      if (error instanceof UsuarioServiceError || error instanceof UsuarioDAO) {
        throw error;
      }
      console.error('Error interno en UsuarioService.login:', error);
      throw new UsuarioServiceError('Error interno del servidor', 500);
    }

  }
}
