
import { Pool } from 'pg';
import { ReporteAsistenciaDAO } from '@/dao/reporteAsistencia.dao';
import { ReporteAsistencia, EstadoAsistencia, FiltrosReporte, EstadisticasAsistencia } from '@/models/ReporteAsistencia';
import { 
  CrearReporteAsistenciaDTO, 
  ActualizarReporteAsistenciaDTO,
  ReporteAsistenciaResponseDTO,
  ReporteAsistenciaDetalladoDTO,
  EstadisticasAsistenciaDTO
} from '@/dto/reporteAsistencia.dto';

export class ReporteAsistenciaService {
  private dao: ReporteAsistenciaDAO;

  constructor(pool: Pool) {
    this.dao = new ReporteAsistenciaDAO(pool);
  }

  /**
   * Crear un nuevo reporte de asistencia
   */
  async crearReporte(dto: CrearReporteAsistenciaDTO): Promise<ReporteAsistenciaResponseDTO> {
    // Validar que no exista un reporte duplicado
    const existe = await this.dao.existeReporte(
      dto.asociadoId,
      dto.eventoId,
      new Date(dto.fecha)
    );

    if (existe) {
      throw new Error('Ya existe un reporte de asistencia para este asociado en este evento y fecha');
    }

    // Crear el reporte
    const reporte = await this.dao.crear({
      asociadoId: dto.asociadoId,
      eventoId: dto.eventoId,
      fecha: new Date(dto.fecha),
      estado: dto.estado as EstadoAsistencia,
      horaRegistro: dto.horaRegistro || new Date().toTimeString().split(' ')[0],
      observaciones: dto.observaciones,
      justificacion: dto.justificacion
    } as Omit<ReporteAsistencia, 'id' | 'createdAt' | 'updatedAt'>);

    // Refrescar la vista materializada
    await this.dao.refrescarVista();

    return this.mapearAResponseDTO(reporte);
  }

  /**
   * Obtener un reporte por ID
   */
  async obtenerReportePorId(id: number): Promise<ReporteAsistenciaResponseDTO | null> {
    const reporte = await this.dao.obtenerPorId(id);
    
    if (!reporte) {
      return null;
    }

    return this.mapearAResponseDTO(reporte);
  }

  /**
   * Obtener un reporte detallado por ID
   */
  async obtenerReporteDetallado(id: number): Promise<ReporteAsistenciaDetalladoDTO | null> {
    const reporte = await this.dao.obtenerDetalladoPorId(id);
    
    if (!reporte) {
      return null;
    }

    return this.mapearADetalladoDTO(reporte);
  }

  /**
   * Listar reportes con filtros y paginación
   */
  async listarReportes(
    filtros: FiltrosReporte = {},
    pagina: number = 1,
    porPagina: number = 50
  ): Promise<{
    reportes: ReporteAsistenciaDetalladoDTO[];
    total: number;
    pagina: number;
    porPagina: number;
    totalPaginas: number;
  }> {
    const offset = (pagina - 1) * porPagina;
    
    const [reportes, total] = await Promise.all([
      this.dao.listar(filtros, porPagina, offset),
      this.dao.contar(filtros)
    ]);

    return {
      reportes: reportes.map(r => this.mapearADetalladoDTO(r)),
      total,
      pagina,
      porPagina,
      totalPaginas: Math.ceil(total / porPagina)
    };
  }

  /**
   * Obtener estadísticas de asistencia
   */
  async obtenerEstadisticas(filtros: FiltrosReporte = {}): Promise<EstadisticasAsistenciaDTO> {
    const stats = await this.dao.obtenerEstadisticas(filtros);
    
    return {
      totalEventos: stats.total_eventos,
      totalPresentes: stats.total_presentes,
      totalAusentes: stats.total_ausentes,
      totalJustificados: stats.total_justificados,
      totalTardanzas: stats.total_tardanzas,
      porcentajeAsistencia: Number(stats.porcentaje_asistencia)
    };
  }

  /**
   * Actualizar un reporte de asistencia
   */
  async actualizarReporte(
    id: number,
    dto: ActualizarReporteAsistenciaDTO
  ): Promise<ReporteAsistenciaResponseDTO | null> {
    // Verificar que el reporte existe
    const reporteExistente = await this.dao.obtenerPorId(id);
    
    if (!reporteExistente) {
      throw new Error('El reporte de asistencia no existe');
    }

    // Preparar datos para actualizar
    const datosActualizar: any = {};
    
    if (dto.estado !== undefined) {
      datosActualizar.estado = dto.estado;
    }
    
    if (dto.horaRegistro !== undefined) {
      datosActualizar.horaRegistro = dto.horaRegistro;
    }
    
    if (dto.observaciones !== undefined) {
      datosActualizar.observaciones = dto.observaciones;
    }
    
    if (dto.justificacion !== undefined) {
      datosActualizar.justificacion = dto.justificacion;
    }

    // Actualizar el reporte
    const reporteActualizado = await this.dao.actualizar(id, datosActualizar);
    
    if (!reporteActualizado) {
      return null;
    }

    // Refrescar la vista materializada
    await this.dao.refrescarVista();

    return this.mapearAResponseDTO(reporteActualizado);
  }

  /**
   * Eliminar un reporte de asistencia
   */
  async eliminarReporte(id: number): Promise<boolean> {
    const eliminado = await this.dao.eliminar(id);
    
    if (eliminado) {
      // Refrescar la vista materializada
      await this.dao.refrescarVista();
    }
    
    return eliminado;
  }

  /**
   * Registrar asistencia masiva para un evento
   */
  async registrarAsistenciaMasiva(
    eventoId: number,
    asistencias: Array<{
      asociadoId: number;
      estado: string;
      horaRegistro?: string;
      observaciones?: string;
    }>
  ): Promise<{
    exitosos: number;
    fallidos: number;
    errores: string[];
  }> {
    let exitosos = 0;
    let fallidos = 0;
    const errores: string[] = [];

    for (const asistencia of asistencias) {
      try {
        await this.crearReporte({
          asociadoId: asistencia.asociadoId,
          eventoId,
          fecha: new Date().toISOString().split('T')[0],
          estado: asistencia.estado,
          horaRegistro: asistencia.horaRegistro,
          observaciones: asistencia.observaciones
        });
        exitosos++;
      } catch (error) {
        fallidos++;
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        errores.push(`Asociado ${asistencia.asociadoId}: ${errorMsg}`);
      }
    }

    // Refrescar la vista una sola vez al final
    if (exitosos > 0) {
      await this.dao.refrescarVista();
    }

    return { exitosos, fallidos, errores };
  }

  /**
   * Obtener historial de asistencia de un asociado
   */
  async obtenerHistorialAsociado(
    asociadoId: number,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<ReporteAsistenciaDetalladoDTO[]> {
    const filtros: FiltrosReporte = {
      asociadoId,
      fechaInicio,
      fechaFin
    };

    const reportes = await this.dao.listar(filtros, 1000, 0);
    return reportes.map(r => this.mapearADetalladoDTO(r));
  }

  /**
   * Obtener reportes de un evento específico
   */
  async obtenerReportesEvento(eventoId: number): Promise<ReporteAsistenciaDetalladoDTO[]> {
    const filtros: FiltrosReporte = { eventoId };
    const reportes = await this.dao.listar(filtros, 1000, 0);
    return reportes.map(r => this.mapearADetalladoDTO(r));
  }

  /**
   * Mapear modelo a DTO de respuesta
   */
  private mapearAResponseDTO(reporte: ReporteAsistencia): ReporteAsistenciaResponseDTO {
    return {
      id: reporte.id,
      asociadoId: reporte.asociadoId,
      eventoId: reporte.eventoId,
      fecha: reporte.fecha.toISOString().split('T')[0],
      estado: reporte.estado,
      horaRegistro: reporte.horaRegistro,
      observaciones: reporte.observaciones,
      justificacion: reporte.justificacion,
      createdAt: reporte.createdAt.toISOString(),
      updatedAt: reporte.updatedAt.toISOString()
    };
  }

  /**
   * Mapear datos de vista a DTO detallado
   */
  private mapearADetalladoDTO(data: any): ReporteAsistenciaDetalladoDTO {
    return {
      id: data.id,
      asociadoId: data.asociado_id,
      asociadoNombre: data.asociado_nombre,
      asociadoCedula: data.asociado_cedula,
      asociadoMinisterio: data.asociado_ministerio,
      eventoId: data.evento_id,
      eventoNombre: data.evento_nombre,
      eventoTipo: data.evento_tipo,
      fecha: data.fecha,
      estado: data.estado,
      horaRegistro: data.hora_registro,
      observaciones: data.observaciones,
      justificacion: data.justificacion,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
