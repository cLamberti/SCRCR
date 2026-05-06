import { NextRequest, NextResponse } from 'next/server';
import { PlanillaDAO, EmpleadoDAO } from '@/dao/empleado.dao';
import { EmpleadoValidator } from '@/validators/empleado.validator';
import { CrearPlanillaRequest } from '@/dto/empleado.dto';

const planillaDAO = new PlanillaDAO();
const empleadoDAO = new EmpleadoDAO();

export async function GET() {
  try {
    const data = await planillaDAO.obtenerTodos();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al obtener planillas.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CrearPlanillaRequest = await request.json();
    const { valid, errors } = EmpleadoValidator.validarCrearPlanilla(body);
    if (!valid) return NextResponse.json({ success: false, message: errors[0], errors }, { status: 400 });

    const empleados = await empleadoDAO.obtenerActivos();
    const idsValidos = new Set(empleados.map(e => e.id));
    const invalidos = body.lineas.filter(l => !idsValidos.has(l.empleadoId));
    if (invalidos.length > 0) {
      return NextResponse.json({ success: false, message: 'Uno o más empleados no existen o están inactivos.' }, { status: 400 });
    }

    const data = await planillaDAO.crearPeriodo(body, empleados);
    return NextResponse.json({ success: true, data, message: 'Planilla generada exitosamente.' }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Ya existe una planilla para ese mes y año.' }, { status: 409 });
    }
    console.error('POST /api/planilla:', error);
    return NextResponse.json({ success: false, message: 'Error al generar la planilla.' }, { status: 500 });
  }
}
