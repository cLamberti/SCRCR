import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HistorialService } from '@/services/historial.service';
import { HistorialDAO } from '@/dao/historial.dao';
import { ConsultaHistorialRequest } from '@/dto/historial.dto';

vi.mock('@/dao/historial.dao');

describe('HistorialService', () => {
  let historialService: HistorialService;
  let mockDAO: any;

  beforeEach(() => {
    mockDAO = new HistorialDAO();
    
    // Inyectamos el mock DAO en el servicio de manera segura
    // (en una app real seria mejor usar inyeccion de dependencias via constructor)
    historialService = new HistorialService();
    (historialService as any).historialDAO = mockDAO;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });



  it('debe retornar el historial correctamente si los datos son válidos', async () => {
    const req: ConsultaHistorialRequest = {
      personaId: 1,
      tipoPersona: 'asociado'
    };

    const mockResponse = {
      persona: {
        id: 1,
        nombre: 'Isaac',
        tipo: 'asociado'
      },
      historial: [
        {
          id_registro: 1,
          tipo: 'asistencia' as any,
          fecha: new Date(),
          descripcion: 'Asistencia'
        }
      ]
    };

    mockDAO.obtenerHistorialCompleto.mockResolvedValue(mockResponse);

    const result = await historialService.obtenerHistorial(req);

    expect(mockDAO.obtenerHistorialCompleto).toHaveBeenCalledWith(req);
    expect(result).toEqual(mockResponse);
  });
});
