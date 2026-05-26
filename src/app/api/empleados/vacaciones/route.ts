import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/empleados/vacaciones
export async function GET() {
  try {
    const vacaciones = await prisma.vacacionEmpleado.findMany({
      include: { empleado: { select: { nombre: true, cedula: true, puesto: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: vacaciones });
  } catch (error) {
    console.error('GET /api/empleados/vacaciones:', error);
    return NextResponse.json({ success: false, message: 'Error al obtener vacaciones.' }, { status: 500 });
  }
}

// POST /api/empleados/vacaciones
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empleadoId, fechaInicio, fechaFin, cantidadDias, documentoUrl, observaciones } = body;

    if (!empleadoId || !fechaInicio || !fechaFin || !cantidadDias) {
      return NextResponse.json({ success: false, message: 'Empleado, fechas y cantidad de días son obligatorios.' }, { status: 400 });
    }

    const vacacion = await prisma.vacacionEmpleado.create({
      data: {
        empleadoId: Number(empleadoId),
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        cantidadDias: Number(cantidadDias),
        documentoUrl: documentoUrl || null,
        observaciones: observaciones || null,
        estado: 'APROBADO',
      },
      include: { empleado: { select: { nombre: true, cedula: true, puesto: true } } },
    });

    return NextResponse.json({ success: true, data: vacacion, message: 'Vacación registrada exitosamente.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/empleados/vacaciones:', error);
    return NextResponse.json({ success: false, message: 'Error al registrar vacación.' }, { status: 500 });
  }
}
