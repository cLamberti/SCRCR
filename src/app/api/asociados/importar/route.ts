import { NextRequest, NextResponse } from 'next/server';
import { AsociadoService, AsociadoServiceError } from '@/services/asociado.service';
import { CrearAsociadoRequest } from '@/dto/asociado.dto';

const service = new AsociadoService();

export async function POST(request: NextRequest) {
  try {
    const rows: CrearAsociadoRequest[] = await request.json();
    if (!Array.isArray(rows)) {
      return NextResponse.json({ success: false, message: 'Se esperaba un arreglo de filas.' }, { status: 400 });
    }

    let importados = 0;
    let omitidos = 0;
    const errores: { fila: number; cedula: string; motivo: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        await service.crear(row);
        importados++;
      } catch (err: any) {
        if (err instanceof AsociadoServiceError && err.statusCode === 409) {
          omitidos++;
        } else {
          errores.push({ fila: i + 2, cedula: row.cedula ?? '', motivo: err.message ?? 'Error desconocido' });
        }
      }
    }

    return NextResponse.json({ success: true, importados, omitidos, errores });
  } catch {
    return NextResponse.json({ success: false, message: 'Error al procesar la importación.' }, { status: 500 });
  }
}
