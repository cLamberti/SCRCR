import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { MODULOS, PERMISOS_DEFAULT, ROLES, type Rol, type ModuloKey } from '@/lib/modulos';

type PermisoMatrix = Record<string, Record<string, boolean>>;

async function ensureSeed() {
  const count = await prisma.permisoRol.count();
  if (count > 0) return;

  const records: { rol: string; modulo: string; activo: boolean }[] = [];
  for (const [modulo, roles] of Object.entries(PERMISOS_DEFAULT)) {
    for (const { key: rol } of ROLES) {
      records.push({ rol, modulo, activo: roles.includes(rol as Rol) });
    }
  }
  await prisma.permisoRol.createMany({ data: records, skipDuplicates: true });
}

export async function GET() {
  try {
    await ensureSeed();
    const rows = await prisma.permisoRol.findMany();

    const matrix: PermisoMatrix = {};
    for (const { key: mod } of MODULOS) {
      matrix[mod] = {};
      for (const { key: rol } of ROLES) {
        matrix[mod][rol] = false;
      }
    }
    for (const row of rows) {
      if (matrix[row.modulo]) matrix[row.modulo][row.rol] = row.activo;
    }

    return NextResponse.json({ success: true, data: matrix });
  } catch (error) {
    console.error('GET /api/roles-config:', error);
    return NextResponse.json({ success: false, message: 'Error al obtener permisos.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload || payload.rol !== 'admin') {
      return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 403 });
    }

    const body: PermisoMatrix = await request.json();

    const BLOQUEADOS: Partial<Record<ModuloKey, Rol[]>> = {};
    for (const mod of MODULOS) {
      if (mod.bloqueadoPara?.length) BLOQUEADOS[mod.key] = mod.bloqueadoPara;
    }

    const ops: Promise<unknown>[] = [];
    for (const [modulo, roles] of Object.entries(body)) {
      for (const [rol, activo] of Object.entries(roles)) {
        const locked = BLOQUEADOS[modulo as ModuloKey];
        if (locked?.includes(rol as Rol)) continue;
        if (modulo === 'gestion-roles' && rol !== 'admin') continue;
        if (modulo === 'gestion-usuarios' && rol !== 'admin') continue;
        if (modulo === 'inicio' && rol === 'admin') continue;

        ops.push(
          prisma.permisoRol.upsert({
            where: { rol_modulo: { rol, modulo } },
            update: { activo: Boolean(activo) },
            create: { rol, modulo, activo: Boolean(activo) },
          }),
        );
      }
    }
    await Promise.all(ops);

    return NextResponse.json({ success: true, message: 'Permisos actualizados.' });
  } catch (error) {
    console.error('PUT /api/roles-config:', error);
    return NextResponse.json({ success: false, message: 'Error al actualizar permisos.' }, { status: 500 });
  }
}
