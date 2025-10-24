import { NextRequest, NextResponse } from 'next/server';
import { AsociadoDAO } from '@/dao/asociado.dao';
import { AsociadoResponse } from '@/dto/asociado.dto';
import { PaginacionResultado } from '@/dao/asociado.dao';

const asociadoDAO = new AsociadoDAO();

/**
 * Mapea una lista de objetos Asociado del modelo a la estructura de respuesta DTO
 */
const mapAsociadosToResponse = (asociados: any[]): AsociadoResponse[] => {
  return asociados.map(asociado => ({
    id: asociado.id,
    nombreCompleto: asociado.nombreCompleto,
    cedula: asociado.cedula,
    correo: asociado.correo,
    telefono: asociado.telefono,
    ministerio: asociado.ministerio,
    direccion: asociado.direccion,
    // Asegurarse de que la fecha sea un string ISO para el DTO
    fechaIngreso: asociado.fechaIngreso instanceof Date 
        ? asociado.fechaIngreso.toISOString() 
        : asociado.fechaIngreso,
    estado: asociado.estado
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
      
      const paginatedResult: PaginacionResultado<any> = await asociadoDAO.obtenerTodos(page, limit);
      
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
    
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error al obtener la lista de asociados',
      },
      { status: 500 }
    );
  }
}

// Nota: Podrías añadir aquí más handlers si esta ruta debe manejar otros métodos 
// (e.g., PUT para actualización masiva, aunque es menos común).