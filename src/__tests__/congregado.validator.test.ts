import { describe, it, expect } from 'vitest';
import { CongregadoValidator } from '@/validators/congregado.validator';
import { EstadoCivil } from '@/models/Congregado';

describe('CongregadoValidator.validarActualizar', () => {
    const fullFormPayload = {
        nombre: 'Juan Pérez',
        cedula: '5-0291-0483',
        fechaIngreso: '2020-05-15',
        telefono: '8888-8888',
        segundoTelefono: '7777-7777',
        estadoCivil: EstadoCivil.SOLTERO,
        ministerio: 'Alabanza',
        segundoMinisterio: null as string | null,
        urlFotoCedula: 'https://example.com/foto.jpg',
        estado: 1,
        observaciones: '',
        correo: '',
        profesion: '',
        direccion: '',
    };

    it('acepta payload completo del frontend al agregar segundo teléfono', () => {
        const sanitized = CongregadoValidator.sanitizarDatos(fullFormPayload);
        const result = CongregadoValidator.validarActualizar(sanitized);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('acepta segundo teléfono con prefijo +506', () => {
        const payload = { ...fullFormPayload, segundoTelefono: '+506 7777-7777' };
        const result = CongregadoValidator.validarActualizar(CongregadoValidator.sanitizarDatos(payload));
        expect(result.valid).toBe(true);
    });

    it('acepta segundo teléfono vacío o null al editar', () => {
        const vacio = CongregadoValidator.validarActualizar(
            CongregadoValidator.sanitizarDatos({ ...fullFormPayload, segundoTelefono: '' })
        );
        const nulo = CongregadoValidator.validarActualizar(
            CongregadoValidator.sanitizarDatos({ ...fullFormPayload, segundoTelefono: null })
        );
        expect(vacio.valid).toBe(true);
        expect(nulo.valid).toBe(true);
        expect(CongregadoValidator.sanitizarDatos({ segundoTelefono: '' }).segundoTelefono).toBeNull();
    });

    it('rechaza segundo teléfono con menos de 8 dígitos', () => {
        const payload = { ...fullFormPayload, segundoTelefono: '8888' };
        const result = CongregadoValidator.validarActualizar(CongregadoValidator.sanitizarDatos(payload));
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('El segundo teléfono debe tener al menos 8 dígitos');
    });

    it('acepta URL relativa en urlFotoCedula al editar', () => {
        const payload = { ...fullFormPayload, urlFotoCedula: '/uploads/cedula.jpg' };
        const result = CongregadoValidator.validarActualizar(CongregadoValidator.sanitizarDatos(payload));
        expect(result.valid).toBe(true);
    });

    it('acepta estado civil legacy de la BD (Soltero(a)) al agregar segundo teléfono', () => {
        const payload = {
            ...fullFormPayload,
            estadoCivil: 'Soltero(a)' as unknown as EstadoCivil,
            segundoTelefono: '7777-7777',
        };
        const result = CongregadoValidator.validarActualizar(CongregadoValidator.sanitizarDatos(payload));
        expect(result.valid).toBe(true);
        expect(CongregadoValidator.sanitizarDatos(payload).estadoCivil).toBe(EstadoCivil.SOLTERO);
    });
});
