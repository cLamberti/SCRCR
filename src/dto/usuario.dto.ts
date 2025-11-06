import { z } from 'zod';

// DTO para registro de usuario
export const RegistroUsuarioSchema = z.object({
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos'),
  email: z.string()
    .email('Formato de correo electrónico inválido')
    .max(255, 'El correo no puede exceder 255 caracteres'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  nombreCompleto: z.string()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .max(255, 'El nombre completo no puede exceder 255 caracteres'),
  rol: z.enum(['admin', 'usuario', 'moderador']).default('usuario'),
});

export type RegistroUsuarioDTO = z.infer<typeof RegistroUsuarioSchema>;

// DTO para login
export const LoginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

// DTO para respuesta de usuario (sin password)
export interface UsuarioResponse {
  id: number;
  username: string;
  email: string;
  nombreCompleto: string;
  rol: string;
  estado: number;
  ultimoAcceso: string | null;
  createdAt: string;
}

// DTO para actualización de usuario
export const ActualizarUsuarioSchema = z.object({
  email: z.string().email().optional(),
  nombreCompleto: z.string().min(3).max(255).optional(),
  rol: z.enum(['admin', 'usuario', 'moderador']).optional(),
  estado: z.number().int().min(0).max(1).optional(),
});

export type ActualizarUsuarioDTO = z.infer<typeof ActualizarUsuarioSchema>;

// DTO para cambio de contraseña
export const CambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'La contraseña actual es requerida'),
  passwordNueva: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  confirmarPassword: z.string(),
}).refine((data) => data.passwordNueva === data.confirmarPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarPassword'],
});

export type CambiarPasswordDTO = z.infer<typeof CambiarPasswordSchema>;
