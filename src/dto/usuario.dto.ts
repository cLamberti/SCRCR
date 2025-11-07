import { z } from 'zod';

/**
 * Schema de validación para login
 */
export const LoginSchema = z.object({
  username: z.string().min(3, 'El username debe tener al menos 3 caracteres'),
  password: z.string().min(5, 'La contraseña debe tener al menos 5 caracteres'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

/**
 * Schema de validación para crear usuario
 */
export const CreateUsuarioSchema = z.object({
  username: z.string().min(3, 'El username debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombreCompleto: z.string().min(3, 'El nombre completo debe tener al menos 3 caracteres'),
  rol: z.enum(['admin', 'tesorero', 'pastorGeneral']),
});

export type CreateUsuarioDTO = z.infer<typeof CreateUsuarioSchema>;

/**
 * Respuesta de usuario (sin password)
 */
export interface UsuarioResponse {
  id: number;
  username: string;
  email: string;
  nombreCompleto: string;
  rol: string;
  estado: number;
  ultimoAcceso: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
