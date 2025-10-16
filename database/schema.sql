-- Eliminar objetos existentes si existen (para desarrollo)
DROP TRIGGER IF EXISTS update_asociados_updated_at ON asociados;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS asociados CASCADE;

-- Crear la tabla de asociados
CREATE TABLE asociados (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    correo VARCHAR(255),
    telefono VARCHAR(20) NOT NULL,
    ministerio VARCHAR(255),
    direccion TEXT,
    fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado INTEGER DEFAULT 1 NOT NULL CHECK (estado IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints adicionales
    CONSTRAINT chk_cedula_format CHECK (cedula ~ '^[0-9]{9,20}$'),
    CONSTRAINT chk_correo_format CHECK (correo IS NULL OR correo ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_telefono_format CHECK (telefono ~ '^(\+?505\s?)?(\(?\d{1,4}\)?\s?)?[\d\s\-]{8,20}$' AND LENGTH(REGEXP_REPLACE(telefono, '[^0-9]', '', 'g')) >= 8)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_asociados_cedula ON asociados(cedula);
CREATE INDEX idx_asociados_estado ON asociados(estado);
CREATE INDEX idx_asociados_fecha_ingreso ON asociados(fecha_ingreso);
CREATE INDEX idx_asociados_nombre_completo ON asociados(nombre_completo);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_asociados_updated_at 
    BEFORE UPDATE ON asociados 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();