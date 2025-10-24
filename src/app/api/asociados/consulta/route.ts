import { NextRequest, NextResponse } from 'next/server';
import { AsociadoDAO } from '@/dao/asociado.dao';
import { PaginacionResultado } from '@/dao/asociado.dao';
import { AsociadoResponse } from '@/dto/asociado.dto';
import { Asociado } from '@/models/Asociado';
const asociadoDAO = new AsociadoDAO();

const mapAsociadosToResponse = (asociados: Asociado[]): AsociadoResponse[] => {
  return asociados.map(a => ({
    id: a.id,
    nombreCompleto: a.nombreCompleto,
    cedula: a.cedula,
    correo: a.correo,
    telefono: a.telefono,
    direccion: a.direccion,
    ministerio: a.ministerio,
    fechaIngreso: a.fechaIngreso ? a.fechaIngreso.toISOString() : '',
    estado: a.estado,
  }));
};

/**
 * GET /api/asociados/consulta
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get('all');
    
    let result: AsociadoResponse[] = [];
    let total = 0;
    
    if (all === 'true') {
      // 1. Obtener TODOS sin paginación (usa listarTodos)
      const asociados = await asociadoDAO.listarTodos();
      result = mapAsociadosToResponse(asociados);
      total = asociados.length;

      return NextResponse.json({
        success: true,
        data: result,
        total: total,
        message: `Se encontraron ${total} asociados (listado completo).`
      });

    } else {
      // 2. Obtener con paginación (usa obtenerTodos)
      
      // Leer page y limit de la query params, o usar valores por defecto
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      
      const paginatedResult: PaginacionResultado<Asociado> = await asociadoDAO.obtenerTodos(page, limit);
      
      result = mapAsociadosToResponse(paginatedResult.data);
      total = paginatedResult.total;

      return NextResponse.json({
        success: true,
        data: result,
        total: total,
        pagination: {
            page: paginatedResult.page,
            limit: paginatedResult.limit,
            totalPages: paginatedResult.totalPages
        }
      });
    }

  } catch (error: any) {
    console.error('Error al listar asociados:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener la lista de asociados';

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}