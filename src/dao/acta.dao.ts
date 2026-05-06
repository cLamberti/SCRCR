import { prisma } from '@/lib/prisma';
import type {
  ActaAsociacionDTO,
  ActaJDDTO,
  AsistenciaActaDTO,
  CrearActaAsociacionRequest,
  CrearActaJDRequest,
  ActualizarActaAsociacionRequest,
  ActualizarActaJDRequest,
  RegistrarAsistenciaRequest,
} from '@/dto/acta.dto';

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(d: Date | null | undefined): string {
  if (!d) return '';
  return d instanceof Date ? d.toISOString().split('T')[0] : String(d);
}

// ── Actas Asociación ─────────────────────────────────────────────────────────

export async function listarActasAsociacion(): Promise<ActaAsociacionDTO[]> {
  const rows = await prisma.actaAsociacion.findMany({
    orderBy: { fecha: 'desc' },
    include: {
      asistencias: { select: { estado: true } },
    },
  });

  return rows.map(r => ({
    id: r.id,
    fecha: toDateString(r.fecha),
    tipoSesion: r.tipoSesion as ActaAsociacionDTO['tipoSesion'],
    urlActa: r.urlActa ?? null,
    nombreArchivo: r.nombreArchivo ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    totalAsistentes: r.asistencias.filter(a => a.estado === 'presente').length,
    totalAusentes: r.asistencias.filter(a => a.estado === 'ausente').length,
  }));
}

export async function obtenerActaAsociacion(id: number): Promise<ActaAsociacionDTO | null> {
  const r = await prisma.actaAsociacion.findUnique({
    where: { id },
    include: { asistencias: { select: { estado: true } } },
  });
  if (!r) return null;
  return {
    id: r.id,
    fecha: toDateString(r.fecha),
    tipoSesion: r.tipoSesion as ActaAsociacionDTO['tipoSesion'],
    urlActa: r.urlActa ?? null,
    nombreArchivo: r.nombreArchivo ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    totalAsistentes: r.asistencias.filter(a => a.estado === 'presente').length,
    totalAusentes: r.asistencias.filter(a => a.estado === 'ausente').length,
  };
}

export async function crearActaAsociacion(data: CrearActaAsociacionRequest): Promise<ActaAsociacionDTO> {
  // 1. Create the acta
  const acta = await prisma.actaAsociacion.create({
    data: {
      fecha: new Date(data.fecha),
      tipoSesion: data.tipoSesion,
      urlActa: data.urlActa ?? null,
      nombreArchivo: data.nombreArchivo ?? null,
    },
  });

  // 2. Pre-populate attendance for every active asociado
  const asociados = await prisma.asociado.findMany({
    where: { estado: 1 },
    select: { id: true },
  });

  if (asociados.length > 0) {
    await prisma.asistenciaActaAsociacion.createMany({
      data: asociados.map(a => ({
        actaId: acta.id,
        asociadoId: a.id,
        estado: 'ausente' as const,
      })),
      skipDuplicates: true,
    });
  }

  return {
    id: acta.id,
    fecha: toDateString(acta.fecha),
    tipoSesion: acta.tipoSesion as ActaAsociacionDTO['tipoSesion'],
    urlActa: acta.urlActa ?? null,
    nombreArchivo: acta.nombreArchivo ?? null,
    createdAt: acta.createdAt.toISOString(),
    updatedAt: acta.updatedAt.toISOString(),
    totalAsistentes: 0,
    totalAusentes: asociados.length,
  };
}

export async function actualizarActaAsociacion(
  id: number,
  data: ActualizarActaAsociacionRequest,
): Promise<ActaAsociacionDTO | null> {
  const existing = await prisma.actaAsociacion.findUnique({ where: { id } });
  if (!existing) return null;

  const updated = await prisma.actaAsociacion.update({
    where: { id },
    data: {
      ...(data.fecha !== undefined && { fecha: new Date(data.fecha) }),
      ...(data.tipoSesion !== undefined && { tipoSesion: data.tipoSesion }),
      ...(data.urlActa !== undefined && { urlActa: data.urlActa }),
      ...(data.nombreArchivo !== undefined && { nombreArchivo: data.nombreArchivo }),
    },
    include: { asistencias: { select: { estado: true } } },
  });

  return {
    id: updated.id,
    fecha: toDateString(updated.fecha),
    tipoSesion: updated.tipoSesion as ActaAsociacionDTO['tipoSesion'],
    urlActa: updated.urlActa ?? null,
    nombreArchivo: updated.nombreArchivo ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    totalAsistentes: updated.asistencias.filter(a => a.estado === 'presente').length,
    totalAusentes: updated.asistencias.filter(a => a.estado === 'ausente').length,
  };
}

export async function eliminarActaAsociacion(id: number): Promise<boolean> {
  const existing = await prisma.actaAsociacion.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.actaAsociacion.delete({ where: { id } });
  return true;
}

// ── Asistencia Acta Asociación ────────────────────────────────────────────────

export async function obtenerAsistenciasAsociacion(actaId: number): Promise<AsistenciaActaDTO[]> {
  const rows = await prisma.asistenciaActaAsociacion.findMany({
    where: { actaId },
    include: { asociado: { select: { nombreCompleto: true } } },
    orderBy: { asociado: { nombreCompleto: 'asc' } },
  });

  return rows.map(r => ({
    id: r.id,
    actaId: r.actaId,
    asociadoId: r.asociadoId,
    nombreAsociado: r.asociado.nombreCompleto,
    estado: r.estado as AsistenciaActaDTO['estado'],
    justificacion: r.justificacion ?? null,
  }));
}

export async function registrarAsistenciaAsociacion(
  actaId: number,
  data: RegistrarAsistenciaRequest,
): Promise<AsistenciaActaDTO> {
  const row = await prisma.asistenciaActaAsociacion.upsert({
    where: { actaId_asociadoId: { actaId, asociadoId: data.asociadoId } },
    update: {
      estado: data.estado,
      justificacion: data.justificacion ?? null,
    },
    create: {
      actaId,
      asociadoId: data.asociadoId,
      estado: data.estado,
      justificacion: data.justificacion ?? null,
    },
    include: { asociado: { select: { nombreCompleto: true } } },
  });

  return {
    id: row.id,
    actaId: row.actaId,
    asociadoId: row.asociadoId,
    nombreAsociado: row.asociado.nombreCompleto,
    estado: row.estado as AsistenciaActaDTO['estado'],
    justificacion: row.justificacion ?? null,
  };
}

// ── Actas Junta Directiva ────────────────────────────────────────────────────

export async function listarActasJD(): Promise<ActaJDDTO[]> {
  const rows = await prisma.actaJuntaDirectiva.findMany({
    orderBy: { fecha: 'desc' },
    include: { asistencias: { select: { estado: true } } },
  });

  return rows.map(r => ({
    id: r.id,
    fecha: toDateString(r.fecha),
    tipoSesion: r.tipoSesion as ActaJDDTO['tipoSesion'],
    urlActa: r.urlActa ?? null,
    nombreArchivo: r.nombreArchivo ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    totalAsistentes: r.asistencias.filter(a => a.estado === 'presente').length,
    totalAusentes: r.asistencias.filter(a => a.estado === 'ausente').length,
  }));
}

export async function obtenerActaJD(id: number): Promise<ActaJDDTO | null> {
  const r = await prisma.actaJuntaDirectiva.findUnique({
    where: { id },
    include: { asistencias: { select: { estado: true } } },
  });
  if (!r) return null;
  return {
    id: r.id,
    fecha: toDateString(r.fecha),
    tipoSesion: r.tipoSesion as ActaJDDTO['tipoSesion'],
    urlActa: r.urlActa ?? null,
    nombreArchivo: r.nombreArchivo ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    totalAsistentes: r.asistencias.filter(a => a.estado === 'presente').length,
    totalAusentes: r.asistencias.filter(a => a.estado === 'ausente').length,
  };
}

export async function crearActaJD(data: CrearActaJDRequest): Promise<ActaJDDTO> {
  const acta = await prisma.actaJuntaDirectiva.create({
    data: {
      fecha: new Date(data.fecha),
      tipoSesion: data.tipoSesion,
      urlActa: data.urlActa ?? null,
      nombreArchivo: data.nombreArchivo ?? null,
    },
  });

  // Pre-populate with JD members
  const miembrosJD = await prisma.asociado.findMany({
    where: { perteneceJuntaDirectiva: true, estado: 1 },
    select: { id: true },
  });

  if (miembrosJD.length > 0) {
    await prisma.asistenciaActaJD.createMany({
      data: miembrosJD.map(a => ({
        actaId: acta.id,
        asociadoId: a.id,
        estado: 'ausente' as const,
      })),
      skipDuplicates: true,
    });
  }

  return {
    id: acta.id,
    fecha: toDateString(acta.fecha),
    tipoSesion: acta.tipoSesion as ActaJDDTO['tipoSesion'],
    urlActa: acta.urlActa ?? null,
    nombreArchivo: acta.nombreArchivo ?? null,
    createdAt: acta.createdAt.toISOString(),
    updatedAt: acta.updatedAt.toISOString(),
    totalAsistentes: 0,
    totalAusentes: miembrosJD.length,
  };
}

export async function actualizarActaJD(
  id: number,
  data: ActualizarActaJDRequest,
): Promise<ActaJDDTO | null> {
  const existing = await prisma.actaJuntaDirectiva.findUnique({ where: { id } });
  if (!existing) return null;

  const updated = await prisma.actaJuntaDirectiva.update({
    where: { id },
    data: {
      ...(data.fecha !== undefined && { fecha: new Date(data.fecha) }),
      ...(data.tipoSesion !== undefined && { tipoSesion: data.tipoSesion }),
      ...(data.urlActa !== undefined && { urlActa: data.urlActa }),
      ...(data.nombreArchivo !== undefined && { nombreArchivo: data.nombreArchivo }),
    },
    include: { asistencias: { select: { estado: true } } },
  });

  return {
    id: updated.id,
    fecha: toDateString(updated.fecha),
    tipoSesion: updated.tipoSesion as ActaJDDTO['tipoSesion'],
    urlActa: updated.urlActa ?? null,
    nombreArchivo: updated.nombreArchivo ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    totalAsistentes: updated.asistencias.filter(a => a.estado === 'presente').length,
    totalAusentes: updated.asistencias.filter(a => a.estado === 'ausente').length,
  };
}

export async function eliminarActaJD(id: number): Promise<boolean> {
  const existing = await prisma.actaJuntaDirectiva.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.actaJuntaDirectiva.delete({ where: { id } });
  return true;
}

// ── Asistencia Acta JD ────────────────────────────────────────────────────────

export async function obtenerAsistenciasJD(actaId: number): Promise<AsistenciaActaDTO[]> {
  const rows = await prisma.asistenciaActaJD.findMany({
    where: { actaId },
    include: { asociado: { select: { nombreCompleto: true } } },
    orderBy: { asociado: { nombreCompleto: 'asc' } },
  });

  return rows.map(r => ({
    id: r.id,
    actaId: r.actaId,
    asociadoId: r.asociadoId,
    nombreAsociado: r.asociado.nombreCompleto,
    estado: r.estado as AsistenciaActaDTO['estado'],
    justificacion: r.justificacion ?? null,
  }));
}

export async function registrarAsistenciaJD(
  actaId: number,
  data: RegistrarAsistenciaRequest,
): Promise<AsistenciaActaDTO> {
  const row = await prisma.asistenciaActaJD.upsert({
    where: { actaId_asociadoId: { actaId, asociadoId: data.asociadoId } },
    update: {
      estado: data.estado,
      justificacion: data.justificacion ?? null,
    },
    create: {
      actaId,
      asociadoId: data.asociadoId,
      estado: data.estado,
      justificacion: data.justificacion ?? null,
    },
    include: { asociado: { select: { nombreCompleto: true } } },
  });

  return {
    id: row.id,
    actaId: row.actaId,
    asociadoId: row.asociadoId,
    nombreAsociado: row.asociado.nombreCompleto,
    estado: row.estado as AsistenciaActaDTO['estado'],
    justificacion: row.justificacion ?? null,
  };
}
