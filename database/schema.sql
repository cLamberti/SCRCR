-- Crear tabla de usuarios si no existe
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'tesorero',
    estado INTEGER DEFAULT 1 NOT NULL CHECK (estado IN (0, 1)),
    ultimo_acceso TIMESTAMP NULL,
    intentos_fallidos INTEGER DEFAULT 0 NOT NULL,
    bloqueado_hasta TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraints adicionales
    CONSTRAINT chk_usuarios_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,50}$'),
    CONSTRAINT chk_usuarios_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_usuarios_rol_values CHECK (rol IN ('admin', 'tesorero', 'pastorGeneral')),
    CONSTRAINT chk_usuarios_intentos_fallidos CHECK (intentos_fallidos >= 0)
);

-- Crear índices para la tabla usuarios si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_usuarios_username') THEN
        CREATE INDEX idx_usuarios_username ON usuarios(username);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_usuarios_email') THEN
        CREATE INDEX idx_usuarios_email ON usuarios(email);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_usuarios_estado') THEN
        CREATE INDEX idx_usuarios_estado ON usuarios(estado);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_usuarios_rol') THEN
        CREATE INDEX idx_usuarios_rol ON usuarios(rol);
    END IF;
END
$$;

-- Crear trigger para usuarios si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_usuarios_updated_at'
    ) THEN
        CREATE TRIGGER update_usuarios_updated_at 
            BEFORE UPDATE ON usuarios 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Insertar usuario administrador por defecto si no existe
-- Hash generado con bcrypt, 12 rounds para password: admin123
INSERT INTO usuarios (username, email, password_hash, nombre_completo, rol) 
VALUES ('admin', 'admin@scrcr.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewTN5aVQYxQvZNh2', 'Administrador del Sistema', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Mantener el resto de la tabla asociados como estaba antes

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