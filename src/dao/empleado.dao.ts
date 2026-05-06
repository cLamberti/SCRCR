import { prisma } from '@/lib/prisma';
import { CrearEmpleadoRequest, ActualizarEmpleadoRequest, CrearPlanillaRequest, PlanillaResponse, LineaPlanillaResponse, EmpleadoResponse } from '@/dto/empleado.dto';

export class EmpleadoDAO {
  async crear(data: CrearEmpleadoRequest): Promise<EmpleadoResponse> {
    const row = await prisma.empleado.create({
      data: {
        nombre: data.nombre.trim(),
        cedula: data.cedula.trim(),
        puesto: data.puesto.trim(),
        salarioBase: data.salarioBase,
        cuentaBancaria: data.cuentaBancaria?.trim() ?? null,
      },
    });
    return this.mapEmpleado(row);
  }

  async obtenerTodos(): Promise<EmpleadoResponse[]> {
    const rows = await prisma.empleado.findMany({ orderBy: { nombre: 'asc' } });
    return rows.map(this.mapEmpleado);
  }

  async obtenerActivos(): Promise<EmpleadoResponse[]> {
    const rows = await prisma.empleado.findMany({ where: { estado: 1 }, orderBy: { nombre: 'asc' } });
    return rows.map(this.mapEmpleado);
  }

  async obtenerPorId(id: number): Promise<EmpleadoResponse | null> {
    const row = await prisma.empleado.findUnique({ where: { id } });
    return row ? this.mapEmpleado(row) : null;
  }

  async actualizar(id: number, data: ActualizarEmpleadoRequest): Promise<EmpleadoResponse> {
    const row = await prisma.empleado.update({
      where: { id },
      data: {
        ...(data.nombre && { nombre: data.nombre.trim() }),
        ...(data.cedula && { cedula: data.cedula.trim() }),
        ...(data.puesto && { puesto: data.puesto.trim() }),
        ...(data.salarioBase !== undefined && { salarioBase: data.salarioBase }),
        ...(data.cuentaBancaria !== undefined && { cuentaBancaria: data.cuentaBancaria?.trim() ?? null }),
        ...(data.estado !== undefined && { estado: data.estado }),
      },
    });
    return this.mapEmpleado(row);
  }

  async eliminar(id: number): Promise<void> {
    await prisma.empleado.update({ where: { id }, data: { estado: 0 } });
  }

  private mapEmpleado(row: any): EmpleadoResponse {
    return {
      id: row.id,
      nombre: row.nombre,
      cedula: row.cedula,
      puesto: row.puesto,
      salarioBase: Number(row.salarioBase),
      cuentaBancaria: row.cuentaBancaria ?? undefined,
      estado: row.estado,
    };
  }
}

export class PlanillaDAO {
  async crearPeriodo(data: CrearPlanillaRequest, empleados: EmpleadoResponse[]): Promise<PlanillaResponse> {
    const periodo = await prisma.periodoPlanilla.create({
      data: {
        mes: data.mes,
        anio: data.anio,
        estado: 'borrador',
        lineas: {
          create: data.lineas.map(l => {
            const empleado = empleados.find(e => e.id === l.empleadoId)!;
            const salarioDiario = empleado.salarioBase / 30;
            const diasAusentes = l.diasAusentes || 0;
            const diasVacaciones = l.diasVacaciones || 0;
            const diasIncapacidad = l.diasIncapacidad || 0;
            const diasTrabajados = 30 - diasAusentes - diasVacaciones - diasIncapacidad;
            const montoAPagar = Math.max(0, empleado.salarioBase - diasAusentes * salarioDiario);
            return {
              empleadoId: l.empleadoId,
              diasTrabajados,
              diasAusentes,
              diasVacaciones,
              diasIncapacidad,
              montoAPagar: parseFloat(montoAPagar.toFixed(2)),
            };
          }),
        },
      },
      include: { lineas: { include: { empleado: true } } },
    });
    return this.mapPeriodo(periodo);
  }

  async obtenerTodos(): Promise<Omit<PlanillaResponse, 'lineas'>[]> {
    const rows = await prisma.periodoPlanilla.findMany({ orderBy: [{ anio: 'desc' }, { mes: 'desc' }] });
    return rows.map(r => ({
      id: r.id,
      mes: r.mes,
      anio: r.anio,
      estado: r.estado,
      fechaGeneracion: r.fechaGeneracion.toISOString(),
      totalAPagar: 0,
    }));
  }

  async obtenerPorId(id: number): Promise<PlanillaResponse | null> {
    const row = await prisma.periodoPlanilla.findUnique({
      where: { id },
      include: { lineas: { include: { empleado: true } } },
    });
    return row ? this.mapPeriodo(row) : null;
  }

  async cerrarPeriodo(id: number): Promise<void> {
    await prisma.periodoPlanilla.update({ where: { id }, data: { estado: 'cerrado' } });
  }

  private mapPeriodo(row: any): PlanillaResponse {
    const lineas: LineaPlanillaResponse[] = row.lineas.map((l: any) => ({
      id: l.id,
      empleadoId: l.empleadoId,
      empleadoNombre: l.empleado.nombre,
      empleadoCedula: l.empleado.cedula,
      empleadoPuesto: l.empleado.puesto,
      empleadoCuentaBancaria: l.empleado.cuentaBancaria ?? undefined,
      salarioBase: Number(l.empleado.salarioBase),
      diasTrabajados: l.diasTrabajados,
      diasAusentes: l.diasAusentes,
      diasVacaciones: l.diasVacaciones,
      diasIncapacidad: l.diasIncapacidad,
      montoAPagar: Number(l.montoAPagar),
    }));
    return {
      id: row.id,
      mes: row.mes,
      anio: row.anio,
      estado: row.estado,
      fechaGeneracion: row.fechaGeneracion.toISOString(),
      lineas,
      totalAPagar: lineas.reduce((sum, l) => sum + l.montoAPagar, 0),
    };
  }
}
