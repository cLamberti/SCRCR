
export interface Usuario {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  nombreCompleto: string;
  rol: 'admin' | 'tesorero' | 'pastorGeneral';
  estado: number;
  ultimoAcceso: Date | null;
  intentosFallidos: number;
  bloqueadoHasta: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsuarioSinPassword extends Omit<Usuario, 'passwordHash'> {}
