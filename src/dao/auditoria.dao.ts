import { prisma } from '@/lib/prisma';

export class AuditoriaDAO {
  static async registrar(tabla: string, registroId: number, accion: string, detalles: string) {
    try {
      await prisma.auditoria.create({
        data: {
          tabla,
          registroId,
          accion,
          detalles,
          fecha: new Date()
        }
      });
    } catch (error) {
      console.error('Error al registrar auditoría:', error);
      // No lanzamos error para no bloquear la operación principal
    }
  }
}
