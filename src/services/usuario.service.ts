
import { UsuarioDAO } from '@/dao/usuario.dao';
import { LoginDTO, UsuarioResponse } from '@/dto/usuario.dto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class UsuarioServiceError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'UsuarioServiceError';
  }
}

export class UsuarioService {
  private usuarioDAO: UsuarioDAO;

  constructor() {
    this.usuarioDAO = new UsuarioDAO();
  }

  async login(data: LoginDTO): Promise<{ token: string; usuario: UsuarioResponse }> {
    try {
      console.log('=== INICIO LOGIN SERVICE ===');
      console.log('Login data:', { username: data.username });

      // Buscar usuario por username - CORREGIDO: usar findByUsername
      const usuario = await this.usuarioDAO.findByUsername(data.username);
      console.log('Usuario encontrado:', usuario ? 'Sí' : 'No');

      if (!usuario) {
        throw new UsuarioServiceError('Credenciales inválidas', 401);
      }

      // Verificar que el usuario esté activo
      if (usuario.estado !== 1) {
        throw new UsuarioServiceError('Usuario inactivo o bloqueado', 403);
      }

      // Verificar si está bloqueado temporalmente
      if (usuario.bloqueadoHasta && new Date(usuario.bloqueadoHasta) > new Date()) {
        throw new UsuarioServiceError('Usuario bloqueado temporalmente', 403);
      }

      // Verificar contraseña
      console.log('Verificando contraseña...');
      const passwordValida = await bcrypt.compare(data.password, usuario.passwordHash);
      console.log('Contraseña válida:', passwordValida);

      if (!passwordValida) {
        // Incrementar intentos fallidos
        const nuevosIntentos = usuario.intentosFallidos + 1;
        
        if (nuevosIntentos >= 5) {
          // Bloquear por 30 minutos
          const bloqueadoHasta = new Date();
          bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + 30);
          await this.usuarioDAO.actualizarIntentos(usuario.id, nuevosIntentos, bloqueadoHasta);
          throw new UsuarioServiceError('Usuario bloqueado por múltiples intentos fallidos', 403);
        } else {
          await this.usuarioDAO.actualizarIntentos(usuario.id, nuevosIntentos);
          throw new UsuarioServiceError('Credenciales inválidas', 401);
        }
      }

      // Resetear intentos fallidos en login exitoso
      if (usuario.intentosFallidos > 0) {
        await this.usuarioDAO.resetearIntentos(usuario.id);
      }

      // Generar token JWT
      const tokenPayload = {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        rol: usuario.rol,
        nombreCompleto: usuario.nombreCompleto,
      };

      console.log('Token payload:', tokenPayload);

      const secret = process.env.JWT_SECRET || 'uwrT0PdHQ7gkJeoaD3iKqMGk';
      const token = jwt.sign(tokenPayload, secret, { expiresIn: '24h' });

      console.log('Token generado exitosamente');

      // Preparar respuesta sin el password
      const usuarioResponse: UsuarioResponse = {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombreCompleto: usuario.nombreCompleto,
        rol: usuario.rol,
        estado: usuario.estado,
        ultimoAcceso: usuario.ultimoAcceso || null,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt,
      };

      console.log('=== FIN LOGIN SERVICE ===');

      return { token, usuario: usuarioResponse };
    } catch (error) {
      console.error('Error en login service:', error);
      if (error instanceof UsuarioServiceError) {
        throw error;
      }
      throw new UsuarioServiceError('Error al procesar el inicio de sesión', 500);
    }
  }

  async verificarToken(token: string): Promise<UsuarioResponse> {
    try {
      const secret = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambiar-en-produccion';
      const decoded = jwt.verify(token, secret) as any;

      const usuario = await this.usuarioDAO.findByUsername(decoded.username);

      if (!usuario || usuario.estado !== 1) {
        throw new UsuarioServiceError('Usuario no válido', 401);
      }

      return {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombreCompleto: usuario.nombreCompleto,
        rol: usuario.rol,
        estado: usuario.estado,
        ultimoAcceso: usuario.ultimoAcceso || null,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UsuarioServiceError('Token inválido', 401);
      }
      if (error instanceof UsuarioServiceError) {
        throw error;
      }
      throw new UsuarioServiceError('Error al verificar token', 500);
    }
  }
}
