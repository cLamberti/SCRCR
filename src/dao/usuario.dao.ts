import { prisma } from '@/lib/prisma';
import { Usuario } from '@/models/Usuario';

function mapToUsuario(row: any): Usuario {
  return {
    id: row.id,
    nombreCompleto: row.nombreCompleto,
    username: row.username,
    email: row.email,
    passwordHash: row.passwordHash ?? '',
    rol: row.rol,
    estado: row.estado,
    ultimoAcceso: row.ultimoAcceso,
    intentosFallidos: row.intentosFallidos,
    bloqueadoHasta: row.bloqueadoHasta,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class UsuarioDAO {
  async findAll(): Promise<Omit<Usuario, 'passwordHash'>[]> {
    const rows = await prisma.usuario.findMany({
      select: {
        id: true,
        nombreCompleto: true,
        username: true,
        email: true,
        rol: true,
        estado: true,
        ultimoAcceso: true,
        intentosFallidos: true,
        bloqueadoHasta: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows as Omit<Usuario, 'passwordHash'>[];
  }

  async create(usuarioData: {
    nombreCompleto: string;
    username: string;
    email: string;
    passwordHash: string;
    rol: 'admin' | 'tesorero' | 'pastorGeneral';
    estado: number;
  }): Promise<Usuario> {
    const row = await prisma.usuario.create({
      data: {
        nombreCompleto: usuarioData.nombreCompleto,
        username: usuarioData.username,
        email: usuarioData.email,
        passwordHash: usuarioData.passwordHash,
        rol: usuarioData.rol,
        estado: usuarioData.estado,
      },
    });
    return mapToUsuario({ ...row, passwordHash: '' });
  }

  async obtenerPorUsername(username: string): Promise<Usuario | null> {
    const row = await prisma.usuario.findUnique({ where: { username } });
    return row ? mapToUsuario(row) : null;
  }

  async findByUsername(username: string): Promise<Usuario | null> {
    return this.obtenerPorUsername(username);
  }

  async obtenerPorId(id: number): Promise<Usuario | null> {
    const row = await prisma.usuario.findUnique({ where: { id } });
    return row ? mapToUsuario(row) : null;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const row = await prisma.usuario.findUnique({ where: { email } });
    return row ? mapToUsuario(row) : null;
  }

  async actualizarIntentos(id: number, intentos: number, bloqueadoHasta?: Date | null): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: {
        intentosFallidos: intentos,
        bloqueadoHasta: bloqueadoHasta ?? null,
      },
    });
  }

  async resetearIntentos(id: number): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { intentosFallidos: 0, bloqueadoHasta: null },
    });
  }

  async actualizarUltimoAcceso(id: number): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { ultimoAcceso: new Date() },
    });
  }
}
