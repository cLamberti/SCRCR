import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const reportes = await db.query('SELECT * FROM reportes_asistencia');
    const auditoria = await db.query('SELECT * FROM auditoria ORDER BY fecha DESC LIMIT 10');
    
    return NextResponse.json({ reportes: reportes.rows, auditoria: auditoria.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
