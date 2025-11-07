import { db } from '../lib/db';
import { 
  RegistrarAsistenciaDto, 
  AsistenciaDto, 
  AsistenciaConAsociadoDto,
  EstadisticasAsistenciaDto,
  AsistenciaPorEventoDto
} from '../dto/asistencia.dto';
import { QueryResult } from 'pg';

export class AsistenciaDAO {
  
  // Obtener asistencias por evento con información del asociado
  static async obtenerPorEvento(eventoId: number): Promise<AsistenciaConAsociadoDto[]> {
    try {
      const query = `
        SELECT 
          a.asociado_id,
          a.evento_id,
          a.presente,
          COALESCE(a.created_at, NOW()) as created_at,
          COALESCE(a.updated_at, NOW()) as updated_at,
          asoc.nombre_completo,
          asoc.correo as email,
          asoc.telefono,
          NULL as fecha_nacimiento,
          asoc.id as asociado_real_id
        FROM asociados asoc
        LEFT JOIN asistencias a ON asoc.id = a.asociado_id AND a.evento_id = $1
        WHERE asoc.estado = 1
        ORDER BY asoc.nombre_completo ASC
      `;
      
      const result: QueryResult = await db.query(query, [eventoId]);
      
      return result.rows.map(row => ({
        asociado_id: row.asociado_id || row.asociado_real_id,
        evento_id: eventoId,
        presente: row.presente || false,
        nombre_completo: row.nombre_completo,
        email: row.email,
        telefono: row.telefono,
        fecha_nacimiento: row.fecha_nacimiento,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('Error al obtener asistencias por evento:', error);
      throw new Error('Error al obtener las asistencias del evento');
    }
  }

  // Registrar asistencia
  static async registrar(datos: RegistrarAsistenciaDto): Promise<AsistenciaDto> {
    try {
      const query = `
        INSERT INTO asistencias (asociado_id, evento_id, presente)
        VALUES ($1, $2, $3)
        ON CONFLICT (asociado_id, evento_id) 
        DO UPDATE SET 
          presente = EXCLUDED.presente,
          updated_at = NOW()
        RETURNING asociado_id, evento_id, presente, created_at, updated_at
      `;
      
      const values = [datos.asociado_id, datos.evento_id, datos.presente];
      const result: QueryResult = await db.query(query, values);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
      throw new Error('Error al registrar la asistencia');
    }
  }

  // Eliminar asistencia
  static async eliminar(asociadoId: number, eventoId: number): Promise<boolean> {
    try {
      const query = `
        DELETE FROM asistencias 
        WHERE asociado_id = $1 AND evento_id = $2
      `;
      
      const result: QueryResult = await db.query(query, [asociadoId, eventoId]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error al eliminar asistencia:', error);
      throw new Error('Error al eliminar la asistencia');
    }
  }

  // Obtener asistencia específica
  static async obtenerAsistencia(asociadoId: number, eventoId: number): Promise<AsistenciaDto | null> {
    try {
      const query = `
        SELECT asociado_id, evento_id, presente, created_at, updated_at
        FROM asistencias 
        WHERE asociado_id = $1 AND evento_id = $2
      `;
      
      const result: QueryResult = await db.query(query, [asociadoId, eventoId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error al obtener asistencia:', error);
      throw new Error('Error al obtener la asistencia');
    }
  }

  // Obtener estadísticas de asistencia por evento
  static async obtenerEstadisticas(eventoId: number): Promise<EstadisticasAsistenciaDto> {
    try {
      const query = `
        SELECT 
          e.id as evento_id,
          e.nombre as nombre_evento,
          COUNT(asoc.id) as total_asociados,
          COUNT(CASE WHEN a.presente = true THEN 1 END) as presentes,
          COUNT(CASE WHEN a.presente = false OR a.presente IS NULL THEN 1 END) as ausentes,
          CASE 
            WHEN COUNT(asoc.id) > 0 THEN 
              ROUND((COUNT(CASE WHEN a.presente = true THEN 1 END)::decimal / COUNT(asoc.id)) * 100, 2)
            ELSE 0 
          END as porcentaje_asistencia
        FROM eventos e
        CROSS JOIN asociados asoc
        LEFT JOIN asistencias a ON asoc.id = a.asociado_id AND a.evento_id = e.id
        WHERE e.id = $1 AND asoc.estado = 1
        GROUP BY e.id, e.nombre
      `;
      
      const result: QueryResult = await db.query(query, [eventoId]);
      
      if (result.rows.length === 0) {
        throw new Error('Evento no encontrado');
      }
      
      const row = result.rows[0];
      return {
        evento_id: row.evento_id,
        nombre_evento: row.nombre_evento,
        total_asociados: parseInt(row.total_asociados),
        presentes: parseInt(row.presentes),
        ausentes: parseInt(row.ausentes),
        porcentaje_asistencia: parseFloat(row.porcentaje_asistencia)
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error('Error al obtener las estadísticas de asistencia');
    }
  }

  // Obtener asistencias completas por evento (con estadísticas)
  static async obtenerAsistenciasCompletas(eventoId: number): Promise<AsistenciaPorEventoDto> {
    try {
      // Obtener información del evento
      const queryEvento = `
        SELECT id, nombre, fecha, hora
        FROM eventos 
        WHERE id = $1
      `;
      
      const resultEvento: QueryResult = await db.query(queryEvento, [eventoId]);
      
      if (resultEvento.rows.length === 0) {
        throw new Error('Evento no encontrado');
      }
      
      const evento = resultEvento.rows[0];
      
      // Obtener asistencias y estadísticas en paralelo
      const [asistencias, estadisticas] = await Promise.all([
        this.obtenerPorEvento(eventoId),
        this.obtenerEstadisticas(eventoId)
      ]);
      
      return {
        evento_id: evento.id,
        nombre_evento: evento.nombre,
        fecha_evento: evento.fecha,
        hora_evento: evento.hora,
        asistencias,
        estadisticas: {
          total: estadisticas.total_asociados,
          presentes: estadisticas.presentes,
          ausentes: estadisticas.ausentes,
          porcentaje: estadisticas.porcentaje_asistencia
        }
      };
    } catch (error) {
      console.error('Error al obtener asistencias completas:', error);
      throw new Error('Error al obtener la información completa de asistencias');
    }
  }

  // Verificar si existe asistencia
  static async existeAsistencia(asociadoId: number, eventoId: number): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM asistencias 
        WHERE asociado_id = $1 AND evento_id = $2
      `;
      
      const result: QueryResult = await db.query(query, [asociadoId, eventoId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('Error al verificar asistencia:', error);
      return false;
    }
  }

  // Obtener historial de asistencias de un asociado
  static async obtenerHistorialAsociado(asociadoId: number): Promise<AsistenciaDto[]> {
    try {
      const query = `
        SELECT 
          a.asociado_id,
          a.evento_id,
          a.presente,
          a.created_at,
          a.updated_at,
          e.nombre as nombre_evento,
          e.fecha,
          e.hora
        FROM asistencias a
        JOIN eventos e ON a.evento_id = e.id
        WHERE a.asociado_id = $1
        ORDER BY e.fecha DESC, e.hora DESC
      `;
      
      const result: QueryResult = await db.query(query, [asociadoId]);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener historial de asistencias:', error);
      throw new Error('Error al obtener el historial de asistencias');
    }
  }

  // Contar total de asistencias por evento
  static async contarAsistenciasPorEvento(eventoId: number): Promise<{ presentes: number; total: number }> {
    try {
      const query = `
        SELECT 
          COUNT(CASE WHEN a.presente = true THEN 1 END) as presentes,
          COUNT(asoc.id) as total
        FROM asociados asoc
        LEFT JOIN asistencias a ON asoc.id = a.asociado_id AND a.evento_id = $1
        WHERE asoc.estado = 1
      `;
      
      const result: QueryResult = await db.query(query, [eventoId]);
      const row = result.rows[0];
      
      return {
        presentes: parseInt(row.presentes),
        total: parseInt(row.total)
      };
    } catch (error) {
      console.error('Error al contar asistencias:', error);
      throw new Error('Error al contar las asistencias');
    }
  }
}