import { prisma } from '@/lib/prisma';
import {
  CrearAsociadoRequest,
  ActualizarAsociadoRequest,
  FiltrosAsociadoRequest,
} from '@/dto/asociado.dto';
import { Asociado, AsociadoModel } from '@/models/Asociado';

export interface PaginacionResultado<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AsociadoDAOError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AsociadoDAOError';
  }
}

function mapToAsociado(row: any): Asociado {
  return new AsociadoModel({
    id: row.id,
    nombreCompleto: row.nombreCompleto,
    cedula: row.cedula,
    correo: row.correo ?? undefined,
    telefono: row.telefono ?? undefined,
    ministerio: row.ministerio ?? undefined,
    direccion: row.direccion ?? undefined,
    fechaIngreso: row.fechaIngreso,
    estado: row.estado,
  });
}

export class AsociadoDAO {
  async crear(data: CrearAsociadoRequest): Promise<Asociado> {
    try {
      const row = await prisma.asociado.create({
        data: {
          nombreCompleto: data.nombreCompleto,
          cedula: data.cedula,
          correo: data.correo ?? null,
          telefono: data.telefono ?? null,
          ministerio: data.ministerio ?? null,
          direccion: data.direccion ?? null,
          fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : new Date(),
          estado: data.estado ?? 1,
        },
      });
      return mapToAsociado(row);
    } catch (error: any) {
      if (error instanceof AsociadoDAOError) throw error;
      if (error.code === 'P2002') {
        throw new AsociadoDAOError('Ya existe un asociado con esta cédula', 'DUPLICATE_KEY', error);
      }
      throw new AsociadoDAOError('Error al crear el asociado en la base de datos', 'DATABASE_ERROR', error);
    }
  }

  async obtenerPorId(id: number): Promise<Asociado | null> {
    try {
      const row = await prisma.asociado.findUnique({ where: { id } });
      return row ? mapToAsociado(row) : null;
    } catch (error) {
      throw new AsociadoDAOError('Error al obtener el asociado por ID', 'DATABASE_ERROR', error);
    }
  }

  async obtenerPorCedula(cedula: string): Promise<Asociado | null> {
    try {
      const row = await prisma.asociado.findUnique({ where: { cedula } });
      return row ? mapToAsociado(row) : null;
    } catch (error) {
      throw new AsociadoDAOError('Error al obtener el asociado por cédula', 'DATABASE_ERROR', error);
    }
  }

  async obtenerTodos(
    page: number = 1,
    limit: number = 10,
    estado?: number,
    filtros?: Pick<FiltrosAsociadoRequest, 'nombreCompleto' | 'cedula' | 'ministerio' | 'fechaIngresoDesde' | 'fechaIngresoHasta'>
  ): Promise<PaginacionResultado<Asociado>> {
    try {
      const offset = (page - 1) * limit;

      const where: any = {};
      if (estado !== undefined) where.estado = estado;
      if (filtros?.nombreCompleto) where.nombreCompleto = { contains: filtros.nombreCompleto, mode: 'insensitive' };
      if (filtros?.cedula) where.cedula = { contains: filtros.cedula, mode: 'insensitive' };
      if (filtros?.ministerio) where.ministerio = { contains: filtros.ministerio, mode: 'insensitive' };
      if (filtros?.fechaIngresoDesde || filtros?.fechaIngresoHasta) {
        where.fechaIngreso = {};
        if (filtros.fechaIngresoDesde) where.fechaIngreso.gte = new Date(filtros.fechaIngresoDesde);
        if (filtros.fechaIngresoHasta) where.fechaIngreso.lte = new Date(filtros.fechaIngresoHasta);
      }

      const [total, rows] = await Promise.all([
        prisma.asociado.count({ where }),
        prisma.asociado.findMany({
          where,
          orderBy: { id: 'desc' },
          skip: offset,
          take: limit,
        }),
      ]);

      return {
        data: rows.map(mapToAsociado),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    } catch (error) {
      throw new AsociadoDAOError('Error al obtener la lista de asociados', 'DATABASE_ERROR', error);
    }
  }

  async actualizar(id: number, data: ActualizarAsociadoRequest): Promise<Asociado> {
    try {
      const existente = await this.obtenerPorId(id);
      if (!existente) throw new AsociadoDAOError('Asociado no encontrado', 'NOT_FOUND');

      const row = await prisma.asociado.update({
        where: { id },
        data: {
          nombreCompleto: data.nombreCompleto ?? existente.nombreCompleto,
          cedula: data.cedula ?? existente.cedula,
          correo: data.correo ?? existente.correo ?? null,
          telefono: data.telefono ?? existente.telefono ?? null,
          ministerio: data.ministerio ?? existente.ministerio ?? null,
          direccion: data.direccion ?? existente.direccion ?? null,
          fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : existente.fechaIngreso,
          estado: data.estado ?? existente.estado,
        },
      });
      return mapToAsociado(row);
    } catch (error: any) {
      if (error instanceof AsociadoDAOError) throw error;
      if (error.code === 'P2002') {
        throw new AsociadoDAOError('Ya existe un asociado con esta cédula', 'DUPLICATE_KEY', error);
      }
      throw new AsociadoDAOError('Error al actualizar el asociado', 'DATABASE_ERROR', error);
    }
  }

  async eliminar(id: number): Promise<boolean> {
    try {
      const result = await prisma.asociado.updateMany({
        where: { id },
        data: { estado: 0 },
      });
      return result.count > 0;
    } catch (error) {
      throw new AsociadoDAOError('Error al eliminar el asociado', 'DATABASE_ERROR', error);
    }
  }

  async eliminarPermanente(id: number): Promise<boolean> {
    try {
      await prisma.asociado.delete({ where: { id } });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') return false;
      throw new AsociadoDAOError('Error al eliminar permanentemente el asociado', 'DATABASE_ERROR', error);
    }
  }

  async listarTodos(): Promise<Asociado[]> {
    try {
      const rows = await prisma.asociado.findMany({ orderBy: { nombreCompleto: 'asc' } });
      return rows.map(mapToAsociado);
    } catch (error) {
      throw new AsociadoDAOError('Error al listar todos los asociados', 'DATABASE_ERROR', error);
    }
  }

  async buscarPorNombre(nombre: string, limit: number = 10): Promise<Asociado[]> {
    try {
      const rows = await prisma.asociado.findMany({
        where: {
          nombreCompleto: { contains: nombre, mode: 'insensitive' },
          estado: 1,
        },
        orderBy: { nombreCompleto: 'asc' },
        take: limit,
      });
      return rows.map(mapToAsociado);
    } catch (error) {
      throw new AsociadoDAOError('Error al buscar asociados por nombre', 'DATABASE_ERROR', error);
    }
  }

  async obtenerEstadisticas(): Promise<{ total: number; activos: number; inactivos: number }> {
    try {
      const [total, activos] = await Promise.all([
        prisma.asociado.count(),
        prisma.asociado.count({ where: { estado: 1 } }),
      ]);
      return { total, activos, inactivos: total - activos };
    } catch (error) {
      throw new AsociadoDAOError('Error al obtener estadísticas', 'DATABASE_ERROR', error);
    }
  }
}
