import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CongregadosPage from '@/app/congregados/page';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks específicos de este test
vi.mock('@/components/SideBar', () => ({
    default: () => React.createElement('div', { 'data-testid': 'sidebar' }, 'Sidebar Mock')
}));

describe('CongregadosPage - Pruebas de Frontend', () => {

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock global de fetch usando spyOn
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: [] })
        } as Response);
    });

    const mockSingleData = [{
        id: 1,
        nombre: 'Juan Perez',
        cedula: '1-2345-6789',
        telefono: '8888-8888',
        estadoCivil: 'soltero',
        ministerio: 'Alabanza',
        fechaIngreso: '2023-01-01',
        estado: 1,
        urlFotoCedula: 'https://test.com/img.jpg'
    }];

    it('1. Render de Cabecera y Título', async () => {
        await act(async () => {
            render(React.createElement(CongregadosPage));
        });
        expect(screen.getByText(/Gestión de Congregados/i)).toBeInTheDocument();
    });

    it('2. Render de botones principales y filtros', async () => {
        await act(async () => {
            render(React.createElement(CongregadosPage));
        });
        expect(screen.getByRole('button', { name: /nuevo/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Ej: María Solano/i)).toBeInTheDocument();
    });

    it('3. Agregar congregado: Render de modal y botones', async () => {
        await act(async () => {
            render(React.createElement(CongregadosPage));
        });

        const btnNuevo = screen.getByRole('button', { name: /nuevo/i });
        await act(async () => {
            fireEvent.click(btnNuevo);
        });

        await waitFor(() => {
            expect(screen.getByText(/Registrar Congregado/i)).toBeInTheDocument();
        });

        expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /registrar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cerrar|cancelar/i })).toBeInTheDocument();
    });

    it.skip('4. Actualizar congregado: Render con datos precargados', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockSingleData })
        } as Response);

        await act(async () => {
            render(React.createElement(CongregadosPage));
        });

        await screen.findByText(/Juan Perez/i, {}, { timeout: 3000 });

        const btnEditar = screen.getByRole('button', { name: /editar/i });
        await act(async () => {
            fireEvent.click(btnEditar);
        });

        await waitFor(() => {
            expect(screen.getByText(/Editar Congregado/i)).toBeInTheDocument();
        });

        expect(screen.getByDisplayValue(/Juan Perez/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
    });

    it.skip('5. Eliminar congregado: Render de modal de confirmación', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockSingleData })
        } as Response);

        await act(async () => {
            render(React.createElement(CongregadosPage));
        });

        await screen.findByText(/Juan Perez/i);

        const tbody = screen.getByTestId('table-body');
        const checkbox = tbody.querySelector('input[type="checkbox"]');
        if (!checkbox) throw new Error("Checkbox no encontrado");

        await act(async () => {
            fireEvent.click(checkbox);
        });

        const btnEliminarMasivo = screen.getByRole('button', { name: /eliminar seleccionados/i });
        await act(async () => {
            fireEvent.click(btnEliminarMasivo);
        });

        await waitFor(() => {
            expect(screen.getByText(/Confirmar eliminación/i)).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
        expect(screen.getByTestId('modal-delete').querySelector('button[class*="border"]')).toBeInTheDocument();
    });

    it('6. Render de mensajes de error y botón Reintentar', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ success: false, message: 'Error de servidor' })
        } as Response);

        await act(async () => {
            render(React.createElement(CongregadosPage));
        });

        await screen.findByText(/Error de servidor/i);
        expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });
});
