export interface Usuario {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  nombreCompleto: string;
  rol: 'admin' | 'tesorero' | 'pastorGeneral';
  estado: number; // 1 = activo, 0 = inactivo
  ultimoAcceso: Date | null;
  intentosFallidos: number;
  bloqueadoHasta: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsuarioSinPassword extends Omit<Usuario, 'passwordHash'> {}

// Datos mínimos para crear un usuario
export interface CrearUsuario {
  username: string;
  email: string;
  passwordHash: string;
  nombreCompleto: string;
  rol: 'admin' | 'tesorero' | 'pastorGeneral';
}

// Payload para JWT Token
export interface JWTPayload {
  userId: number;
  username: string;
  rol: string;
  iat?: number;
  exp?: number;
}