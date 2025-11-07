import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';

/**
 * Middleware de autenticación para proteger rutas
 */
export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Verificar si el usuario está autenticado
   */
  async verificarAutenticacion(request: NextRequest): Promise<{
    authenticated: boolean;
    user?: any;
    response?: NextResponse;
  }> {
    try {
      // 1. Obtener token de las cookies
      const token = request.cookies.get('auth-token')?.value;

      if (!token) {
        return {
          authenticated: false,
          response: NextResponse.json(
            { success: false, message: 'No autorizado. Token no encontrado.' },
            { status: 401 }
          )
        };
      }

      // 2. Verificar token
      const payload = await this.authService.verificarToken(token);

      // 3. Obtener datos del usuario
      const user = await this.authService.obtenerUsuarioPorId(payload.userId);

      if (!user) {
        return {
          authenticated: false,
          response: NextResponse.json(
            { success: false, message: 'Usuario no encontrado o inactivo.' },
            { status: 401 }
          )
        };
      }

      return {
        authenticated: true,
        user: user
      };

    } catch (error) {
      console.error('Error en middleware de autenticación:', error);
      return {
        authenticated: false,
        response: NextResponse.json(
          { success: false, message: 'Token inválido o expirado.' },
          { status: 401 }
        )
      };
    }
  }

  /**
   * Verificar si el usuario tiene el rol requerido
   */
  verificarRol(userRol: string, rolesPermitidos: string[]): boolean {
    return rolesPermitidos.includes(userRol);
  }

  /**
   * Middleware completo para rutas protegidas
   */
  async protegerRuta(
    request: NextRequest, 
    rolesPermitidos?: string[]
  ): Promise<{ success: boolean; user?: any; response?: NextResponse }> {
    
    // 1. Verificar autenticación
    const authResult = await this.verificarAutenticacion(request);
    
    if (!authResult.authenticated) {
      return {
        success: false,
        response: authResult.response
      };
    }

    // 2. Verificar roles si se especificaron
    if (rolesPermitidos && rolesPermitidos.length > 0) {
      const tienePermiso = this.verificarRol(authResult.user!.rol, rolesPermitidos);
      
      if (!tienePermiso) {
        return {
          success: false,
          response: NextResponse.json(
            { 
              success: false, 
              message: 'Acceso denegado. No tienes permisos suficientes.' 
            },
            { status: 403 }
          )
        };
      }
    }

    return {
      success: true,
      user: authResult.user
    };
  }
}

// Instancia global del middleware
export const authMiddleware = new AuthMiddleware();

/**
 * Helper function para usar en API routes
 * 
 * Ejemplo de uso:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAuth(request, ['admin', 'tesorero']);
 *   if (!authResult.success) {
 *     return authResult.response!;
 *   }
 *   
 *   const user = authResult.user;
 *   // ... resto de la lógica
 * }
 * ```
 */
export async function requireAuth(
  request: NextRequest, 
  rolesPermitidos?: string[]
): Promise<{ success: boolean; user?: any; response?: NextResponse }> {
  return await authMiddleware.protegerRuta(request, rolesPermitidos);
}

/**
 * Helper function para verificar solo autenticación (sin restricción de roles)
 */
export async function requireLogin(
  request: NextRequest
): Promise<{ success: boolean; user?: any; response?: NextResponse }> {
  return await authMiddleware.protegerRuta(request);
}