import { NextResponse } from 'next/server';
import { HistorialDAO } from '@/dao/historial.dao';

const historialDAO = new HistorialDAO();

export async function GET() {
  try {
    const hits = await historialDAO.obtenerHitosGlobales();
    return NextResponse.json({ historial: hits }, { status: 200 });
  } catch (error: any) {
    console.error('Error GET /api/historial/sistema:', error);
    return NextResponse.json({ error: 'Error al obtener hitos del sistema' }, { status: 500 });
  }
}
