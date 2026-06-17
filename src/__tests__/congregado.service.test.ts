import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CongregadoService } from '@/services/congregado.service';
import { CrearCongregadoRequest, ActualizarCongregadoRequest } from '@/dto/congregado.dto';
import { EstadoCivil, EstadoCongregado } from '@/models/Congregado';
import { CongregadoDAO } from '@/dao/congregado.dao';

// Datos de prueba garantizados para no chocar con datos reales
const TEST_CEDULA = '5-0432-0123';
const TEST_CEDULA_UPDATE = '5-0110-0113';
let createdId: number;
const congregadoService = new CongregadoService();

describe.skip('CongregadoService - Pruebas de Integración con BD Real', () => {

    beforeAll(async () => {
        const dao = new CongregadoDAO();
        const existente1 = await dao.obtenerPorCedula(TEST_CEDULA);
        const existente2 = await dao.obtenerPorCedula(TEST_CEDULA_UPDATE);

        if (existente1) await dao.eliminarPermanente(existente1.id);
        if (existente2) await dao.eliminarPermanente(existente2.id);
    });

    afterAll(async () => {
        if (createdId) {
            const dao = new CongregadoDAO();
            await dao.eliminarPermanente(createdId);
        }
    });

    it('1. Debe fallar al intentar crear un congregado con datos inválidos', async () => {
        const datosInvalidos = {
            nombre: 'A',
            cedula: TEST_CEDULA,
            fechaIngreso: 'fecha-mala',
            telefono: '123',
            estadoCivil: 'soltero_falso' as EstadoCivil,
            ministerio: '',
            urlFotoCedula: 'not-a-url'
        };

        await expect(congregadoService.crear(datosInvalidos as any)).rejects.toThrowError('Datos de congregado inválidos');
    });

    it('2. Debe crear un congregado exitosamente en la BD real', async () => {
        const nuevoCongregado: CrearCongregadoRequest = {
            nombre: 'Usuario Test Automatizado',
            cedula: TEST_CEDULA,
            fechaIngreso: new Date().toISOString().split('T')[0],
            telefono: '8888-8888',
            estadoCivil: EstadoCivil.SOLTERO,
            ministerio: 'Ministerio de Pruebas',
            urlFotoCedula: 'https://ejemplo.com/foto_test.jpg'
        };

        const resultado = await congregadoService.crear(nuevoCongregado);

        expect(resultado).toBeDefined();
        expect(resultado.id).toBeGreaterThan(0);
        expect(resultado.nombre).toBe('Usuario Test Automatizado');
        expect(resultado.cedula).toBe(TEST_CEDULA);
        expect(resultado.estado).toBe(EstadoCongregado.ACTIVO);

        createdId = resultado.id;
    });

    it('2.1. Debe manejar valores null en campos opcionales correctamente', async () => {
        const tempCedula = '2-0000-0000';
        const conNulls: CrearCongregadoRequest = {
            nombre: 'Usuario Con Nulls',
            cedula: tempCedula,
            fechaIngreso: new Date().toISOString().split('T')[0],
            telefono: '7777-7777',
            estadoCivil: EstadoCivil.SOLTERO,
            ministerio: 'Ministerio Null',
            urlFotoCedula: 'https://ejemplo.com/null.jpg',
            segundoTelefono: null as any,
            segundoMinisterio: null as any
        };

        const resultado = await congregadoService.crear(conNulls);
        expect(resultado).toBeDefined();
        expect(resultado.id).toBeGreaterThan(0);

        // Limpiar
        const dao = new CongregadoDAO();
        await dao.eliminarPermanente(resultado.id);
    });

    it('3. Debe fallar al intentar insertar la misma cédula (Duplicado)', async () => {
        const duplicado: CrearCongregadoRequest = {
            nombre: 'Otro Usuario',
            cedula: TEST_CEDULA,
            fechaIngreso: '2025-01-01',
            telefono: '12345678',
            estadoCivil: EstadoCivil.CASADO,
            ministerio: 'Otro',
            urlFotoCedula: 'https://test.com/img.jpg'
        };

        await expect(congregadoService.crear(duplicado)).rejects.toThrowError('Ya existe un congregado con esta cédula');
    });

    it('4. Debe obtener el congregado recién creado por su ID', async () => {
        const obtenido = await congregadoService.obtenerPorId(createdId);

        expect(obtenido).toBeDefined();
        expect(obtenido.id).toBe(createdId);
        expect(obtenido.cedula).toBe(TEST_CEDULA);
    });

    it('5. Debe actualizar los datos del congregado y guardarlos en la BD', async () => {
        const actualizacion: ActualizarCongregadoRequest = {
            nombre: 'Usuario Test Modificado',
            cedula: TEST_CEDULA_UPDATE,
            segundoTelefono: '9999-9999',
            ministerio: 'Ministerio Actualizado'
        };

        const resultado = await congregadoService.actualizar(createdId, actualizacion);

        expect(resultado).toBeDefined();
        expect(resultado.id).toBe(createdId);
        expect(resultado.nombre).toBe('Usuario Test Modificado');
        expect(resultado.cedula).toBe(TEST_CEDULA_UPDATE);
        expect(resultado.segundoTelefono).toBe('9999-9999');
        expect(resultado.ministerio).toBe('Ministerio Actualizado');
    });

    it('6. Debe realizar un soft-delete (eliminar lógico) del congregado', async () => {
        await congregadoService.eliminar(createdId);
        const obtenido = await congregadoService.obtenerPorId(createdId);
        expect(obtenido.estado).toBe(EstadoCongregado.INACTIVO);
    });

    it('7. Debe verificar que el congregado inactivo no aparece en búsquedas activas', async () => {
        const resultadosActivos = await congregadoService.obtenerActivos(1, 100);
        const encontrado = resultadosActivos.data.find((c: any) => c.id === createdId);
        expect(encontrado).toBeUndefined();

        const resultadosInactivos = await congregadoService.obtenerInactivos(1, 100);
        const encontradoInactivo = resultadosInactivos.data.find((c: any) => c.id === createdId);
        expect(encontradoInactivo).toBeDefined();
        expect(encontradoInactivo?.id).toBe(createdId);
    });
});
