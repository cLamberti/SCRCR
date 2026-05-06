import { prisma } from '@/lib/prisma';
import {
  ConsultaHistorialRequest,
  HistorialItemDTO,
  HistorialResponseDTO,
} from '@/dto/historial.dto';

export class HistorialDAOError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'HistorialDAOError';
  }
}

export class HistorialDAO {
  
  async obtenerPersona(id: number, tipo: string): Promise<{ id: number, nombre: string, identificacion?: string } | null> {
    try {
      if (tipo === 'usuario') {
        const row = await prisma.usuario.findUnique({ where: { id } });
        return row ? { id: row.id, nombre: row.nombreCompleto, identificacion: row.email } : null;
      } else if (tipo === 'asociado') {
        const row = await prisma.asociado.findUnique({ where: { id } });
        return row ? { id: row.id, nombre: row.nombreCompleto, identificacion: row.cedula } : null;
      } else if (tipo === 'congregado') {
        const row = await prisma.congregado.findUnique({ where: { id } });
        return row ? { id: row.id, nombre: row.nombre, identificacion: row.cedula } : null;
      }
      return null;
    } catch (error) {
      throw new HistorialDAOError('Error al obtener la persona', error);
    }
  }

  async obtenerHistorialCompleto(req: ConsultaHistorialRequest): Promise<HistorialResponseDTO> {
    const { personaId, tipoPersona, filtros } = req;
    
    let persona = await this.obtenerPersona(personaId, tipoPersona);
    
    // Si la persona ya no existe (eliminación permanente), devolvemos un objeto básico
    if (!persona) {
      persona = { id: personaId, nombre: `Persona Eliminada (ID: ${personaId})`, identificacion: 'N/D' };
    }

    let historial: HistorialItemDTO[] = [];

    // Dependiendo del tipo de persona, buscamos en diferentes tablas.
    // Si la persona es un Usuario, mostramos sus permisos
    if (tipoPersona === 'usuario' && (!filtros?.tipoRegistro || filtros.tipoRegistro === 'todos' || filtros.tipoRegistro === 'permiso')) {
      historial = historial.concat(await this.obtenerPermisosUsuario(personaId));
    }

    // Si la persona es un Asociado, mostramos sus asistencias
    if (tipoPersona === 'asociado' && (!filtros?.tipoRegistro || filtros.tipoRegistro === 'todos' || filtros.tipoRegistro === 'asistencia')) {
      historial = historial.concat(await this.obtenerAsistenciasAsociado(personaId));
    }

    // Para cualquier tipo de persona, mostramos las "modificaciones" reales de la bitácora
    if (!filtros?.tipoRegistro || filtros.tipoRegistro === 'todos' || filtros.tipoRegistro === 'modificacion') {
      const modalesAuditoria = await this.obtenerEventosAuditoria(personaId, tipoPersona);
      
      // Fallback: Si no hay NADA en auditoría (registros viejos), mostramos la simulación básica
      if (modalesAuditoria.length === 0) {
        historial = historial.concat(await this.obtenerModificaciones(personaId, tipoPersona));
      } else {
        historial = historial.concat(modalesAuditoria);
      }
    }

    // Filtrar por fechas
    if (filtros?.fechaDesde) {
      const desde = new Date(filtros.fechaDesde).getTime();
      historial = historial.filter(h => new Date(h.fecha).getTime() >= desde);
    }
    
    if (filtros?.fechaHasta) {
      const hasta = new Date(filtros.fechaHasta).getTime();
      historial = historial.filter(h => new Date(h.fecha).getTime() <= hasta);
    }

    // Ordenar cronológicamente descendente (más reciente primero)
    historial.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return {
      persona: {
        id: persona.id,
        nombre: persona.nombre,
        tipo: tipoPersona,
        identificacion: persona.identificacion
      },
      historial
    };
  }

  private async obtenerPermisosUsuario(usuarioId: number): Promise<HistorialItemDTO[]> {
    try {
      const rows = await prisma.permiso.findMany({
        where: { usuarioId },
        orderBy: { createdAt: 'desc' }
      });
      
      const items: HistorialItemDTO[] = [];
      
      rows.forEach((row) => {
        // Solo mostramos resoluciones (Aprobado/Rechazado) en el historial
        if (row.estado !== 'PENDIENTE') {
          items.push({
            id_registro: 'p-res-' + row.id,
            tipo: 'permiso',
            fecha: row.updatedAt,
            descripcion: `Resolución de permiso: ${row.estado}`,
            estado: row.estado,
            detalles: { 
               motivo: row.motivo,
               observaciones: row.observacionesResolucion ?? undefined
            }
          });
        }
      });
      
      return items;
    } catch (error) {
      throw new HistorialDAOError('Error al obtener permisos de usuario', error);
    }
  }

  private async obtenerAsistenciasAsociado(asociadoId: number): Promise<HistorialItemDTO[]> {
    try {
      const rows = await prisma.reporteAsistencia.findMany({
        where: { asociadoId },
        include: { evento: true },
        orderBy: { fecha: 'desc' }
      });
      return rows.map((row) => {
        const estadoLabel =
          row.estado === 'presente'    ? 'Presente' :
          row.estado === 'ausente'     ? 'Ausente' :
          row.estado === 'justificado' ? 'Justificado' : row.estado;

        return {
          id_registro: row.id,
          tipo: 'asistencia' as const,
          fecha: row.fecha,
          descripcion: `${estadoLabel} — ${row.evento.nombre}`,
          estado: estadoLabel,
          detalles: {
            observaciones: row.justificacion || row.observaciones || undefined
          }
        };
      });
    } catch (error) {
      throw new HistorialDAOError('Error al obtener asistencias de asociado', error);
    }
  }

  private async obtenerAsistenciasCongregado(congregadoId: number): Promise<HistorialItemDTO[]> {
    try {
      const rows = await prisma.reporteAsistencia.findMany({
        where: { congregadoId },
        include: { evento: true },
        orderBy: { fecha: 'desc' }
      });
      return rows.map((row) => {
        const estadoLabel =
          row.estado === 'presente'    ? 'Presente' :
          row.estado === 'ausente'     ? 'Ausente' :
          row.estado === 'justificado' ? 'Justificado' : row.estado;

        return {
          id_registro: row.id,
          tipo: 'asistencia' as const,
          fecha: row.fecha,
          descripcion: `${estadoLabel} — ${row.evento.nombre}`,
          estado: estadoLabel,
          detalles: {
            observaciones: row.justificacion || row.observaciones || undefined
          }
        };
      });
    } catch (error) {
      throw new HistorialDAOError('Error al obtener asistencias de congregado', error);
    }
  }

  private async obtenerModificaciones(id: number, tipo: string): Promise<HistorialItemDTO[]> {
    try {
      const items: HistorialItemDTO[] = [];
      let row: any;
      
      if (tipo === 'usuario') {
        row = await prisma.usuario.findUnique({ where: { id } });
      } else if (tipo === 'asociado') {
        row = await prisma.asociado.findUnique({ where: { id } });
      } else if (tipo === 'congregado') {
        row = await prisma.congregado.findUnique({ where: { id } });
      }
      
      if (row) {
        const statusText = row.estado === 1 ? 'Activo' : 'Inactivo';
        const createdAt = row.createdAt || row.created_at || new Date();
        const updatedAt = row.updatedAt || row.updated_at || createdAt;
        
        const d1 = new Date(createdAt).getTime();
        const d2 = new Date(updatedAt).getTime();
        
        if ((d2 - d1) > 100) {
          items.push({
            id_registro: 'mod-' + id,
            tipo: 'modificacion',
            fecha: updatedAt,
            descripcion: `Actualización de perfil (Estado: ${statusText})`,
            estado: 'Completado'
          });
        }
        
        items.push({
          id_registro: 'creacion-' + id,
          tipo: 'modificacion',
          fecha: createdAt,
          descripcion: `Registro inicial de ${tipo} en el sistema`,
          estado: 'Completado'
        });
      }
      
      return items;
    } catch (error) {
      throw new HistorialDAOError('Error al obtener modificaciones de persona', error);
    }
  }

  private async obtenerEventosAuditoria(id: number, tipo: string): Promise<HistorialItemDTO[]> {
    try {
      const tabla = tipo === 'asociado' ? 'asociados' : tipo === 'congregado' ? 'congregados' : 'usuarios';
      const rows = await prisma.auditoria.findMany({
        where: { tabla, registroId: id },
        orderBy: { fecha: 'desc' }
      });
      
      return rows.map((row) => ({
        id_registro: 'aud-' + row.id,
        tipo: 'modificacion',
        fecha: row.fecha,
        descripcion: row.detalles ?? '',
        estado: row.accion.toUpperCase(),
      }));
    } catch (error) {
      console.error('Error al obtener eventos de auditoría:', error);
      return [];
    }
  }

  public async obtenerHitosGlobales(): Promise<HistorialItemDTO[]> {
    try {
      const items: HistorialItemDTO[] = [];

      // A. Hitos de la tabla auditoría con nombres reales (Asociados, Congregados, Usuarios y Eventos)
      // Usamos $queryRaw para mantener la eficiencia del JOIN polimórfico
      const rowsAud = await prisma.$queryRaw<any[]>`
        SELECT a.id, a.tabla, a.registro_id as "registroId", a.accion, a.detalles, a.fecha,
               COALESCE(aso.nombre_completo, con.nombre, usu.nombre_completo, e.nombre, 'Sistema') as "nombrePersona"
        FROM auditoria a
        LEFT JOIN asociados aso ON a.tabla = 'asociados' AND a.registro_id = aso.id
        LEFT JOIN congregados con ON a.tabla = 'congregados' AND a.registro_id = con.id
        LEFT JOIN usuarios usu ON a.tabla = 'usuarios' AND a.registro_id = usu.id
        LEFT JOIN eventos e ON a.tabla = 'eventos' AND a.registro_id = e.id
        ORDER BY a.fecha DESC LIMIT 100
      `;

      rowsAud.forEach((a) => {
        let desc = a.detalles || '';
        if (desc.includes('(' + a.tabla + ')')) {
          desc = desc.split(' (' + a.tabla + ')')[0];
        }

        items.push({
          id_registro: 'aud-' + a.id,
          tipo: 'modificacion',
          fecha: a.fecha,
          descripcion: desc,
          estado: a.accion.toUpperCase(),
          _persona: a.nombrePersona
        } as any);
      });

      // B. Fallback de Eventos (para los que se crearon antes de la tabla auditoría)
      const oldEvents = await prisma.evento.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      
      oldEvents.forEach((e) => {
        const yaExisteEnAuditoria = items.some((i: any) => 
          (String(i.id_registro).includes('aud-') && i.descripcion.includes(e.nombre))
        );
        
        if (!yaExisteEnAuditoria) {
          items.push({
            id_registro: 'evt-old-' + e.id,
            tipo: 'modificacion',
            fecha: e.createdAt,
            descripcion: `Registro de evento: ${e.nombre}`,
            estado: 'ACTIVO',
            _persona: 'Sistema / Organización'
          } as any);
        }
      });

      // Ordenamos por fecha descendente
      const finalItems = items.sort((a, b) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      return finalItems;
    } catch (error) {
      throw new HistorialDAOError('Error al obtener hitos globales', error);
    }
  }
}
