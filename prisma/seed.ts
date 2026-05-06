import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const adapter = new PrismaNeon({ connectionString: process.env.POSTGRES_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── Usuarios ──────────────────────────────────────────────────────────────
  const hash = (p: string) => bcrypt.hash(p, 10);

  const [adminUser, tesoreroUser, pastorUser] = await Promise.all([
    prisma.usuario.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@iglesiaemanuel.cr',
        passwordHash: await hash('Admin123'),
        nombreCompleto: 'Administrador Sistema',
        rol: 'admin',
        estado: 1,
      },
    }),
    prisma.usuario.upsert({
      where: { username: 'tesorero' },
      update: {},
      create: {
        username: 'tesorero',
        email: 'tesorero@iglesiaemanuel.cr',
        passwordHash: await hash('Tesorero123'),
        nombreCompleto: 'María Fernanda Rodríguez Solís',
        rol: 'tesorero',
        estado: 1,
      },
    }),
    prisma.usuario.upsert({
      where: { username: 'pastor' },
      update: {},
      create: {
        username: 'pastor',
        email: 'pastor@iglesiaemanuel.cr',
        passwordHash: await hash('Pastor123'),
        nombreCompleto: 'Pastor José Manuel Vargas',
        rol: 'pastorGeneral',
        estado: 1,
      },
    }),
  ]);
  console.log('✅ Usuarios creados');

  // ── Permisos ─────────────────────────────────────────────────────────────
  await prisma.permiso.createMany({
    skipDuplicates: true,
    data: [
      {
        usuarioId: tesoreroUser.id,
        fechaInicio: new Date('2026-05-10'),
        fechaFin: new Date('2026-05-12'),
        motivo: 'Consulta médica y recuperación',
        estado: 'APROBADO',
        observacionesResolucion: 'Aprobado por el pastor general.',
      },
      {
        usuarioId: pastorUser.id,
        fechaInicio: new Date('2026-06-01'),
        fechaFin: new Date('2026-06-07'),
        motivo: 'Retiro espiritual nacional',
        estado: 'PENDIENTE',
      },
      {
        usuarioId: adminUser.id,
        fechaInicio: new Date('2026-07-14'),
        fechaFin: new Date('2026-07-18'),
        motivo: 'Vacaciones anuales',
        estado: 'PENDIENTE',
      },
    ],
  });
  console.log('✅ Permisos creados');

  // ── Congregados ───────────────────────────────────────────────────────────
  const congregados = [
    { nombre: 'Ana Lucía Pérez Mora', cedula: '1-1234-5678', fechaIngreso: new Date('2018-03-15'), telefono: '8811-2233', estadoCivil: 'Casado(a)', ministerio: 'Alabanza', urlFotoCedula: 'https://placehold.co/200x120?text=Cedula', fechaNacimiento: new Date('1985-06-20'), correo: 'ana.perez@gmail.com', profesion: 'Maestra', direccion: 'Barrio Ángeles, Liberia' },
    { nombre: 'Carlos Alberto Jiménez Bravo', cedula: '2-2345-6789', fechaIngreso: new Date('2019-07-01'), telefono: '8822-3344', estadoCivil: 'Soltero(a)', ministerio: 'Jóvenes', urlFotoCedula: 'https://placehold.co/200x120?text=Cedula', fechaNacimiento: new Date('1998-11-05'), correo: 'carlos.jimenez@hotmail.com', profesion: 'Estudiante', direccion: 'Residencial Los Pinos, Cañas' },
    { nombre: 'Laura Patricia González Vega', cedula: '3-3456-7890', fechaIngreso: new Date('2020-01-20'), telefono: '8833-4455', estadoCivil: 'Casado(a)', ministerio: 'Niños', urlFotoCedula: 'https://placehold.co/200x120?text=Cedula', fechaNacimiento: new Date('1990-02-14'), correo: 'laura.gonzalez@yahoo.com', profesion: 'Enfermera', direccion: 'Urbanización Palmares, Santa Cruz' },
    { nombre: 'Roberto Emilio Sánchez Fuentes', cedula: '4-4567-8901', fechaIngreso: new Date('2021-05-10'), telefono: '8844-5566', estadoCivil: 'Divorciado(a)', ministerio: 'Evangelismo', urlFotoCedula: 'https://placehold.co/200x120?text=Cedula', fechaNacimiento: new Date('1975-08-30'), profesion: 'Mecánico', direccion: 'Guanacaste, Nicoya Centro' },
    { nombre: 'Sofía Isabel Araya Castillo', cedula: '5-5678-9012', fechaIngreso: new Date('2022-09-03'), telefono: '8855-6677', estadoCivil: 'Soltero(a)', ministerio: 'Damas', urlFotoCedula: 'https://placehold.co/200x120?text=Cedula', fechaNacimiento: new Date('2001-04-18'), correo: 'sofia.araya@gmail.com', profesion: 'Secretaria', direccion: 'Barrio Las Flores, Bagaces' },
  ];

  for (const c of congregados) {
    await prisma.congregado.upsert({
      where: { cedula: c.cedula },
      update: {},
      create: c,
    });
  }
  console.log('✅ Congregados creados');

  // ── Asociados ─────────────────────────────────────────────────────────────
  const asociados = [
    { nombreCompleto: 'Jorge Luis Campos Herrera', cedula: '1-0987-6543', correo: 'jorge.campos@iglesia.cr', telefono: '8900-1122', telefonoContacto: '2222-3333', ministerio: 'Finanzas', direccion: 'San José, Desamparados', fechaIngreso: new Date('2015-04-01'), fechaNacimiento: new Date('1972-09-12'), estadoCivil: 'Casado(a)', profesion: 'Contador', anosCongregarse: 11, fechaAceptacion: new Date('2015-03-15'), perteneceJuntaDirectiva: true, puestoJuntaDirectiva: 'Tesorero' },
    { nombreCompleto: 'Mariela Concepción Torres Ulate', cedula: '2-0876-5432', correo: 'mariela.torres@gmail.com', telefono: '8911-2233', ministerio: 'Alabanza', direccion: 'Alajuela, San Ramón', fechaIngreso: new Date('2016-08-20'), fechaNacimiento: new Date('1980-01-25'), estadoCivil: 'Casado(a)', profesion: 'Música', anosCongregarse: 9, fechaAceptacion: new Date('2016-08-01'), perteneceJuntaDirectiva: true, puestoJuntaDirectiva: 'Secretario' },
    { nombreCompleto: 'Andrés Mauricio Blanco Quesada', cedula: '3-0765-4321', telefono: '8922-3344', ministerio: 'Jóvenes', direccion: 'Cartago, Paraíso', fechaIngreso: new Date('2018-11-15'), fechaNacimiento: new Date('1995-06-08'), estadoCivil: 'Soltero(a)', profesion: 'Ingeniero', anosCongregarse: 7, perteneceJuntaDirectiva: false },
    { nombreCompleto: 'Carmen Lucía Mora Vindas', cedula: '4-0654-3210', correo: 'carmen.mora@hotmail.com', telefono: '8933-4455', telefonoContacto: '2666-7777', ministerio: 'Intercesión', direccion: 'Heredia, Belén', fechaIngreso: new Date('2017-02-10'), fechaNacimiento: new Date('1968-12-03'), estadoCivil: 'Viudo(a)', profesion: 'Ama de casa', anosCongregarse: 12, fechaAceptacion: new Date('2017-01-20'), perteneceJuntaDirectiva: true, puestoJuntaDirectiva: 'Vocal' },
    { nombreCompleto: 'Diego Alonso Varela Monge', cedula: '5-0543-2109', telefono: '8944-5566', ministerio: 'Evangelismo', direccion: 'Puntarenas, Esparza', fechaIngreso: new Date('2020-06-05'), fechaNacimiento: new Date('1988-03-17'), estadoCivil: 'Casado(a)', profesion: 'Vendedor', anosCongregarse: 5, perteneceJuntaDirectiva: false },
  ];

  const asociadosCreados = [];
  for (const a of asociados) {
    const row = await prisma.asociado.upsert({
      where: { cedula: a.cedula },
      update: {},
      create: a,
    });
    asociadosCreados.push(row);
  }
  console.log('✅ Asociados creados');

  // ── Eventos ───────────────────────────────────────────────────────────────
  const eventos = [
    { nombre: 'Culto Dominical', descripcion: 'Culto general de adoración dominical', fecha: new Date('2026-04-06'), hora: new Date('1970-01-01T10:00:00'), activo: true },
    { nombre: 'Reunión de Jóvenes', descripcion: 'Reunión semanal del ministerio de jóvenes', fecha: new Date('2026-04-11'), hora: new Date('1970-01-01T18:00:00'), activo: true },
    { nombre: 'Asamblea General', descripcion: 'Asamblea ordinaria de asociados', fecha: new Date('2026-04-20'), hora: new Date('1970-01-01T14:00:00'), activo: true },
    { nombre: 'Culto Dominical', descripcion: 'Culto general de adoración dominical', fecha: new Date('2026-04-27'), hora: new Date('1970-01-01T10:00:00'), activo: true },
    { nombre: 'Noche de Alabanza', descripcion: 'Servicio especial de adoración y alabanza', fecha: new Date('2026-05-03'), hora: new Date('1970-01-01T19:00:00'), activo: false },
  ];

  const eventosCreados = [];
  for (const e of eventos) {
    const row = await prisma.evento.create({ data: e });
    eventosCreados.push(row);
  }
  console.log('✅ Eventos creados');

  // ── Asistencias ───────────────────────────────────────────────────────────
  const estadosAsistencia: ('presente' | 'ausente' | 'justificado')[] = ['presente', 'presente', 'ausente', 'presente', 'justificado'];
  for (const evento of eventosCreados) {
    for (let i = 0; i < asociadosCreados.length; i++) {
      await prisma.asistencia.upsert({
        where: { asociadoId_eventoId: { asociadoId: asociadosCreados[i].id, eventoId: evento.id } },
        update: {},
        create: {
          asociadoId: asociadosCreados[i].id,
          eventoId: evento.id,
          estado: estadosAsistencia[i % estadosAsistencia.length],
          fechaRegistro: evento.fecha,
          horaRegistro: evento.hora,
          observaciones: estadosAsistencia[i % estadosAsistencia.length] === 'justificado' ? 'Incapacidad médica presentada.' : null,
        },
      });
    }
  }
  console.log('✅ Asistencias creadas');

  // ── Empleados ─────────────────────────────────────────────────────────────
  const empleados = [
    { nombre: 'Francisco Javier Méndez Rojas', cedula: '6-0432-1098', puesto: 'Guarda de Seguridad', salarioBase: 450000, cuentaBancaria: 'CR21 0152 0200 1026 2840 66' },
    { nombre: 'Karina Vanessa Solano Arias', cedula: '7-0321-0987', puesto: 'Secretaria Administrativa', salarioBase: 520000, cuentaBancaria: 'CR05 0152 0200 1026 2840 77' },
    { nombre: 'Esteban Rodrigo Núñez Castro', cedula: '8-0210-9876', puesto: 'Conserje', salarioBase: 380000, cuentaBancaria: 'CR98 0152 0200 1026 2840 88' },
  ];

  const empleadosCreados: { id: number; salarioBase: any; [key: string]: any }[] = [];
  for (const e of empleados) {
    const row = await prisma.empleado.upsert({
      where: { cedula: e.cedula },
      update: {},
      create: e,
    });
    empleadosCreados.push(row);
  }
  console.log('✅ Empleados creados');

  // ── Planilla Abril 2026 ───────────────────────────────────────────────────
  const lineasPlanilla = [
    { empleadoId: empleadosCreados[0].id, diasAusentes: 2, diasVacaciones: 0, diasIncapacidad: 0 },
    { empleadoId: empleadosCreados[1].id, diasAusentes: 0, diasVacaciones: 3, diasIncapacidad: 0 },
    { empleadoId: empleadosCreados[2].id, diasAusentes: 0, diasVacaciones: 0, diasIncapacidad: 4 },
  ];

  const existePlanilla = await prisma.periodoPlanilla.findUnique({ where: { mes_anio: { mes: 4, anio: 2026 } } });
  if (!existePlanilla) {
    await prisma.periodoPlanilla.create({
      data: {
        mes: 4,
        anio: 2026,
        estado: 'cerrado',
        lineas: {
          create: lineasPlanilla.map(l => {
            const emp = empleadosCreados.find(e => e.id === l.empleadoId)!;
            const salarioBase = Number(emp.salarioBase);
            const salarioDiario = salarioBase / 30;
            const diasTrabajados = 30 - l.diasAusentes - l.diasVacaciones - l.diasIncapacidad;
            const montoAPagar = Math.max(0, salarioBase - l.diasAusentes * salarioDiario);
            return { ...l, diasTrabajados, montoAPagar: parseFloat(montoAPagar.toFixed(2)) };
          }),
        },
      },
    });

    // Planilla Mayo (borrador)
    await prisma.periodoPlanilla.create({
      data: {
        mes: 5,
        anio: 2026,
        estado: 'borrador',
        lineas: {
          create: lineasPlanilla.map(l => {
            const emp = empleadosCreados.find(e => e.id === l.empleadoId)!;
            const salarioBase = Number(emp.salarioBase);
            const diasAusentes = 0;
            const montoAPagar = salarioBase;
            return { empleadoId: l.empleadoId, diasAusentes, diasVacaciones: 0, diasIncapacidad: 0, diasTrabajados: 30, montoAPagar };
          }),
        },
      },
    });
  }
  console.log('✅ Planillas creadas');

  console.log('\n🎉 Seed completado exitosamente.');
  console.log('   👤 admin / Admin123');
  console.log('   👤 tesorero / Tesorero123');
  console.log('   👤 pastor / Pastor123');
}

main()
  .catch(e => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
