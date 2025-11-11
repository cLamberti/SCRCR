
import { CreateUsuarioSchema, LoginSchema } from '@/dto/usuario.dto';
import { ZodError } from 'zod';

export class UsuarioValidator {
  static validarRegistro(data: unknown) {
    try {
      return {
        success: true,
        data: CreateUsuarioSchema.parse(data),
        errors: null,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          data: null,
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        };
      }
      return {
        success: false,
        data: null,
        errors: [{ field: 'general', message: 'Error de validación desconocido' }],
      };
    }
  }

  static validarLogin(data: unknown) {
    try {
      return {
        success: true,
        data: LoginSchema.parse(data),
        errors: null,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          data: null,
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        };
      }
      return {
        success: false,
        data: null,
        errors: [{ field: 'general', message: 'Error de validación desconocido' }],
      };
    }
  }
}

export { LoginSchema, CreateUsuarioSchema };
