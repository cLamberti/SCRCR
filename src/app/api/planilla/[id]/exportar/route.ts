import { NextRequest, NextResponse } from 'next/server';
import { PlanillaDAO } from '@/dao/empleado.dao';
import * as XLSX from 'xlsx';

const dao = new PlanillaDAO();

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const planilla = await dao.obtenerPorId(Number(id));
    if (!planilla) return NextResponse.json({ success: false, message: 'Planilla no encontrada.' }, { status: 404 });

    const wb = XLSX.utils.book_new();

    // Hoja principal
    const titulo = `Planilla ${MESES[planilla.mes - 1]} ${planilla.anio}`;
    const filas = [
      [titulo],
      [`Estado: ${planilla.estado === 'cerrado' ? 'Cerrada' : 'Borrador'}`, '', `Generada: ${new Date(planilla.fechaGeneracion).toLocaleDateString('es-CR')}`],
      [],
      ['#', 'Nombre', 'Cédula', 'Puesto', 'Cuenta Bancaria', 'Salario Base', 'Días Trabajados', 'Días Ausentes', 'Días Vacaciones', 'Días Incapacidad', 'Monto a Pagar'],
      ...planilla.lineas.map((l, i) => [
        i + 1,
        l.empleadoNombre,
        l.empleadoCedula,
        l.empleadoPuesto,
        l.empleadoCuentaBancaria || '-',
        l.salarioBase,
        l.diasTrabajados,
        l.diasAusentes,
        l.diasVacaciones,
        l.diasIncapacidad,
        l.montoAPagar,
      ]),
      [],
      ['', '', '', '', '', '', '', '', '', 'TOTAL', planilla.totalAPagar],
    ];

    const ws = XLSX.utils.aoa_to_sheet(filas);

    // Anchos de columna
    ws['!cols'] = [
      { wch: 4 }, { wch: 30 }, { wch: 14 }, { wch: 20 },
      { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 16 }, { wch: 16 }, { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Planilla');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `planilla_${MESES[planilla.mes - 1].toLowerCase()}_${planilla.anio}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('GET /api/planilla/[id]/exportar:', error);
    return NextResponse.json({ success: false, message: 'Error al exportar la planilla.' }, { status: 500 });
  }
}
