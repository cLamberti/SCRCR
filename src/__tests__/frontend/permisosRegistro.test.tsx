import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import RegistroPermisoPage from '@/app/permisos/registro/page';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks necesarios
vi.mock('@/components/SideBar', () => ({
    default: () => React.createElement('div', { 'data-testid': 'sidebar' }, 'Sidebar Mock')
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
}));

vi.mock('react-icons/fa', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-icons/fa')>();
    const Icon = () => null;
    return {
        ...actual,
        FaArrowLeft: Icon,
        FaSave: Icon,
    };
});

describe('RegistroPermisoPage - Pruebas de Frontend', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: { id: 1 } })
        } as Response);
    });

    it('1. Renderizado correcto de los campos del formulario', async () => {
        await act(async () => {
            render(React.createElement(RegistroPermisoPage));
        });

        expect(screen.getByText(/Solicitar Permiso de Ausencia/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Fecha de Inicio \*/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Fecha de Fin \*/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Motivo \/ Justificación \*/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Documento Adjunto \(Opcional\)/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Solicitar Permiso/i })).toBeInTheDocument();
    });

    it('2. Validación: Campos requeridos vacíos', async () => {
        await act(async () => {
            render(React.createElement(RegistroPermisoPage));
        });

        const btnSubmit = screen.getByRole('button', { name: /Solicitar Permiso/i });
        await act(async () => {
            fireEvent.click(btnSubmit);
        });

        expect(screen.getByText(/Todos los campos son requeridos/i)).toBeInTheDocument();
    });

    it('3. Validación: Fechas incoherentes (Fin menor a Inicio)', async () => {
        await act(async () => {
            render(React.createElement(RegistroPermisoPage));
        });

        const inputInicio = screen.getByLabelText(/Fecha de Inicio \*/i);
        const inputFin = screen.getByLabelText(/Fecha de Fin \*/i);
        const inputMotivo = screen.getByLabelText(/Motivo \/ Justificación \*/i);

        await act(async () => {
            fireEvent.change(inputInicio, { target: { value: '2026-05-10' } });
            fireEvent.change(inputFin, { target: { value: '2026-05-01' } });
            fireEvent.change(inputMotivo, { target: { value: 'Motivo de prueba' } });
        });

        const btnSubmit = screen.getByRole('button', { name: /Solicitar Permiso/i });
        await act(async () => {
            fireEvent.click(btnSubmit);
        });

        expect(screen.getByText(/La fecha de fin no puede ser menor a la fecha de inicio/i)).toBeInTheDocument();
    });

    it('4. Validación: Archivo demasiado grande (mayor a 5MB)', async () => {
        await act(async () => {
            render(React.createElement(RegistroPermisoPage));
        });

        const inputFile = screen.getByLabelText(/Documento Adjunto \(Opcional\)/i);
        
        // Mock de un archivo de 6MB
        const file = new File(['a'.repeat(6 * 1024 * 1024)], 'archivo-grande.pdf', { type: 'application/pdf' });
        
        await act(async () => {
            fireEvent.change(inputFile, { target: { files: [file] } });
        });

        expect(screen.getByText(/El archivo no debe superar los 5MB/i)).toBeInTheDocument();
    });

    it('5. Flujo exitoso: Enviar formulario', async () => {
        await act(async () => {
            render(React.createElement(RegistroPermisoPage));
        });

        const inputInicio = screen.getByLabelText(/Fecha de Inicio \*/i);
        const inputFin = screen.getByLabelText(/Fecha de Fin \*/i);
        const inputMotivo = screen.getByLabelText(/Motivo \/ Justificación \*/i);

        await act(async () => {
            fireEvent.change(inputInicio, { target: { value: '2026-06-01' } });
            fireEvent.change(inputFin, { target: { value: '2026-06-05' } });
            fireEvent.change(inputMotivo, { target: { value: 'Viaje familiar' } });
        });

        const btnSubmit = screen.getByRole('button', { name: /Solicitar Permiso/i });
        await act(async () => {
            fireEvent.click(btnSubmit);
        });

        // Verificar el payload de fetch
        expect(global.fetch).toHaveBeenCalledWith('/api/permisos', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('2026-06-01'),
        }));

        // Verificar mensaje de éxito
        await waitFor(() => {
            expect(screen.getByText(/Permiso solicitado con éxito/i)).toBeInTheDocument();
        });

        // Verificar redirección tras timeout
        // (Podríamos usar vitest fake timers, pero confío en que se ejecuta al rato.
        // Mejor adelantamos los timers si los fakes están encendidos, 
        // pero dado que el timeout es corto, un waitFor puede ser suficiente con timeout en testing-library real)
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/permisos');
        }, { timeout: 2000 });
    });

    it('6. Manejo de errores de servidor', async () => {
        vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
            const url = typeof input === 'string' ? input : input.toString();

            // El formulario ahora consulta traslapes en cada cambio de fechas.
            if (url.includes('/api/permisos/traslape')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ success: true, hasOverlap: false })
                } as Response;
            }

            if (url === '/api/permisos') {
                return {
                    ok: false,
                    status: 400,
                    json: async () => ({ success: false, message: 'El usuario ya tiene un permiso activo en esas fechas' })
                } as Response;
            }

            return {
                ok: true,
                status: 200,
                json: async () => ({ success: true })
            } as Response;
        });

        await act(async () => {
            render(React.createElement(RegistroPermisoPage));
        });

        const inputInicio = screen.getByLabelText(/Fecha de Inicio \*/i);
        const inputFin = screen.getByLabelText(/Fecha de Fin \*/i);
        const inputMotivo = screen.getByLabelText(/Motivo \/ Justificación \*/i);

        await act(async () => {
            fireEvent.change(inputInicio, { target: { value: '2026-06-01' } });
            fireEvent.change(inputFin, { target: { value: '2026-06-05' } });
            fireEvent.change(inputMotivo, { target: { value: 'Viaje' } });
        });

        const btnSubmit = screen.getByRole('button', { name: /Solicitar Permiso/i });
        await act(async () => {
            fireEvent.click(btnSubmit);
        });

        await waitFor(() => {
            expect(screen.getByText(/El usuario ya tiene un permiso activo en esas fechas/i)).toBeInTheDocument();
        });
    });
});
