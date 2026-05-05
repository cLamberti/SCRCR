import { prisma } from '@/lib/prisma';
import { RegistroAsistenciaRequest, AsistenciaResponse } from '@/dto/asistencia.dto';
import { EstadoAsistencia } from '@prisma/client';

export class AsistenciaDAOError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AsistenciaDAOError';
  }
}

function mapToResponse(row: any): AsistenciaResponse {
  return {
    id: row.id,
    id_asociado: row.asociadoId,
    id_actividad: row.eventoId,
    fecha_asistencia: row.fechaRegistro instanceof Date
      ? row.fechaRegistro.toISOString().split('T')[0]
      : new Date(row.fechaRegistro).toISOString().split('T')[0],
    fecha_registro: row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : new Date(row.createdAt).toISOString(),
  };
}

export class AsistenciaDAO {
  async existeAsociado(id_asociado: number): Promise<boolean> {
    try {
      const count = await prisma.asociado.count({ where: { id: id_asociado } });
      return count > 0;
    } catch (error) {
      throw new AsistenciaDAOError('Error al verificar existencia de asociado', 'DATABASE_ERROR', error);
    }
  }

  async obtenerPorAsociadoActividadYFecha(
    id_asociado: number,
    id_actividad: number,
    fecha_asistencia: string
  ): Promise<AsistenciaResponse | null> {
    try {
      const row = await prisma.asistencia.findFirst({
        where: {
          asociadoId: id_asociado,
          eventoId: id_actividad,
          fechaRegistro: {
            gte: new Date(`${fecha_asistencia}T00:00:00.000Z`),
            lt: new Date(`${fecha_asistencia}T23:59:59.999Z`),
          },
        },
      });
      return row ? mapToResponse(row) : null;
    } catch (error) {
      throw new AsistenciaDAOError('Error al consultar asistencia existente', 'DATABASE_ERROR', error);
    }
  }

  async crear(params: RegistroAsistenciaRequest): Promise<AsistenciaResponse> {
    try {
      const row = await prisma.asistencia.create({
        data: {
          asociadoId: params.id_asociado,
          eventoId: params.id_actividad,
          fechaRegistro: new Date(`${params.fecha_asistencia}T00:00:00.000Z`),
          estado: EstadoAsistencia.presente,
        },
      });
      return mapToResponse(row);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new AsistenciaDAOError('Registro de asistencia duplicado', 'DUPLICATE_KEY', error);
      }
      throw new AsistenciaDAOError('Error al crear la asistencia', 'DATABASE_ERROR', error);
    }
  }
}
