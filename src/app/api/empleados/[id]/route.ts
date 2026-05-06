import { NextRequest, NextResponse } from 'next/server';
import { EmpleadoDAO } from '@/dao/empleado.dao';
import { EmpleadoValidator } from '@/validators/empleado.validator';

const dao = new EmpleadoDAO();

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await dao.obtenerPorId(Number(id));
    if (!data) return NextResponse.json({ success: false, message: 'Empleado no encontrado.' }, { status: 404 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al obtener el empleado.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { valid, errors } = EmpleadoValidator.validarActualizar(body);
    if (!valid) return NextResponse.json({ success: false, message: errors[0], errors }, { status: 400 });

    const data = await dao.actualizar(Number(id), body);
    return NextResponse.json({ success: true, data, message: 'Empleado actualizado exitosamente.' });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Ya existe un empleado con esa cédula.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Error al actualizar el empleado.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dao.eliminar(Number(id));
    return NextResponse.json({ success: true, message: 'Empleado desactivado exitosamente.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al eliminar el empleado.' }, { status: 500 });
  }
}
