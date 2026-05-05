import { prisma } from '@/lib/prisma';
import {
  CrearCongregadoRequest,
  ActualizarCongregadoRequest,
  FiltrosCongregadoRequest,
} from '@/dto/congregado.dto';
import { Congregado, CongregadoModel, EstadoCongregado, EstadoCivil } from '@/models/Congregado';

export interface PaginacionResultado<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CongregadoDAOError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'CongregadoDAOError';
  }
}

function mapToCongregado(row: any): Congregado {
  return new CongregadoModel({
    id: row.id,
    nombre: row.nombre,
    cedula: row.cedula,
    fechaIngreso: row.fechaIngreso,
    telefono: row.telefono,
    segundoTelefono: row.segundoTelefono ?? undefined,
    estadoCivil: row.estadoCivil as EstadoCivil,
    ministerio: row.ministerio,
    segundoMinisterio: row.segundoMinisterio ?? undefined,
    urlFotoCedula: row.urlFotoCedula,
    estado: row.estado as EstadoCongregado,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class CongregadoDAO {
  async crear(data: CrearCongregadoRequest): Promise<Congregado> {
    try {
      const row = await prisma.congregado.create({
        data: {
          nombre: data.nombre,
          cedula: data.cedula,
          fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : new Date(),
          telefono: data.telefono,
          segundoTelefono: data.segundoTelefono ?? null,
          estadoCivil: data.estadoCivil,
          ministerio: data.ministerio,
          segundoMinisterio: data.segundoMinisterio ?? null,
          urlFotoCedula: data.urlFotoCedula,
          estado: data.estado ?? EstadoCongregado.ACTIVO,
        },
      });
      return mapToCongregado(row);
    } catch (error: any) {
      if (error instanceof CongregadoDAOError) throw error;
      if (error.code === 'P2002') {
        throw new CongregadoDAOError('Ya existe un congregado con esta cédula', 'DUPLICATE_KEY', error);
      }
      throw new CongregadoDAOError('Error al crear el congregado', 'DATABASE_ERROR', error);
    }
  }

  async obtenerPorId(id: number): Promise<Congregado | null> {
    try {
      const row = await prisma.congregado.findUnique({ where: { id } });
      return row ? mapToCongregado(row) : null;
    } catch (error) {
      throw new CongregadoDAOError('Error al obtener el congregado por ID', 'DATABASE_ERROR', error);
    }
  }

  async obtenerPorCedula(cedula: string): Promise<Congregado | null> {
    try {
      const row = await prisma.congregado.findUnique({ where: { cedula } });
      return row ? mapToCongregado(row) : null;
    } catch (error) {
      throw new CongregadoDAOError('Error al obtener el congregado por cédula', 'DATABASE_ERROR', error);
    }
  }

  async obtenerTodos(
    page: number = 1,
    limit: number = 10,
    estado?: EstadoCongregado,
    filtros?: Pick<FiltrosCongregadoRequest, 'nombre' | 'cedula' | 'estadoCivil' | 'ministerio' | 'fechaIngresoDesde' | 'fechaIngresoHasta'>
  ): Promise<PaginacionResultado<Congregado>> {
    try {
      const offset = (page - 1) * limit;

      const where: any = {};
      if (estado !== undefined) where.estado = estado;
      if (filtros?.nombre) where.nombre = { contains: filtros.nombre, mode: 'insensitive' };
      if (filtros?.cedula) where.cedula = { contains: filtros.cedula, mode: 'insensitive' };
      if (filtros?.estadoCivil) where.estadoCivil = filtros.estadoCivil;
      if (filtros?.ministerio) {
        where.OR = [
          { ministerio: { contains: filtros.ministerio, mode: 'insensitive' } },
          { segundoMinisterio: { contains: filtros.ministerio, mode: 'insensitive' } },
        ];
      }
      if (filtros?.fechaIngresoDesde || filtros?.fechaIngresoHasta) {
        where.fechaIngreso = {};
        if (filtros.fechaIngresoDesde) where.fechaIngreso.gte = new Date(filtros.fechaIngresoDesde);
        if (filtros.fechaIngresoHasta) where.fechaIngreso.lte = new Date(filtros.fechaIngresoHasta);
      }

      const [total, rows] = await Promise.all([
        prisma.congregado.count({ where }),
        prisma.congregado.findMany({
          where,
          orderBy: { nombre: 'asc' },
          skip: offset,
          take: limit,
        }),
      ]);

      return {
        data: rows.map(mapToCongregado),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    } catch (error) {
      throw new CongregadoDAOError('Error al obtener la lista de congregados', 'DATABASE_ERROR', error);
    }
  }

  async actualizar(id: number, data: ActualizarCongregadoRequest): Promise<Congregado> {
    try {
      const existente = await this.obtenerPorId(id);
      if (!existente) throw new CongregadoDAOError('Congregado no encontrado', 'NOT_FOUND');

      const row = await prisma.congregado.update({
        where: { id },
        data: {
          nombre: data.nombre ?? existente.nombre,
          cedula: data.cedula ?? existente.cedula,
          fechaIngreso: data.fechaIngreso ? new Date(data.fechaIngreso) : existente.fechaIngreso,
          telefono: data.telefono ?? existente.telefono,
          segundoTelefono: data.segundoTelefono === null ? null : (data.segundoTelefono ?? existente.segundoTelefono ?? null),
          estadoCivil: data.estadoCivil ?? existente.estadoCivil,
          ministerio: data.ministerio ?? existente.ministerio,
          segundoMinisterio: data.segundoMinisterio === null ? null : (data.segundoMinisterio ?? existente.segundoMinisterio ?? null),
          urlFotoCedula: data.urlFotoCedula ?? existente.urlFotoCedula,
          estado: data.estado ?? existente.estado,
        },
      });
      return mapToCongregado(row);
    } catch (error: any) {
      if (error instanceof CongregadoDAOError) throw error;
      if (error.code === 'P2002') {
        throw new CongregadoDAOError('Ya existe un congregado con esta cédula', 'DUPLICATE_KEY', error);
      }
      throw new CongregadoDAOError('Error al actualizar el congregado', 'DATABASE_ERROR', error);
    }
  }

  async eliminar(id: number): Promise<boolean> {
    try {
      const result = await prisma.congregado.updateMany({
        where: { id },
        data: { estado: EstadoCongregado.INACTIVO },
      });
      return result.count > 0;
    } catch (error) {
      throw new CongregadoDAOError('Error al eliminar el congregado', 'DATABASE_ERROR', error);
    }
  }

  async eliminarPermanente(id: number): Promise<boolean> {
    try {
      await prisma.congregado.delete({ where: { id } });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') return false;
      throw new CongregadoDAOError('Error al eliminar permanentemente el congregado', 'DATABASE_ERROR', error);
    }
  }

  async listarTodos(): Promise<Congregado[]> {
    try {
      const rows = await prisma.congregado.findMany({ orderBy: { nombre: 'asc' } });
      return rows.map(mapToCongregado);
    } catch (error) {
      throw new CongregadoDAOError('Error al listar todos los congregados', 'DATABASE_ERROR', error);
    }
  }

  async buscarPorNombre(nombre: string, limit: number = 10): Promise<Congregado[]> {
    try {
      const rows = await prisma.congregado.findMany({
        where: {
          nombre: { contains: nombre, mode: 'insensitive' },
          estado: EstadoCongregado.ACTIVO,
        },
        orderBy: { nombre: 'asc' },
        take: limit,
      });
      return rows.map(mapToCongregado);
    } catch (error) {
      throw new CongregadoDAOError('Error al buscar congregados por nombre', 'DATABASE_ERROR', error);
    }
  }

  async obtenerEstadisticas(): Promise<{ total: number; activos: number; inactivos: number }> {
    try {
      const [total, activos] = await Promise.all([
        prisma.congregado.count(),
        prisma.congregado.count({ where: { estado: EstadoCongregado.ACTIVO } }),
      ]);
      return { total, activos, inactivos: total - activos };
    } catch (error) {
      throw new CongregadoDAOError('Error al obtener estadísticas', 'DATABASE_ERROR', error);
    }
  }
}
