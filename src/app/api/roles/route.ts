import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const BASE_ROLES = [
  { key: 'admin',                   label: 'Administrador',           esBase: true },
  { key: 'pastorGeneral',           label: 'Pastor General',          esBase: true },
  { key: 'juntaDirectiva',          label: 'Junta Directiva',         esBase: true },
  { key: 'asistenteAdministrativo', label: 'Asistente Administrativo', esBase: true },
];

async function ensureSeed() {
  const count = await prisma.rolDefinicion.count();
  if (count > 0) return;
  await prisma.rolDefinicion.createMany({ data: BASE_ROLES, skipDuplicates: true });
}

export async function GET() {
  try {
    await ensureSeed();
    const roles = await prisma.rolDefinicion.findMany({ orderBy: [{ esBase: 'desc' }, { createdAt: 'asc' }] });
    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error('GET /api/roles:', error);
    return NextResponse.json({ success: false, message: 'Error al obtener roles.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload || payload.rol !== 'admin') {
      return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 403 });
    }

    const { key, label } = await request.json();

    if (!key || !label) {
      return NextResponse.json({ success: false, message: 'key y label son requeridos.' }, { status: 400 });
    }

    const keyNorm = key.trim().replace(/\s+/g, '_');
    if (!/^[a-zA-Z0-9_]+$/.test(keyNorm)) {
      return NextResponse.json({ success: false, message: 'El key solo puede contener letras, números y guión bajo.' }, { status: 400 });
    }

    const rol = await prisma.rolDefinicion.create({
      data: { key: keyNorm, label: label.trim(), esBase: false },
    });

    return NextResponse.json({ success: true, data: rol }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Ya existe un rol con ese identificador.' }, { status: 409 });
    }
    console.error('POST /api/roles:', error);
    return NextResponse.json({ success: false, message: 'Error al crear el rol.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload || payload.rol !== 'admin') {
      return NextResponse.json({ success: false, message: 'No autorizado.' }, { status: 403 });
    }

    const { key } = await request.json();
    if (!key) {
      return NextResponse.json({ success: false, message: 'key es requerido.' }, { status: 400 });
    }

    const rol = await prisma.rolDefinicion.findUnique({ where: { key } });
    if (!rol) {
      return NextResponse.json({ success: false, message: 'Rol no encontrado.' }, { status: 404 });
    }
    if (rol.esBase) {
      return NextResponse.json({ success: false, message: 'Los roles base del sistema no se pueden eliminar.' }, { status: 400 });
    }

    // Eliminar permisos asociados y luego el rol
    await prisma.permisoRol.deleteMany({ where: { rol: key } });
    await prisma.rolDefinicion.delete({ where: { key } });

    return NextResponse.json({ success: true, message: 'Rol eliminado.' });
  } catch (error) {
    console.error('DELETE /api/roles:', error);
    return NextResponse.json({ success: false, message: 'Error al eliminar el rol.' }, { status: 500 });
  }
}
