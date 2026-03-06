import { EstadoCivil, EstadoCongregado } from '@/models/Congregado';
import {
    CrearCongregadoRequest,
    ActualizarCongregadoRequest,
    FiltrosCongregadoRequest,
} from '@/dto/congregado.dto';

// Regex para validar formato de teléfono (dígitos, espacios, +, -, paréntesis)
const PHONE_REGEX = /^[\d\s\-+()]+$/;

// Regex básico para validar URL (http o https)
const URL_REGEX = /^https?:\/\/.+/i;

// Regex para cédula: solo dígitos y guiones (igual que asociado.validator.ts)
const CEDULA_REGEX = /^[0-9-]+$/;

// Valores válidos del enum EstadoCivil
const ESTADOS_CIVILES_VALIDOS = Object.values(EstadoCivil) as string[];

/**
 * Validador para las operaciones CRUD de Congregado
 */
export class CongregadoValidator {
    // ─── CREAR ──────────────────────────────────────────────────────────────────

    /**
     * Valida los datos para registrar un nuevo congregado
     */
    static validarCrear(data: CrearCongregadoRequest): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Nombre
        if (!data.nombre || data.nombre.trim().length === 0) {
            errors.push('El nombre es requerido');
        } else if (data.nombre.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        } else if (data.nombre.length > 100) {
            errors.push('El nombre no puede exceder 100 caracteres');
        }

        // Cédula (requerida, UNIQUE en DB)
        if (!data.cedula || data.cedula.trim().length === 0) {
            errors.push('La cédula es requerida');
        } else if (data.cedula.length > 20) {
            errors.push('La cédula no puede exceder 20 caracteres');
        } else if (!CEDULA_REGEX.test(data.cedula)) {
            errors.push('La cédula solo puede contener números y guiones');
        }

        // Fecha de ingreso
        if (!data.fechaIngreso) {
            errors.push('La fecha de ingreso es requerida');
        } else {
            const fecha = new Date(data.fechaIngreso);
            if (isNaN(fecha.getTime())) {
                errors.push('La fecha de ingreso no es válida');
            } else if (fecha > new Date()) {
                errors.push('La fecha de ingreso no puede ser una fecha futura');
            }
        }

        // Teléfono principal
        if (!data.telefono || data.telefono.trim().length === 0) {
            errors.push('El teléfono es requerido');
        } else {
            const cleanPhone = data.telefono.replace(/[\s\-+()]/g, '');
            if (!PHONE_REGEX.test(data.telefono)) {
                errors.push('El teléfono contiene caracteres no válidos');
            } else if (cleanPhone.length < 8) {
                errors.push('El teléfono debe tener al menos 8 dígitos');
            } else if (cleanPhone.length > 20) {
                errors.push('El teléfono no puede exceder 20 dígitos');
            }
        }

        // Segundo teléfono (opcional)
        if (data.segundoTelefono !== undefined && data.segundoTelefono !== '') {
            const cleanPhone2 = data.segundoTelefono.replace(/[\s\-+()]/g, '');
            if (!PHONE_REGEX.test(data.segundoTelefono)) {
                errors.push('El segundo teléfono contiene caracteres no válidos');
            } else if (cleanPhone2.length < 8) {
                errors.push('El segundo teléfono debe tener al menos 8 dígitos');
            } else if (cleanPhone2.length > 20) {
                errors.push('El segundo teléfono no puede exceder 20 dígitos');
            }
        }

        // Estado civil
        if (!data.estadoCivil) {
            errors.push('El estado civil es requerido');
        } else if (!ESTADOS_CIVILES_VALIDOS.includes(data.estadoCivil)) {
            errors.push(`El estado civil debe ser uno de: ${ESTADOS_CIVILES_VALIDOS.join(', ')}`);
        }

        // Ministerio principal (string libre, max 50 chars como en la DB)
        if (!data.ministerio || data.ministerio.trim().length === 0) {
            errors.push('El ministerio es requerido');
        } else if (data.ministerio.length > 50) {
            errors.push('El ministerio no puede exceder 50 caracteres');
        }

        // Segundo ministerio (opcional, string libre)
        if (data.segundoMinisterio !== undefined && data.segundoMinisterio !== '') {
            if (data.segundoMinisterio.length > 50) {
                errors.push('El segundo ministerio no puede exceder 50 caracteres');
            } else if (data.segundoMinisterio.trim().toLowerCase() === data.ministerio.trim().toLowerCase()) {
                errors.push('El segundo ministerio no puede ser igual al ministerio principal');
            }
        }

        // URL foto cédula
        if (!data.urlFotoCedula || data.urlFotoCedula.trim().length === 0) {
            errors.push('La URL de la foto de cédula es requerida');
        } else if (!URL_REGEX.test(data.urlFotoCedula)) {
            errors.push('La URL de la foto de cédula no es válida (debe comenzar con http:// o https://)');
        }

        // Estado (opcional, default activo)
        if (data.estado !== undefined && ![EstadoCongregado.ACTIVO, EstadoCongregado.INACTIVO].includes(data.estado)) {
            errors.push('El estado debe ser 0 (inactivo) o 1 (activo)');
        }

        return { valid: errors.length === 0, errors };
    }

    // ─── ACTUALIZAR ─────────────────────────────────────────────────────────────

    /**
     * Valida los datos para actualizar un congregado existente
     */
    static validarActualizar(data: ActualizarCongregadoRequest): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        let hasData = false;

        const check = (value: unknown) => {
            if (value !== undefined) hasData = true;
        };

        // Nombre (si se proporciona)
        if (data.nombre !== undefined) {
            check(data.nombre);
            if (data.nombre.trim().length === 0) {
                errors.push('El nombre no puede estar vacío');
            } else if (data.nombre.trim().length < 2) {
                errors.push('El nombre debe tener al menos 2 caracteres');
            } else if (data.nombre.length > 100) {
                errors.push('El nombre no puede exceder 100 caracteres');
            }
        }

        // Cédula (si se proporciona)
        if (data.cedula !== undefined) {
            check(data.cedula);
            if (data.cedula.trim().length === 0) {
                errors.push('La cédula no puede estar vacía');
            } else if (data.cedula.length > 20) {
                errors.push('La cédula no puede exceder 20 caracteres');
            } else if (!CEDULA_REGEX.test(data.cedula)) {
                errors.push('La cédula solo puede contener números y guiones');
            }
        }

        // Fecha de ingreso (si se proporciona)
        if (data.fechaIngreso !== undefined) {
            check(data.fechaIngreso);
            const fecha = new Date(data.fechaIngreso);
            if (isNaN(fecha.getTime())) {
                errors.push('La fecha de ingreso no es válida');
            } else if (fecha > new Date()) {
                errors.push('La fecha de ingreso no puede ser una fecha futura');
            }
        }

        // Teléfono principal (si se proporciona)
        if (data.telefono !== undefined) {
            check(data.telefono);
            const cleanPhone = data.telefono.replace(/[\s\-+()]/g, '');
            if (!PHONE_REGEX.test(data.telefono)) {
                errors.push('El teléfono contiene caracteres no válidos');
            } else if (cleanPhone.length < 8) {
                errors.push('El teléfono debe tener al menos 8 dígitos');
            } else if (cleanPhone.length > 20) {
                errors.push('El teléfono no puede exceder 20 dígitos');
            }
        }

        // Segundo teléfono (si se proporciona; null = eliminar)
        if (data.segundoTelefono !== undefined && data.segundoTelefono !== null && data.segundoTelefono !== '') {
            check(data.segundoTelefono);
            const cleanPhone2 = data.segundoTelefono.replace(/[\s\-+()]/g, '');
            if (!PHONE_REGEX.test(data.segundoTelefono)) {
                errors.push('El segundo teléfono contiene caracteres no válidos');
            } else if (cleanPhone2.length < 8) {
                errors.push('El segundo teléfono debe tener al menos 8 dígitos');
            } else if (cleanPhone2.length > 20) {
                errors.push('El segundo teléfono no puede exceder 20 dígitos');
            }
        } else if (data.segundoTelefono === null) {
            check(data.segundoTelefono);
        }

        // Estado civil (si se proporciona)
        if (data.estadoCivil !== undefined) {
            check(data.estadoCivil);
            if (!ESTADOS_CIVILES_VALIDOS.includes(data.estadoCivil)) {
                errors.push(`El estado civil debe ser uno de: ${ESTADOS_CIVILES_VALIDOS.join(', ')}`);
            }
        }

        // Ministerio principal (si se proporciona)
        if (data.ministerio !== undefined) {
            check(data.ministerio);
            if (data.ministerio.trim().length === 0) {
                errors.push('El ministerio no puede estar vacío');
            } else if (data.ministerio.length > 50) {
                errors.push('El ministerio no puede exceder 50 caracteres');
            }
        }

        // Segundo ministerio (si se proporciona; null = eliminar)
        if (data.segundoMinisterio !== undefined && data.segundoMinisterio !== null && data.segundoMinisterio !== '') {
            check(data.segundoMinisterio);
            if (data.segundoMinisterio.length > 50) {
                errors.push('El segundo ministerio no puede exceder 50 caracteres');
            } else if (data.ministerio && data.segundoMinisterio.trim().toLowerCase() === data.ministerio.trim().toLowerCase()) {
                errors.push('El segundo ministerio no puede ser igual al ministerio principal');
            }
        } else if (data.segundoMinisterio === null) {
            check(data.segundoMinisterio);
        }

        // URL foto cédula (si se proporciona)
        if (data.urlFotoCedula !== undefined) {
            check(data.urlFotoCedula);
            if (data.urlFotoCedula.trim().length === 0) {
                errors.push('La URL de la foto de cédula no puede estar vacía');
            } else if (!URL_REGEX.test(data.urlFotoCedula)) {
                errors.push('La URL de la foto de cédula no es válida (debe comenzar con http:// o https://)');
            }
        }

        // Estado (si se proporciona)
        if (data.estado !== undefined) {
            check(data.estado);
            if (![EstadoCongregado.ACTIVO, EstadoCongregado.INACTIVO].includes(data.estado)) {
                errors.push('El estado debe ser 0 (inactivo) o 1 (activo)');
            }
        }

        // Al menos un campo debe estar presente
        if (!hasData && errors.length === 0) {
            errors.push('No se proporcionó ningún campo para actualizar');
        }

        return { valid: errors.length === 0, errors };
    }

    // ─── SANITIZACIÓN ────────────────────────────────────────────────────────────

    /**
     * Sanitiza datos de entrada eliminando espacios innecesarios
     */
    static sanitizarDatos<T extends CrearCongregadoRequest | ActualizarCongregadoRequest>(data: T): T {
        const sanitized = { ...data };

        if (sanitized.nombre) sanitized.nombre = sanitized.nombre.trim();
        if (sanitized.cedula) sanitized.cedula = sanitized.cedula.trim();
        if (sanitized.telefono) sanitized.telefono = sanitized.telefono.trim();
        if (sanitized.segundoTelefono) sanitized.segundoTelefono = sanitized.segundoTelefono.trim();
        if (sanitized.ministerio) sanitized.ministerio = sanitized.ministerio.trim();
        if (sanitized.segundoMinisterio) sanitized.segundoMinisterio = sanitized.segundoMinisterio.trim();
        if (sanitized.urlFotoCedula) sanitized.urlFotoCedula = sanitized.urlFotoCedula.trim();

        return sanitized;
    }
}

// ─── CONSULTA / FILTROS ──────────────────────────────────────────────────────

export class ConsultaCongregadoValidator {
    static validarFiltros(input: {
        nombre?: string;
        cedula?: string;
        estadoCivil?: string;
        ministerio?: string;
        estado?: string | number;
        fechaIngresoDesde?: string;
        fechaIngresoHasta?: string;
        page?: string | number;
        limit?: string | number;
    }): {
        valid: boolean;
        errors: string[];
        filtros: FiltrosCongregadoRequest;
    } {
        const errors: string[] = [];
        const filtros: FiltrosCongregadoRequest = {};

        // Nombre (opcional)
        if (input.nombre !== undefined) {
            const n = String(input.nombre).trim();
            if (n.length > 0 && n.length < 2) {
                errors.push('El nombre debe tener al menos 2 caracteres para buscar');
            } else if (n.length > 0) {
                filtros.nombre = n;
            }
        }

        // Cédula (opcional)
        if (input.cedula !== undefined) {
            const c = String(input.cedula).trim();
            if (c.length > 0) {
                if (!CEDULA_REGEX.test(c)) {
                    errors.push('La cédula solo puede contener números y guiones');
                } else {
                    filtros.cedula = c;
                }
            }
        }

        // Estado civil (opcional)
        if (input.estadoCivil !== undefined && String(input.estadoCivil).length > 0) {
            if (!ESTADOS_CIVILES_VALIDOS.includes(input.estadoCivil)) {
                errors.push(`El estado civil debe ser uno de: ${ESTADOS_CIVILES_VALIDOS.join(', ')}`);
            } else {
                filtros.estadoCivil = input.estadoCivil as EstadoCivil;
            }
        }

        // Ministerio (opcional, string libre)
        if (input.ministerio !== undefined) {
            const m = String(input.ministerio).trim();
            if (m.length > 0) filtros.ministerio = m;
        }

        // Estado activo/inactivo (opcional)
        if (input.estado !== undefined && String(input.estado).length > 0) {
            const e = Number(input.estado);
            if (![EstadoCongregado.ACTIVO, EstadoCongregado.INACTIVO].includes(e)) {
                errors.push('El estado debe ser 0 (inactivo) o 1 (activo)');
            } else {
                filtros.estado = e as EstadoCongregado;
            }
        }

        // Rango de fechas (opcional)
        if (input.fechaIngresoDesde) {
            const desde = new Date(input.fechaIngresoDesde);
            if (isNaN(desde.getTime())) {
                errors.push('La fecha de inicio del rango no es válida');
            } else {
                filtros.fechaIngresoDesde = input.fechaIngresoDesde;
            }
        }

        if (input.fechaIngresoHasta) {
            const hasta = new Date(input.fechaIngresoHasta);
            if (isNaN(hasta.getTime())) {
                errors.push('La fecha de fin del rango no es válida');
            } else {
                filtros.fechaIngresoHasta = input.fechaIngresoHasta;
            }
        }

        if (filtros.fechaIngresoDesde && filtros.fechaIngresoHasta) {
            if (new Date(filtros.fechaIngresoDesde) > new Date(filtros.fechaIngresoHasta)) {
                errors.push('La fecha inicial no puede ser posterior a la fecha final');
            }
        }

        // Paginación
        const p = Number(input.page ?? 1);
        const l = Number(input.limit ?? 10);
        if (!Number.isFinite(p) || p < 1) errors.push('El page debe ser un número mayor o igual a 1');
        if (!Number.isFinite(l) || l < 1 || l > 100) errors.push('El limit debe estar entre 1 y 100');

        filtros.page = Number.isFinite(p) && p >= 1 ? p : 1;
        filtros.limit = Number.isFinite(l) && l >= 1 && l <= 100 ? l : 10;

        return { valid: errors.length === 0, errors, filtros };
    }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export class DeleteCongregadoValidator {
    static validar(input: { id?: string | number; permanente?: string | boolean }): {
        valid: boolean;
        errors: string[];
        id?: number;
        permanente: boolean;
    } {
        const errors: string[] = [];

        const idNum = Number(input.id);
        if (!input.id || isNaN(idNum) || idNum <= 0) {
            errors.push('El ID debe ser un número entero positivo');
        }

        const permanente =
            input.permanente === true ||
            String(input.permanente).toLowerCase() === 'true';

        return {
            valid: errors.length === 0,
            errors,
            id: errors.length === 0 ? idNum : undefined,
            permanente,
        };
    }
}
