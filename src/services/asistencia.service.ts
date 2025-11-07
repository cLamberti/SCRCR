import {
  RegistroAsistenciaRequest,
  AsistenciaResponse,
  AsistenciaResponseWithMessage,
} from "@/dto/asistencia.dto";
import { AsistenciaDAO } from "@/dao/asistencia.dao";
import { validateRegistroAsistenciaInput } from "@/validators/asistencia.validator";

export class AsistenciaServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: string[]
  ) {
    super(message);
    this.name = "AsistenciaServiceError";
  }
}

export class AsistenciaService {
  private asistenciaDAO: AsistenciaDAO;

  constructor() {
    this.asistenciaDAO = new AsistenciaDAO();
  }

  async registroAsistencia(
    data: RegistroAsistenciaRequest
  ): Promise<AsistenciaResponseWithMessage> {
    try {
   
      const base = validateRegistroAsistenciaInput(data, { forbidFuture: true });
      if (!base.ok) {
        throw new AsistenciaServiceError(
          "Entrada inválida.",
          400,
          base.issues.map(i => `${i.field}: ${i.message}`)
        );
      }

 
      const existe = await this.asistenciaDAO.existeAsociado(data.id_asociado);
      if (!existe) {
        throw new AsistenciaServiceError(
          "El asociado no existe.",
          404,
          ["id_asociado: no encontrado"]
        );
      }

  
      const duplicado = await this.asistenciaDAO.obtenerPorAsociadoActividadYFecha(
        data.id_asociado,
        data.id_actividad,
        data.fecha_asistencia
      );
      if (duplicado) {
        throw new AsistenciaServiceError(
          "La asistencia ya fue registrada para ese asociado, actividad y fecha.",
          409,
          ["fecha_asistencia: registro duplicado"]
        );
      }


      const inserted = await this.asistenciaDAO.crear(data);

      const res: AsistenciaResponse = {
        id: inserted.id,
        id_asociado: inserted.id_asociado,
        id_actividad: inserted.id_actividad,
        fecha_asistencia: inserted.fecha_asistencia,
        fecha_registro: inserted.fecha_registro,
      };

      return {
        success: true,
        data: res,
        message: "Asistencia registrada correctamente.",
      };
    } catch (error) {
      if (error instanceof AsistenciaServiceError) throw error;
      console.error("Error interno en registroAsistencia:", error);
      throw new AsistenciaServiceError(
        "Error interno al intentar registrar la asistencia.",
        500
      );
    }
  }
}
