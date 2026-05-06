import { HistorialDAO } from '@/dao/historial.dao';
import { ConsultaHistorialRequest, HistorialResponseDTO } from '@/dto/historial.dto';

export class HistorialService {
  private historialDAO: HistorialDAO;

  constructor() {
    this.historialDAO = new HistorialDAO();
  }

  async obtenerHistorial(req: ConsultaHistorialRequest): Promise<HistorialResponseDTO> {
    try {
      return await this.historialDAO.obtenerHistorialCompleto(req);
    } catch (error: any) {
      throw new Error(`Error en HistorialService: ${error.message}`);
    }
  }
}
