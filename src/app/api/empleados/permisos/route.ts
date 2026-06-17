import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/empleados/permisos
export async function GET() {
  try {
    const permisos = await prisma.permisoEmpleado.findMany({
      include: { empleado: { select: { nombre: true, cedula: true, puesto: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: permisos });
  } catch (error) {
    console.error('GET /api/empleados/permisos:', error);
    return NextResponse.json({ success: false, message: 'Error al obtener permisos.' }, { status: 500 });
  }
}

// POST /api/empleados/permisos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empleadoId, fechaInicio, fechaFin, justificacion, documentoUrl } = body;

    if (!empleadoId || !fechaInicio || !fechaFin || !justificacion) {
      return NextResponse.json({ success: false, message: 'Empleado, fechas y justificación son obligatorios.' }, { status: 400 });
    }

    const permiso = await prisma.permisoEmpleado.create({
      data: {
        empleadoId: Number(empleadoId),
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        justificacion,
        documentoUrl: documentoUrl || null,
        estado: 'PENDIENTE',
      },
      include: { empleado: { select: { nombre: true, cedula: true, puesto: true } } },
    });

    return NextResponse.json({ success: true, data: permiso, message: 'Permiso registrado exitosamente.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/empleados/permisos:', error);
    return NextResponse.json({ success: false, message: 'Error al registrar permiso.' }, { status: 500 });
  }
}
