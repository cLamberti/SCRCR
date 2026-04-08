
// Enum para el estado civil del congregado
export enum EstadoCivil {
    SOLTERO = 'soltero',
    CASADO = 'casado',
    DIVORCIADO = 'divorciado',
    VIUDO = 'viudo',
    UNION_LIBRE = 'union_libre',
}

// Nota: El ministerio es un string libre (varchar(50) en la DB).
// No se usa un enum cerrado para permitir que nuevos ministerios
// se agreguen sin modificar el código.

// Enum para el estado del congregado (1=activo, 0=inactivo — soft delete DB07)
export enum EstadoCongregado {
    INACTIVO = 0,
    ACTIVO = 1,
}

export interface Congregado {
    id: number;
    nombre: string;
    cedula: string;               // Identificador único nacional (UNIQUE en DB)
    fechaIngreso: Date;
    telefono: string;
    segundoTelefono?: string;     // Opcional
    estadoCivil: EstadoCivil;
    ministerio: string;           // varchar(50) libre en la DB
    segundoMinisterio?: string;   // Opcional
    urlFotoCedula: string;
    estado: EstadoCongregado;      // 1=activo, 0=inactivo (soft delete, esquema DB07)
    createdAt: Date;
    updatedAt: Date;
}

export class CongregadoModel implements Congregado {
    id: number;
    nombre: string;
    cedula: string;
    fechaIngreso: Date;
    telefono: string;
    segundoTelefono?: string;
    estadoCivil: EstadoCivil;
    ministerio: string;
    segundoMinisterio?: string;
    urlFotoCedula: string;
    estado: EstadoCongregado;
    createdAt: Date;
    updatedAt: Date;

    constructor(data: Partial<Congregado>) {
        this.id = data.id ?? 0;
        this.nombre = data.nombre ?? '';
        this.cedula = data.cedula ?? '';
        this.fechaIngreso = data.fechaIngreso ?? new Date();
        this.telefono = data.telefono ?? '';
        this.segundoTelefono = data.segundoTelefono;
        this.estadoCivil = data.estadoCivil ?? EstadoCivil.SOLTERO;
        this.ministerio = data.ministerio ?? '';
        this.segundoMinisterio = data.segundoMinisterio;
        this.urlFotoCedula = data.urlFotoCedula ?? '';
        this.estado = data.estado ?? EstadoCongregado.ACTIVO;
        this.createdAt = data.createdAt ?? new Date();
        this.updatedAt = data.updatedAt ?? new Date();
    }

    // Método para verificar si el congregado está activo
    isActivo(): boolean {
        return this.estado === EstadoCongregado.ACTIVO;
    }

    // Método para verificar si tiene segundo teléfono registrado
    tieneSegundoTelefono(): boolean {
        return !!this.segundoTelefono;
    }

    // Método para verificar si pertenece a más de un ministerio
    tieneSegundoMinisterio(): boolean {
        return !!this.segundoMinisterio;
    }

    // Método para obtener el objeto como JSON
    toJSON(): Congregado {
        return {
            id: this.id,
            nombre: this.nombre,
            cedula: this.cedula,
            fechaIngreso: this.fechaIngreso,
            telefono: this.telefono,
            segundoTelefono: this.segundoTelefono,
            estadoCivil: this.estadoCivil,
            ministerio: this.ministerio,
            segundoMinisterio: this.segundoMinisterio,
            urlFotoCedula: this.urlFotoCedula,
            estado: this.estado,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

// Tipo para crear un nuevo congregado (sin id ni timestamps)
export type NuevoCongregado = Omit<Congregado, 'id' | 'createdAt' | 'updatedAt'>;

// Tipo para actualizar un congregado (todos los campos opcionales excepto id)
export type ActualizarCongregado = Partial<Omit<Congregado, 'id'>> & { id: number };
