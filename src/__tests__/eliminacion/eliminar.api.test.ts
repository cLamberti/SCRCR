import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

function createDeleteRequest(url: string) {
  return new NextRequest(url, {
    method: 'DELETE',
  });
}

describe('API Eliminación de Asociados', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('debe retornar 400 si el ID es inválido', async () => {
    const { DELETE } = await import('@/app/api/asociados/delete/route');

    const request = createDeleteRequest(
      'http://localhost/api/asociados/delete?id=abc'
    );

    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toBe('ID de asociado inválido');
  });

  it('debe eliminar un asociado correctamente con soft delete', async () => {
    const eliminarMock = vi.fn().mockResolvedValue(true);
    const eliminarPermanenteMock = vi.fn();

    vi.doMock('@/dao/asociado.dao', () => ({
      AsociadoDAO: class {
        eliminar = eliminarMock;
        eliminarPermanente = eliminarPermanenteMock;
      },
    }));

    const { DELETE } = await import('@/app/api/asociados/delete/route');

    const request = createDeleteRequest(
      'http://localhost/api/asociados/delete?id=1'
    );

    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe('Asociado eliminado exitosamente');
    expect(eliminarMock).toHaveBeenCalledWith(1);
  });

  it('debe retornar 404 si el asociado no existe', async () => {
    const eliminarMock = vi.fn().mockResolvedValue(false);

    vi.doMock('@/dao/asociado.dao', () => ({
      AsociadoDAO: class {
        eliminar = eliminarMock;
      },
    }));

    const { DELETE } = await import('@/app/api/asociados/delete/route');

    const request = createDeleteRequest(
      'http://localhost/api/asociados/delete?id=999'
    );

    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.message).toBe('Asociado no encontrado');
  });

  it('debe eliminar permanentemente si permanente=true', async () => {
    const eliminarMock = vi.fn();
    const eliminarPermanenteMock = vi.fn().mockResolvedValue(true);

    vi.doMock('@/dao/asociado.dao', () => ({
      AsociadoDAO: class {
        eliminar = eliminarMock;
        eliminarPermanente = eliminarPermanenteMock;
      },
    }));

    const { DELETE } = await import('@/app/api/asociados/delete/route');

    const request = createDeleteRequest(
      'http://localhost/api/asociados/delete?id=1&permanente=true'
    );

    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe('Asociado eliminado exitosamente (permanente)');
    expect(eliminarPermanenteMock).toHaveBeenCalledWith(1);
    expect(eliminarMock).not.toHaveBeenCalled();
  });

  it('debe retornar 500 si ocurre un error inesperado', async () => {
    const eliminarMock = vi.fn().mockRejectedValue(new Error('Error de base de datos'));

    vi.doMock('@/dao/asociado.dao', () => ({
      AsociadoDAO: class {
        eliminar = eliminarMock;
      },
    }));

    const { DELETE } = await import('@/app/api/asociados/delete/route');

    const request = createDeleteRequest(
      'http://localhost/api/asociados/delete?id=1'
    );

    const response = await DELETE(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.message).toBe('Error de base de datos');
  });
});