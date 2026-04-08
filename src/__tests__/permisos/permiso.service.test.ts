import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PermisoService, PermisoServiceError } from '@/services/permiso.service';
import { PermisoDAO } from '@/dao/permiso.dao';

vi.mock('@/dao/permiso.dao', () => {
  class PermisoDAOFake {
    verificarTraslape = vi.fn();
    crear = vi.fn();
    obtenerTodos = vi.fn();
    obtenerPorId = vi.fn();
    actualizarEstado = vi.fn();
  }
  return { PermisoDAO: PermisoDAOFake };
});

describe('PermisoService - Pruebas Automatizadas Backend', () => {
  let service: PermisoService;
  let dao: InstanceType<typeof PermisoDAO>;

  beforeEach(() => {
    service = new PermisoService();
    dao = (service as any).permisoDAO;
  });

  it('1. Debe fallar al crear permiso cuando existe traslape', async () => {
    (dao.verificarTraslape as any).mockResolvedValue(true);

    await expect(
      service.crearPermiso(5, {
        fechaInicio: '2026-04-10',
        fechaFin: '2026-04-12',
        motivo: 'Asunto personal',
      })
    ).rejects.toMatchObject({
      code: 'OVERLAP_ERROR',
    });
  });

  it('2. Debe crear permiso correctamente cuando no hay traslape', async () => {
    (dao.verificarTraslape as any).mockResolvedValue(false);
    (dao.crear as any).mockResolvedValue({
      id: 1,
      usuarioId: 5,
      fechaInicio: '2026-04-10',
      fechaFin: '2026-04-12',
      motivo: 'Asunto personal',
      estado: 'PENDIENTE',
    });

    const result = await service.crearPermiso(5, {
      fechaInicio: '2026-04-10',
      fechaFin: '2026-04-12',
      motivo: 'Asunto personal',
    });

    expect(dao.verificarTraslape).toHaveBeenCalledWith(5, '2026-04-10', '2026-04-12');
    expect(dao.crear).toHaveBeenCalled();
    expect(result.estado).toBe('PENDIENTE');
  });

  it('3. Debe impedir cambio de estado si el permiso no está pendiente', async () => {
    (dao.obtenerPorId as any).mockResolvedValue({
      id: 100,
      estado: 'APROBADO',
    });

    await expect(
      service.aprobarRechazarPermiso(100, { estado: 'RECHAZADO' })
    ).rejects.toBeInstanceOf(PermisoServiceError);

    await expect(
      service.aprobarRechazarPermiso(100, { estado: 'RECHAZADO' })
    ).rejects.toMatchObject({
      code: 'INVALID_STATUS',
    });
  });

  it('4. Debe fallar al aprobar/rechazar si el permiso no existe', async () => {
    (dao.obtenerPorId as any).mockResolvedValue(null);

    await expect(
      service.aprobarRechazarPermiso(999, { estado: 'APROBADO' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('5. Debe actualizar estado cuando el permiso está pendiente', async () => {
    (dao.obtenerPorId as any).mockResolvedValue({
      id: 22,
      estado: 'PENDIENTE',
    });
    (dao.actualizarEstado as any).mockResolvedValue({
      id: 22,
      estado: 'APROBADO',
    });

    const result = await service.aprobarRechazarPermiso(22, {
      estado: 'APROBADO',
      observacionesResolucion: 'Cumple requisitos',
    });

    expect(dao.actualizarEstado).toHaveBeenCalledWith(22, 'APROBADO', 'Cumple requisitos');
    expect(result.estado).toBe('APROBADO');
  });
});
