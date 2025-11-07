import { z } from 'zod';

export const crearUsuarioSchema = z.object({
  nombreCompleto: z.string().min(3, 'El nombre es demasiado corto').max(100),
  username: z.string().min(3, 'El nombre de usuario es demasiado corto').max(50),
  email: z.string().email('El formato del email no es válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  rol: z.enum(['admin', 'tesorero', 'pastorGeneral'], {
    error: "Rol no válido. Debe ser 'admin', 'tesorero' o 'pastorGeneral'.",
  }),
});