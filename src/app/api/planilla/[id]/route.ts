import { NextRequest, NextResponse } from 'next/server';
import { PlanillaDAO, EmpleadoDAO } from '@/dao/empleado.dao';
import { EmpleadoValidator } from '@/validators/empleado.validator';
import { CrearPlanillaRequest } from '@/dto/empleado.dto';

const dao = new PlanillaDAO();
const empleadoDao = new EmpleadoDAO();

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await dao.obtenerPorId(Number(id));
    if (!data) return NextResponse.json({ success: false, message: 'Planilla no encontrada.' }, { status: 404 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al obtener la planilla.' }, { status: 500 });
  }
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dao.cerrarPeriodo(Number(id));
    return NextResponse.json({ success: true, message: 'Planilla cerrada exitosamente.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al cerrar la planilla.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const planillaId = Number(id);

    // Verify it exists and is not closed
    const currentPlanilla = await dao.obtenerPorId(planillaId);
    if (!currentPlanilla) {
      return NextResponse.json({ success: false, message: 'Planilla no encontrada.' }, { status: 404 });
    }
    if (currentPlanilla.estado !== 'borrador') {
      return NextResponse.json({ success: false, message: 'La planilla ya fue cerrada y no puede ser editada.' }, { status: 400 });
    }

    const body: CrearPlanillaRequest = await req.json();
    const result = EmpleadoValidator.validarCrearPlanilla(body);
    if (!result.valid) {
      return NextResponse.json({ success: false, message: 'Datos de entrada inválidos.', errors: result.errors }, { status: 400 });
    }

    const empleados = await empleadoDao.obtenerActivos();
    const data = await dao.actualizarPeriodo(planillaId, body, empleados);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Error al actualizar la planilla.' }, { status: 500 });
  }
}
