import { prisma } from '@/lib/prisma';
import { ReporteAsistencia, EstadoAsistencia } from '@/models/ReporteAsistencia';
import { CrearReporteAsistenciaRequest } from '@/dto/reporteAsistencia.dto';

export class ReporteAsistenciaDAOError extends Error {
  code: string;
  originalError?: any;

  constructor(message: string, code: string, originalError?: any) {
    super(message);
    this.code = code;
    this.originalError = originalError;
    this.name = 'ReporteAsistenciaDAOError';
  }
}

function mapToReporte(row: any): ReporteAsistencia {
  const estadoValido = [EstadoAsistencia.Presente, EstadoAsistencia.Ausente, EstadoAsistencia.Justificado];
  const estado = estadoValido.includes(row.estado as EstadoAsistencia)
    ? (row.estado as EstadoAsistencia)
    : EstadoAsistencia.Ausente;

  return {
    id: Number(row.id),
    asociado_id: row.asociadoId != null ? Number(row.asociadoId) : null,
    congregado_id: row.congregadoId != null ? Number(row.congregadoId) : null,
    evento_id: Number(row.eventoId),
    fecha: row.fecha instanceof Date
      ? row.fecha.toISOString().split('T')[0]
      : new Date(row.fecha).toISOString().split('T')[0],
    estado,
    hora_registro: row.horaRegistro ?? null,
    justificacion: row.justificacion ?? null,
    created_at: row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : new Date(row.createdAt ?? Date.now()).toISOString(),
    updated_at: row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : new Date(row.updatedAt ?? Date.now()).toISOString(),
  };
}

export class ReporteAsistenciaDAO {
  async crear(data: CrearReporteAsistenciaRequest): Promise<ReporteAsistencia> {
    try {
      const fechaDate = new Date(data.fecha);

      if (data.asociado_id != null) {
        const row = await prisma.reporteAsistencia.upsert({
          where: {
            asociadoId_eventoId_fecha: {
              asociadoId: data.asociado_id,
              eventoId: data.evento_id,
              fecha: fechaDate,
            },
          },
          update: {
            estado: data.estado as any,
            justificacion: data.justificacion ?? null,
            horaRegistro: new Date(),
          },
          create: {
            asociadoId: data.asociado_id,
            eventoId: data.evento_id,
            fecha: fechaDate,
            estado: data.estado as any,
            justificacion: data.justificacion ?? null,
            horaRegistro: new Date(),
          },
        });
        return mapToReporte(row);
      }

      if (data.congregado_id != null) {
        const row = await prisma.reporteAsistencia.upsert({
          where: {
            congregadoId_eventoId_fecha: {
              congregadoId: data.congregado_id,
              eventoId: data.evento_id,
              fecha: fechaDate,
            },
          },
          update: {
            estado: data.estado as any,
            justificacion: data.justificacion ?? null,
            horaRegistro: new Date(),
          },
          create: {
            congregadoId: data.congregado_id,
            eventoId: data.evento_id,
            fecha: fechaDate,
            estado: data.estado as any,
            justificacion: data.justificacion ?? null,
            horaRegistro: new Date(),
          },
        });
        return mapToReporte(row);
      }

      throw new ReporteAsistenciaDAOError('Debe indicar asociadoId o congregadoId', 'VALIDATION_ERROR');
    } catch (error: any) {
      if (error instanceof ReporteAsistenciaDAOError) throw error;
      if (error.code === 'P2003') {
        throw new ReporteAsistenciaDAOError('El asociado, congregado o evento no existe', 'FOREIGN_KEY_VIOLATION', error);
      }
      throw new ReporteAsistenciaDAOError(`Error al crear el registro: ${error.message}`, 'DATABASE_ERROR', error);
    }
  }

  async actualizar(id: number, data: { estado: string; justificacion?: string }): Promise<ReporteAsistencia> {
    try {
      const row = await prisma.reporteAsistencia.update({
        where: { id },
        data: {
          estado: data.estado as any,
          justificacion: data.justificacion ?? null,
        },
      });
      return mapToReporte(row);
    } catch (error: any) {
      if (error instanceof ReporteAsistenciaDAOError) throw error;
      throw new ReporteAsistenciaDAOError('Error al actualizar el registro de asistencia en la base de datos', 'DATABASE_ERROR', error);
    }
  }

  async obtenerPorEventoId(eventoId: number): Promise<ReporteAsistencia[]> {
    try {
      const rows = await prisma.reporteAsistencia.findMany({
        where: { eventoId },
        orderBy: { id: 'asc' },
      });
      return rows.map(mapToReporte);
    } catch (error: any) {
      throw new ReporteAsistenciaDAOError(`Error al obtener registros: ${error.message}`, 'DATABASE_ERROR', error);
    }
  }

  async eliminarPorEvento(eventoId: number): Promise<number> {
    try {
      const result = await prisma.reporteAsistencia.deleteMany({ where: { eventoId } });
      return result.count;
    } catch (error: any) {
      throw new ReporteAsistenciaDAOError(`Error al eliminar registros: ${error.message}`, 'DATABASE_ERROR', error);
    }
  }

  async obtenerPorId(id: number): Promise<ReporteAsistencia | null> {
    try {
      const row = await prisma.reporteAsistencia.findUnique({ where: { id } });
      return row ? mapToReporte(row) : null;
    } catch (error: any) {
      throw new ReporteAsistenciaDAOError(`Error al obtener registro por ID: ${error.message}`, 'DATABASE_ERROR', error);
    }
  }
}
