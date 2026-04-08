import { NextRequest, NextResponse } from 'next/server';
import { CongregadoService } from '@/services/congregado.service';
import { CongregadoServiceError } from '@/services/congregado.service';
import { CrearCongregadoRequest } from '@/dto/congregado.dto';

const congregadoService = new CongregadoService();

// GET /api/congregados?all=true | ?page=1&limit=10&nombre=...
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get('all');

    if (all === 'true') {
      const result = await congregadoService.obtenerTodos();
      return NextResponse.json(result, { status: 200 });
    }

    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    
    const page  = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    
    if (isNaN(page) || isNaN(limit)) {
      return NextResponse.json({ success: false, message: 'Parámetros de paginación inválidos' }, { status: 400 });
    }

    const nombre     = searchParams.get('nombre')     || undefined;
    const cedula     = searchParams.get('cedula')     || undefined;
    const ministerio = searchParams.get('ministerio') || undefined;
    const estadoParam = searchParams.get('estado');
    
    let estado: 0 | 1 | undefined = undefined;
    if (estadoParam !== null && estadoParam !== 'todos' && estadoParam !== '') {
      const e = Number(estadoParam);
      if (!isNaN(e)) {
        estado = e as 0 | 1;
      }
    }

    const result = await congregadoService.listar({ page, limit, nombre, cedula, ministerio, estado });
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('CRITICAL: Error en GET /api/congregados:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Error al obtener congregados',
        debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: error instanceof CongregadoServiceError ? (error.statusCode || 500) : 500 }
    );
  }
}

// POST /api/congregados
export async function POST(request: NextRequest) {
  try {
    const body: CrearCongregadoRequest = await request.json();
    const nuevo = await congregadoService.crear(body);
    return NextResponse.json({ success: true, data: nuevo, message: 'Congregado registrado exitosamente.' }, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/congregados:', error);
    const status = error instanceof CongregadoServiceError ? (error.statusCode || 500) : 500;
    return NextResponse.json(
      { success: false, message: error.message || 'Error al crear congregado', errors: error.errors },
      { status }
    );
  }
}