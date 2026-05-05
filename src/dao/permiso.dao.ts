import { prisma } from '@/lib/prisma';
import { Permiso, PermisoModel } from '@/models/Permiso';
import { CrearPermisoRequest, PermisoExtendidoDto } from '@/dto/permiso.dto';

export class PermisoDAOError extends Error {
  constructor(message: string, public code?: string, public originalError?: unknown) {
    super(message);
    this.name = 'PermisoDAOError';
  }
}

export interface PaginacionResultado<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString().split('T')[0];
}

function mapToPermiso(row: any): Permiso {
  return new PermisoModel({
    id: row.id,
    usuarioId: row.usuarioId,
    fechaInicio: formatDate(row.fechaInicio),
    fechaFin: formatDate(row.fechaFin),
    motivo: row.motivo,
    documentoUrl: row.documentoUrl ?? null,
    estado: row.estado,
    observacionesResolucion: row.observacionesResolucion ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function mapToPermisoExtendido(row: any): PermisoExtendidoDto {
  return {
    id: row.id,
    usuarioId: row.usuarioId,
    nombreCompleto: row.usuario?.nombreCompleto ?? '',
    fechaInicio: formatDate(row.fechaInicio),
    fechaFin: formatDate(row.fechaFin),
    motivo: row.motivo,
    documentoUrl: row.documentoUrl ?? null,
    estado: row.estado,
    observacionesResolucion: row.observacionesResolucion ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PermisoDAO {
  async crear(usuarioId: number, data: CrearPermisoRequest): Promise<Permiso> {
    try {
      const row = await prisma.permiso.create({
        data: {
          usuarioId,
          fechaInicio: new Date(data.fechaInicio),
          fechaFin: new Date(data.fechaFin),
          motivo: data.motivo,
          documentoUrl: data.documentoUrl ?? null,
          estado: data.estado ?? 'PENDIENTE',
        },
      });
      return mapToPermiso(row);
    } catch (error: any) {
      throw new PermisoDAOError('Error al crear el permiso en la base de datos', 'DATABASE_ERROR', error);
    }
  }

  async obtenerPorId(id: number): Promise<PermisoExtendidoDto | null> {
    try {
      const row = await prisma.permiso.findUnique({
        where: { id },
        include: { usuario: { select: { nombreCompleto: true } } },
      });
      return row ? mapToPermisoExtendido(row) : null;
    } catch (error) {
      throw new PermisoDAOError('Error al obtener el permiso por ID', 'DATABASE_ERROR', error);
    }
  }

  async verificarTraslape(usuarioId: number, fechaInicio: string, fechaFin: string): Promise<boolean> {
    try {
      const count = await prisma.permiso.count({
        where: {
          usuarioId,
          estado: { in: ['PENDIENTE', 'APROBADO'] },
          fechaInicio: { lte: new Date(fechaFin) },
          fechaFin: { gte: new Date(fechaInicio) },
        },
      });
      return count > 0;
    } catch (error) {
      throw new PermisoDAOError('Error al verificar traslape de fechas', 'DATABASE_ERROR', error);
    }
  }

  async obtenerTodos(
    page: number = 1,
    limit: number = 10,
    usuarioId?: number
  ): Promise<PaginacionResultado<PermisoExtendidoDto>> {
    try {
      const offset = (page - 1) * limit;
      const where = usuarioId !== undefined ? { usuarioId } : {};

      const [total, rows] = await Promise.all([
        prisma.permiso.count({ where }),
        prisma.permiso.findMany({
          where,
          include: { usuario: { select: { nombreCompleto: true } } },
          orderBy: { id: 'desc' },
          skip: offset,
          take: limit,
        }),
      ]);

      return {
        data: rows.map(mapToPermisoExtendido),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    } catch (error) {
      throw new PermisoDAOError('Error al obtener la lista de permisos', 'DATABASE_ERROR', error);
    }
  }

  async actualizarEstado(id: number, estado: 'APROBADO' | 'RECHAZADO', observaciones?: string): Promise<Permiso> {
    try {
      const row = await prisma.permiso.update({
        where: { id },
        data: {
          estado,
          observacionesResolucion: observaciones ?? null,
        },
      });
      return mapToPermiso(row);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new PermisoDAOError('Permiso no encontrado', 'NOT_FOUND', error);
      }
      throw new PermisoDAOError('Error al actualizar estado', 'DATABASE_ERROR', error);
    }
  }
}
