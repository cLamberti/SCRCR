import { NextRequest, NextResponse } from 'next/server';
import { EmpleadoDAO } from '@/dao/empleado.dao';
import { EmpleadoValidator } from '@/validators/empleado.validator';
import { CrearEmpleadoRequest } from '@/dto/empleado.dto';

const dao = new EmpleadoDAO();

export async function GET() {
  try {
    const data = await dao.obtenerTodos();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/empleados:', error);
    return NextResponse.json({ success: false, message: 'Error al obtener empleados' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CrearEmpleadoRequest = await request.json();
    const { valid, errors } = EmpleadoValidator.validarCrear(body);
    if (!valid) return NextResponse.json({ success: false, message: errors[0], errors }, { status: 400 });

    const data = await dao.crear(body);
    return NextResponse.json({ success: true, data, message: 'Empleado creado exitosamente.' }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Ya existe un empleado con esa cédula.' }, { status: 409 });
    }
    console.error('POST /api/empleados:', error);
    return NextResponse.json({ success: false, message: 'Error al crear el empleado.' }, { status: 500 });
  }
}
