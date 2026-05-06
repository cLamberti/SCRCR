import { db } from '@/lib/db';

export class AuditoriaDAO {
  static async registrar(tabla: string, registroId: number, accion: string, detalles: string) {
    try {
      await db.query(
        'INSERT INTO auditoria (tabla, registro_id, accion, detalles) VALUES ($1, $2, $3, $4)',
        [tabla, registroId, accion, detalles]
      );
    } catch (error) {
      console.error('Error al registrar auditoría:', error);
      // No lanzamos error para no bloquear la operación principal
    }
  }
}
