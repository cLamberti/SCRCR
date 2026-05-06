import { db } from '@/lib/db';
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
        const res = await db.query('SELECT id, nombre_completo as nombre, email as identificacion FROM usuarios WHERE id = $1', [id]);
        return res.rows.length ? res.rows[0] : null;
      } else if (tipo === 'asociado') {
        const res = await db.query('SELECT id, nombre_completo as nombre, cedula as identificacion FROM asociados WHERE id = $1', [id]);
        return res.rows.length ? res.rows[0] : null;
      } else if (tipo === 'congregado') {
        const res = await db.query('SELECT id, nombre, cedula as identificacion FROM congregados WHERE id = $1', [id]);
        return res.rows.length ? res.rows[0] : null;
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
      const res = await db.query(
        `SELECT id, fecha_inicio, fecha_fin, motivo, estado, created_at, updated_at, observaciones_resolucion 
         FROM permisos WHERE usuario_id = $1 ORDER BY created_at DESC`,
        [usuarioId]
      );
      
      const items: HistorialItemDTO[] = [];
      
      res.rows.forEach((row: any) => {
        // Solo mostramos resoluciones (Aprobado/Rechazado) en el historial
        if (row.estado !== 'PENDIENTE') {
          items.push({
            id_registro: 'p-res-' + row.id,
            tipo: 'permiso',
            fecha: row.updated_at,
            descripcion: `Resolución de permiso: ${row.estado}`,
            estado: row.estado,
            detalles: { 
               motivo: row.motivo,
               observaciones: row.observaciones_resolucion 
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
      // Usamos reportes_asistencia que contiene el estado real (presente/ausente/justificado)
      const res = await db.query(
        `SELECT ra.id, ra.fecha, ra.estado, ra.justificacion, ra.observaciones,
                e.nombre as nombre_evento
         FROM reportes_asistencia ra
         JOIN eventos e ON ra.evento_id = e.id
         WHERE ra.asociado_id = $1 ORDER BY ra.fecha DESC`,
        [asociadoId]
      );
      return res.rows.map((row: any) => {
        const estadoLabel =
          row.estado === 'presente'    ? 'Presente' :
          row.estado === 'ausente'     ? 'Ausente' :
          row.estado === 'justificado' ? 'Justificado' : row.estado;

        return {
          id_registro: row.id,
          tipo: 'asistencia' as const,
          fecha: row.fecha,
          descripcion: `${estadoLabel} — ${row.nombre_evento}`,
          estado: estadoLabel,
          detalles: {
            observaciones: row.justificacion || row.observaciones
          }
        };
      });
    } catch (error) {
      throw new HistorialDAOError('Error al obtener asistencias de asociado', error);
    }
  }

  private async obtenerModificaciones(id: number, tipo: string): Promise<HistorialItemDTO[]> {
    try {
      // Devolvemos el registro de modificación (updated_at y created_at)
      const items: HistorialItemDTO[] = [];
      let res;
      
      if (tipo === 'usuario') {
        res = await db.query('SELECT created_at, updated_at, estado FROM usuarios WHERE id = $1', [id]);
      } else if (tipo === 'asociado') {
        res = await db.query('SELECT created_at, updated_at, estado FROM asociados WHERE id = $1', [id]);
      } else if (tipo === 'congregado') {
        res = await db.query('SELECT created_at, updated_at, estado FROM congregados WHERE id = $1', [id]);
      }
      
      if (res && res.rows.length > 0) {
        const { created_at, updated_at, estado } = res.rows[0];
        const statusText = estado === 1 ? 'Activo' : 'Inactivo';
        
        const d1 = new Date(created_at).getTime();
        const d2 = new Date(updated_at).getTime();
        
        // Debug para ver qué llega de la BD
        console.log(`[HistorialDAO] ID:${id} - Created:${d1} - Updated:${d2} - Diff:${d2 - d1}`);

        // Registro de Actualización (si d2 > d1 con margen de 100ms)
        const isModified = (d2 - d1) > 100; 

        if (isModified) {
          items.push({
            id_registro: 'mod-' + id,
            tipo: 'modificacion',
            fecha: updated_at,
            descripcion: `Actualización de perfil (Estado: ${statusText})`,
            estado: 'Completado'
          });
        }
        
        // Registro de Creación/Registro Inicial
        items.push({
          id_registro: 'creacion-' + id,
          tipo: 'modificacion',
          fecha: created_at,
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
      const res = await db.query(
        'SELECT id, accion, detalles, fecha FROM auditoria WHERE tabla = $1 AND registro_id = $2 ORDER BY fecha DESC',
        [tabla, id]
      );
      
      return res.rows.map((row: any) => ({
        id_registro: 'aud-' + row.id,
        tipo: 'modificacion',
        fecha: row.fecha,
        descripcion: row.detalles,
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
      const resAud = await db.query(`
        SELECT a.*, 
               COALESCE(aso.nombre_completo, con.nombre, usu.nombre_completo, e.nombre, 'Sistema') as nombre_persona
        FROM auditoria a
        LEFT JOIN asociados aso ON a.tabla = 'asociados' AND a.registro_id = aso.id
        LEFT JOIN congregados con ON a.tabla = 'congregados' AND a.registro_id = con.id
        LEFT JOIN usuarios usu ON a.tabla = 'usuarios' AND a.registro_id = usu.id
        LEFT JOIN eventos e ON a.tabla = 'eventos' AND a.registro_id = e.id
        ORDER BY a.fecha DESC LIMIT 100
      `);

      resAud.rows.forEach((a: any) => {
        // Limpiamos la descripción si viene con el formato viejo "(tabla)"
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
          _persona: a.nombre_persona
        } as any);
      });

      // B. Fallback de Eventos (para los que se crearon antes de la tabla auditoría)
      const resEventos = await db.query('SELECT id, nombre, created_at FROM eventos ORDER BY created_at DESC LIMIT 50');
      resEventos.rows.forEach((e: any) => {
        // Solo añadir si NO hay una auditoría que ya mencione este evento (por ID o por nombre)
        const yaExisteEnAuditoria = items.some((i: any) => 
          (String(i.id_registro).includes('aud-') && i.descripcion.includes(e.nombre))
        );
        
        if (!yaExisteEnAuditoria) {
          items.push({
            id_registro: 'evt-old-' + e.id,
            tipo: 'modificacion',
            fecha: e.created_at,
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
