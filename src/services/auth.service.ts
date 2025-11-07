import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UsuarioDAO } from '@/dao/usuario.dao';
import { LoginDTO, RegistroUsuarioDTO, UsuarioResponse } from '@/dto/usuario.dto';
import { Usuario, JWTPayload, CrearUsuario } from '@/models/Usuario';

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

export class AuthService {
  private usuarioDAO: UsuarioDAO;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.usuarioDAO = new UsuarioDAO();
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  /**
   * Registro de un nuevo usuario
   */
  async registrar(data: RegistroUsuarioDTO): Promise<UsuarioResponse> {
    try {
      // Hash de la contraseña
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(data.password, saltRounds);

      // Crear objeto para DAO
      const nuevoUsuario: CrearUsuario = {
        username: data.username,
        email: data.email,
        passwordHash,
        nombreCompleto: data.nombreCompleto,
        rol: data.rol
      };

      // Crear usuario en la base de datos
      const usuarioCreado = await this.usuarioDAO.crear(nuevoUsuario);

      // Retornar response sin datos sensibles
      return {
        id: usuarioCreado.id,
        username: usuarioCreado.username,
        email: usuarioCreado.email,
        nombreCompleto: usuarioCreado.nombreCompleto,
        rol: usuarioCreado.rol,
        estado: usuarioCreado.estado,
        ultimoAcceso: usuarioCreado.ultimoAcceso?.toISOString() || null,
        createdAt: usuarioCreado.createdAt.toISOString()
      };

    } catch (error: any) {
      console.error('Error en registro de usuario:', error);
      
      if (error.message.includes('ya existe') || error.message.includes('ya está registrado')) {
        throw new AuthServiceError(error.message, 409);
      }
      
      throw new AuthServiceError('Error interno al registrar usuario', 500);
    }
  }

  /**
   * Login de usuario
   */
  async login(credentials: LoginDTO): Promise<{ user: UsuarioResponse; token: string }> {
    try {
      // 1. Buscar usuario
      const usuario = await this.usuarioDAO.obtenerPorUsername(credentials.username);
      
      if (!usuario) {
        throw new AuthServiceError('Credenciales inválidas', 401);
      }

      // 2. Verificar si está bloqueado
      const estaBlocked = await this.usuarioDAO.estaBlocked(usuario.id);
      if (estaBlocked) {
        throw new AuthServiceError('Usuario temporalmente bloqueado. Intente más tarde.', 423);
      }

      // 3. Verificar contraseña
      const passwordValida = await bcrypt.compare(credentials.password, usuario.passwordHash);
      
      if (!passwordValida) {
        // Incrementar intentos fallidos
        await this.usuarioDAO.incrementarIntentosFallidos(usuario.id);
        throw new AuthServiceError('Credenciales inválidas', 401);
      }

      // 4. Login exitoso - resetear intentos fallidos y actualizar último acceso
      await this.usuarioDAO.resetearIntentosFallidos(usuario.id);
      await this.usuarioDAO.actualizarUltimoAcceso(usuario.id);

      // 5. Generar JWT
      const payload: JWTPayload = {
        userId: usuario.id,
        username: usuario.username,
        rol: usuario.rol
      };

      const token = jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn } as SignOptions);

      // 6. Retornar datos del usuario (sin password) y token
      const userResponse: UsuarioResponse = {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombreCompleto: usuario.nombreCompleto,
        rol: usuario.rol,
        estado: usuario.estado,
        ultimoAcceso: usuario.ultimoAcceso?.toISOString() || null,
        createdAt: usuario.createdAt.toISOString()
      };

      return { user: userResponse, token };

    } catch (error: any) {
      if (error instanceof AuthServiceError) {
        throw error;
      }
      
      console.error('Error interno en login:', error);
      throw new AuthServiceError('Error interno del servidor', 500);
    }
  }

  /**
   * Verificar y decodificar JWT token
   */
  async verificarToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthServiceError('Token expirado', 401);
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AuthServiceError('Token inválido', 401);
      }
      throw new AuthServiceError('Error al verificar token', 401);
    }
  }

  /**
   * Obtener usuario por ID (para middleware)
   */
  async obtenerUsuarioPorId(id: number): Promise<UsuarioResponse | null> {
    try {
      const usuario = await this.usuarioDAO.obtenerPorId(id);
      
      if (!usuario) {
        return null;
      }

      return {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombreCompleto: usuario.nombreCompleto,
        rol: usuario.rol,
        estado: usuario.estado,
        ultimoAcceso: usuario.ultimoAcceso?.toISOString() || null,
        createdAt: usuario.createdAt.toISOString()
      };
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      return null;
    }
  }

  /**
   * Generar token JWT
   */
  generarToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn } as SignOptions);
  }

  /**
   * Validar formato de token
   */
  esTokenValido(token: string): boolean {
    try {
      jwt.verify(token, this.jwtSecret);
      return true;
    } catch {
      return false;
    }
  }
}