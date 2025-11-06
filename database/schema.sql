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
    CONSTRAINT chk_cedula_format CHECK (cedula ~ '^[0-9]{9,20}),
    CONSTRAINT chk_correo_format CHECK (correo IS NULL OR correo ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}),
    CONSTRAINT chk_telefono_format CHECK (telefono ~ '^(\+?505\s?)?(\(?\d{1,4}\)?\s?)?[\d\s\-]{8,20} AND LENGTH(REGEXP_REPLACE(telefono, '[^0-9]', '', 'g')) >= 8)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_asociados_cedula ON asociados(cedula);
CREATE INDEX idx_asociados_estado ON asociados(estado);
CREATE INDEX idx_asociados_fecha_ingreso ON asociados(fecha_ingreso);
CREATE INDEX idx_asociados_nombre_completo ON asociados(nombre_completo);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_asociados_updated_at 
    BEFORE UPDATE ON asociados 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Tabla de usuarios para autenticación
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'usuario' NOT NULL CHECK (rol IN ('admin', 'tesorero', 'pastorGeneral')),
    estado INTEGER DEFAULT 1 NOT NULL CHECK (estado IN (0, 1)),
    ultimo_acceso TIMESTAMP,
    intentos_fallidos INTEGER DEFAULT 0 NOT NULL,
    bloqueado_hasta TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints adicionales
    CONSTRAINT chk_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,50}),
    CONSTRAINT chk_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}),
    CONSTRAINT chk_password_length CHECK (LENGTH(password_hash) >= 60)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- Tabla para Reportes de Asistencia (Denormalizada)
-- =================================================================
CREATE TABLE IF NOT EXISTS reportes_asistencia (
    id SERIAL PRIMARY KEY,
    asociado_id INTEGER NOT NULL REFERENCES asociados(id) ON DELETE CASCADE,
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    estado estado_asistencia NOT NULL,
    hora_registro TIME,
    observaciones TEXT,
    justificacion TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    -- Restricción única para manejar ON CONFLICT
    UNIQUE (asociado_id, evento_id, fecha)
);

-- Usuario administrador por defecto (password: admin123)
-- IMPORTANTE: Cambiar esta contraseña en producción
INSERT INTO usuarios (username, email, password_hash, nombre_completo, rol)
VALUES ('admin', 'admin@iglesia.com', '$2a$10$rQ3qKx5o5Z5Z5Z5Z5Z5Z5uXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX', 'Administrador del Sistema', 'admin');