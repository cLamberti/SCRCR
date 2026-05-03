import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

function createRequest(
  url: string,
  method: 'GET' | 'POST' | 'PATCH',
  body?: unknown,
  withAuthCookie: boolean = true
) {
  const headers = new Headers();
  if (withAuthCookie) headers.set('cookie', 'auth-token=fake-token');
  if (body !== undefined) headers.set('content-type', 'application/json');

  return new NextRequest(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe('API Permisos - Pruebas Automatizadas Backend', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('1. Debe devolver 401 en GET /api/permisos cuando no hay token', async () => {
    const serviceMocks = {
      obtenerPermisos: vi.fn(),
      crearPermiso: vi.fn(),
      aprobarRechazarPermiso: vi.fn(),
    };

    vi.doMock('jsonwebtoken', () => ({
      default: { verify: vi.fn() },
    }));

    vi.doMock('@/services/permiso.service', () => ({
      PermisoService: class {
        obtenerPermisos = serviceMocks.obtenerPermisos;
        crearPermiso = serviceMocks.crearPermiso;
        aprobarRechazarPermiso = serviceMocks.aprobarRechazarPermiso;
      },
    }));

    const { GET } = await import('@/app/api/permisos/route');
    const req = createRequest('http://localhost/api/permisos?page=1&limit=10', 'GET', undefined, false);
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('2. Debe filtrar por usuario en GET /api/permisos para roles sin acceso global', async () => {
    const obtenerPermisosMock = vi.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    const serviceMocks = {
      obtenerPermisos: obtenerPermisosMock,
      crearPermiso: vi.fn(),
      aprobarRechazarPermiso: vi.fn(),
    };

    vi.doMock('jsonwebtoken', () => ({
      default: {
        verify: vi.fn().mockReturnValue({ id: 7, username: 'tesorero1', rol: 'tesorero' }),
      },
    }));

    vi.doMock('@/services/permiso.service', () => ({
      PermisoService: class {
        obtenerPermisos = serviceMocks.obtenerPermisos;
        crearPermiso = serviceMocks.crearPermiso;
        aprobarRechazarPermiso = serviceMocks.aprobarRechazarPermiso;
      },
    }));

    const { GET } = await import('@/app/api/permisos/route');
    const req = createRequest('http://localhost/api/permisos?page=1&limit=10', 'GET');
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(obtenerPermisosMock).toHaveBeenCalledWith(1, 10, 7);
  });

  it('3. Debe permitir ver todos los permisos en GET /api/permisos para admin', async () => {
    const obtenerPermisosMock = vi.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    const serviceMocks = {
      obtenerPermisos: obtenerPermisosMock,
      crearPermiso: vi.fn(),
      aprobarRechazarPermiso: vi.fn(),
    };

    vi.doMock('jsonwebtoken', () => ({
      default: {
        verify: vi.fn().mockReturnValue({ id: 1, username: 'admin1', rol: 'admin' }),
      },
    }));

    vi.doMock('@/services/permiso.service', () => ({
      PermisoService: class {
        obtenerPermisos = serviceMocks.obtenerPermisos;
        crearPermiso = serviceMocks.crearPermiso;
        aprobarRechazarPermiso = serviceMocks.aprobarRechazarPermiso;
      },
    }));

    const { GET } = await import('@/app/api/permisos/route');
    const req = createRequest('http://localhost/api/permisos?page=1&limit=10', 'GET');
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(obtenerPermisosMock).toHaveBeenCalledWith(1, 10, undefined);
  });

  it('4. Debe retornar 409 en POST /api/permisos cuando existe traslape', async () => {
    const serviceMocks = {
      obtenerPermisos: vi.fn(),
      crearPermiso: vi.fn().mockRejectedValue({ code: 'OVERLAP_ERROR', message: 'Ya existe traslape' }),
      aprobarRechazarPermiso: vi.fn(),
    };

    vi.doMock('jsonwebtoken', () => ({
      default: {
        verify: vi.fn().mockReturnValue({ id: 7, username: 'tesorero1', rol: 'tesorero' }),
      },
    }));

    vi.doMock('@/services/permiso.service', () => ({
      PermisoService: class {
        obtenerPermisos = serviceMocks.obtenerPermisos;
        crearPermiso = serviceMocks.crearPermiso;
        aprobarRechazarPermiso = serviceMocks.aprobarRechazarPermiso;
      },
    }));

    const { POST } = await import('@/app/api/permisos/route');
    const req = createRequest('http://localhost/api/permisos', 'POST', {
      fechaInicio: '2026-04-10',
      fechaFin: '2026-04-11',
      motivo: 'Consulta',
    });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.success).toBe(false);
  });

  it('5. Debe bloquear PATCH /api/permisos/[id]/estado para rol no autorizado', async () => {
    const serviceMocks = {
      obtenerPermisos: vi.fn(),
      crearPermiso: vi.fn(),
      aprobarRechazarPermiso: vi.fn(),
    };

    vi.doMock('jsonwebtoken', () => ({
      default: {
        verify: vi.fn().mockReturnValue({ id: 7, username: 'tesorero1', rol: 'tesorero' }),
      },
    }));

    vi.doMock('@/services/permiso.service', () => ({
      PermisoService: class {
        obtenerPermisos = serviceMocks.obtenerPermisos;
        crearPermiso = serviceMocks.crearPermiso;
        aprobarRechazarPermiso = serviceMocks.aprobarRechazarPermiso;
      },
    }));

    const { PATCH } = await import('@/app/api/permisos/[id]/estado/route');
    const req = createRequest('http://localhost/api/permisos/10/estado', 'PATCH', {
      estado: 'APROBADO',
    });
    const response = await PATCH(req, { params: Promise.resolve({ id: '10' }) });

    expect(response.status).toBe(403);
  });

  it('6. Debe permitir aprobar en PATCH /api/permisos/[id]/estado para admin', async () => {
    const aprobarMock = vi.fn().mockResolvedValue({
      id: 10,
      estado: 'APROBADO',
    });
    const serviceMocks = {
      obtenerPermisos: vi.fn(),
      crearPermiso: vi.fn(),
      aprobarRechazarPermiso: aprobarMock,
    };

    vi.doMock('jsonwebtoken', () => ({
      default: {
        verify: vi.fn().mockReturnValue({ id: 1, username: 'admin1', rol: 'admin' }),
      },
    }));

    vi.doMock('@/services/permiso.service', () => ({
      PermisoService: class {
        obtenerPermisos = serviceMocks.obtenerPermisos;
        crearPermiso = serviceMocks.crearPermiso;
        aprobarRechazarPermiso = serviceMocks.aprobarRechazarPermiso;
      },
    }));

    const { PATCH } = await import('@/app/api/permisos/[id]/estado/route');
    const req = createRequest('http://localhost/api/permisos/10/estado', 'PATCH', {
      estado: 'APROBADO',
      observacionesResolucion: 'Aprobado por gerencia',
    });
    const response = await PATCH(req, { params: Promise.resolve({ id: '10' }) });

    expect(response.status).toBe(200);
    expect(aprobarMock).toHaveBeenCalledWith(10, {
      estado: 'APROBADO',
      observacionesResolucion: 'Aprobado por gerencia',
    });
  });

  it('7. Debe retornar hasOverlap en GET /api/permisos/traslape', async () => {
    const verificarTraslapeMock = vi.fn().mockResolvedValue(true);

    vi.doMock('jsonwebtoken', () => ({
      default: {
        verify: vi.fn().mockReturnValue({ id: 3, username: 'usuario1', rol: 'tesorero' }),
      },
    }));

    vi.doMock('@/dao/permiso.dao', () => ({
      PermisoDAO: class {
        verificarTraslape = verificarTraslapeMock;
      },
    }));

    const { GET } = await import('@/app/api/permisos/traslape/route');
    const req = createRequest(
      'http://localhost/api/permisos/traslape?fechaInicio=2026-04-10&fechaFin=2026-04-11',
      'GET'
    );
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.hasOverlap).toBe(true);
    expect(verificarTraslapeMock).toHaveBeenCalledWith(3, '2026-04-10', '2026-04-11');
  });
});
