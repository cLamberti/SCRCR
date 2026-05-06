import { NextRequest, NextResponse } from 'next/server';
import { HistorialService } from '@/services/historial.service';
import { ConsultaHistorialRequest, TipoRegistroHistorial } from '@/dto/historial.dto';
import { validateConsultaHistorialInput } from '@/validators/historial.validator';

const historialService = new HistorialService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const personaIdParam = searchParams.get('personaId');
    const tipoPersonaParam = searchParams.get('tipoPersona');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const tipoRegistro = searchParams.get('tipoRegistro') as TipoRegistroHistorial | 'todos' | null;

    const validation = validateConsultaHistorialInput({
      personaId: personaIdParam,
      tipoPersona: tipoPersonaParam,
      fechaDesde,
      fechaHasta,
      tipoRegistro
    });

    if (!validation.ok) {
      return NextResponse.json(
        { error: 'Errores de validación', issues: validation.issues },
        { status: 400 }
      );
    }

    const personaId = parseInt(personaIdParam as string, 10);

    const request: ConsultaHistorialRequest = {
      personaId,
      tipoPersona: tipoPersonaParam as 'usuario' | 'asociado' | 'congregado',
      filtros: {
        ...(fechaDesde && { fechaDesde }),
        ...(fechaHasta && { fechaHasta }),
        ...(tipoRegistro && { tipoRegistro }),
      }
    };

    const response = await historialService.obtenerHistorial(request);

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Error GET /api/historial:', error);
    if (error.message.includes('Persona no encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener historial' },
      { status: 500 }
    );
  }
}
