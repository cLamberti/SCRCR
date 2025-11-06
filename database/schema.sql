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

-- Crear tipo ENUM para estados de asistencia
CREATE TYPE estado_asistencia AS ENUM ('presente', 'ausente', 'justificado', 'tardanza');

-- Modificar tabla asistencias para incluir más estados
ALTER TABLE asistencias 
    DROP COLUMN IF EXISTS presente CASCADE;

ALTER TABLE asistencias 
    ADD COLUMN estado estado_asistencia DEFAULT 'presente' NOT NULL,
    ADD COLUMN hora_registro TIME DEFAULT CURRENT_TIME NOT NULL,
    ADD COLUMN justificacion TEXT;

-- Crear tabla de eventos
CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Crear tabla de asistencias
CREATE TABLE asistencias (
    id SERIAL PRIMARY KEY,
    asociado_id INTEGER NOT NULL REFERENCES asociados(id) ON DELETE CASCADE,
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado estado_asistencia DEFAULT 'presente' NOT NULL,
    hora_registro TIME DEFAULT CURRENT_TIME NOT NULL,
    justificacion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraint para evitar registros duplicados por evento
    UNIQUE(asociado_id, evento_id)
);

-- Crear tabla de reportes de asistencia
CREATE TABLE reportes_asistencia (
    id SERIAL PRIMARY KEY,
    asociado_id INTEGER NOT NULL REFERENCES asociados(id) ON DELETE CASCADE,
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    estado estado_asistencia NOT NULL,
    hora_registro TIME NOT NULL,
    observaciones TEXT,
    justificacion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Constraint para evitar duplicados
    UNIQUE(asociado_id, evento_id, fecha)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_eventos_fecha ON eventos(fecha);
CREATE INDEX idx_eventos_activo ON eventos(activo);
CREATE INDEX idx_asistencias_asociado_id ON asistencias(asociado_id);
CREATE INDEX idx_asistencias_evento_id ON asistencias(evento_id);
CREATE INDEX idx_asistencias_fecha_registro ON asistencias(fecha_registro);

-- Crear índices para reportes_asistencia
CREATE INDEX idx_reportes_asociado_id ON reportes_asistencia(asociado_id);
CREATE INDEX idx_reportes_evento_id ON reportes_asistencia(evento_id);
CREATE INDEX idx_reportes_fecha ON reportes_asistencia(fecha);
CREATE INDEX idx_reportes_estado ON reportes_asistencia(estado);
CREATE INDEX idx_reportes_fecha_estado ON reportes_asistencia(fecha, estado);

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_eventos_updated_at 
    BEFORE UPDATE ON eventos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asistencias_updated_at 
    BEFORE UPDATE ON asistencias 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reportes_asistencia_updated_at 
    BEFORE UPDATE ON reportes_asistencia 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Crear vista materializada para reportes consolidados
CREATE MATERIALIZED VIEW vista_reportes_asistencia AS
SELECT 
    r.id,
    r.asociado_id,
    a.nombre_completo AS asociado_nombre,
    a.cedula AS asociado_cedula,
    a.telefono AS asociado_telefono,
    a.ministerio AS asociado_ministerio,
    r.evento_id,
    e.nombre AS evento_nombre,
    e.descripcion AS evento_descripcion,
    e.fecha AS evento_fecha,
    e.hora AS evento_hora,
    r.fecha,
    r.estado,
    r.hora_registro,
    r.observaciones,
    r.justificacion,
    r.created_at,
    r.updated_at,
    -- Campos calculados
    CASE 
        WHEN r.estado = 'presente' THEN 1
        ELSE 0
    END AS presente_numerico,
    CASE 
        WHEN r.estado = 'ausente' THEN 1
        ELSE 0
    END AS ausente_numerico,
    CASE 
        WHEN r.estado = 'justificado' THEN 1
        ELSE 0
    END AS justificado_numerico
FROM reportes_asistencia r
INNER JOIN asociados a ON r.asociado_id = a.id
INNER JOIN eventos e ON r.evento_id = e.id
WHERE a.estado = 1; -- Solo asociados activos

-- Crear índices en la vista materializada
CREATE INDEX idx_vista_reportes_asociado ON vista_reportes_asistencia(asociado_id);
CREATE INDEX idx_vista_reportes_evento ON vista_reportes_asistencia(evento_id);
CREATE INDEX idx_vista_reportes_fecha ON vista_reportes_asistencia(fecha);
CREATE INDEX idx_vista_reportes_estado ON vista_reportes_asistencia(estado);

-- Función para refrescar la vista materializada
CREATE OR REPLACE FUNCTION refresh_vista_reportes_asistencia()
RETURNS void AS $
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY vista_reportes_asistencia;
END;
$ LANGUAGE plpgsql;

-- Función para sincronizar asistencias con reportes
CREATE OR REPLACE FUNCTION sync_asistencia_to_reporte()
RETURNS TRIGGER AS $
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO reportes_asistencia (
            asociado_id,
            evento_id,
            fecha,
            estado,
            hora_registro,
            observaciones,
            justificacion
        )
        SELECT 
            NEW.asociado_id,
            NEW.evento_id,
            COALESCE(e.fecha, CURRENT_DATE),
            NEW.estado,
            NEW.hora_registro,
            NEW.observaciones,
            NEW.justificacion
        FROM eventos e
        WHERE e.id = NEW.evento_id
        ON CONFLICT (asociado_id, evento_id, fecha) 
        DO UPDATE SET
            estado = EXCLUDED.estado,
            hora_registro = EXCLUDED.hora_registro,
            observaciones = EXCLUDED.observaciones,
            justificacion = EXCLUDED.justificacion,
            updated_at = CURRENT_TIMESTAMP;
            
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE reportes_asistencia
        SET 
            estado = NEW.estado,
            hora_registro = NEW.hora_registro,
            observaciones = NEW.observaciones,
            justificacion = NEW.justificacion,
            updated_at = CURRENT_TIMESTAMP
        WHERE asociado_id = NEW.asociado_id 
        AND evento_id = NEW.evento_id;
        
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM reportes_asistencia
        WHERE asociado_id = OLD.asociado_id 
        AND evento_id = OLD.evento_id;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Crear trigger para sincronización automática
CREATE TRIGGER sync_asistencia_reporte_trigger
    AFTER INSERT OR UPDATE OR DELETE ON asistencias
    FOR EACH ROW
    EXECUTE FUNCTION sync_asistencia_to_reporte();

-- Función para obtener estadísticas de asistencia por asociado
CREATE OR REPLACE FUNCTION get_estadisticas_asistencia(p_asociado_id INTEGER, p_fecha_inicio DATE DEFAULT NULL, p_fecha_fin DATE DEFAULT NULL)
RETURNS TABLE (
    total_eventos BIGINT,
    total_presentes BIGINT,
    total_ausentes BIGINT,
    total_justificados BIGINT,
    total_tardanzas BIGINT,
    porcentaje_asistencia NUMERIC
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_eventos,
        COUNT(*) FILTER (WHERE estado = 'presente') as total_presentes,
        COUNT(*) FILTER (WHERE estado = 'ausente') as total_ausentes,
        COUNT(*) FILTER (WHERE estado = 'justificado') as total_justificados,
        COUNT(*) FILTER (WHERE estado = 'tardanza') as total_tardanzas,
        ROUND(
            (COUNT(*) FILTER (WHERE estado = 'presente')::NUMERIC / 
            NULLIF(COUNT(*), 0) * 100), 
            2
        ) as porcentaje_asistencia
    FROM reportes_asistencia
    WHERE asociado_id = p_asociado_id
    AND (p_fecha_inicio IS NULL OR fecha >= p_fecha_inicio)
    AND (p_fecha_fin IS NULL OR fecha <= p_fecha_fin);
END;
$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de asistencia por evento
CREATE OR REPLACE FUNCTION get_estadisticas_evento(p_evento_id INTEGER)
RETURNS TABLE (
    total_registros BIGINT,
    total_presentes BIGINT,
    total_ausentes BIGINT,
    total_justificados BIGINT,
    total_tardanzas BIGINT,
    porcentaje_asistencia NUMERIC
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_registros,
        COUNT(*) FILTER (WHERE estado = 'presente') as total_presentes,
        COUNT(*) FILTER (WHERE estado = 'ausente') as total_ausentes,
        COUNT(*) FILTER (WHERE estado = 'justificado') as total_justificados,
        COUNT(*) FILTER (WHERE estado = 'tardanza') as total_tardanzas,
        ROUND(
            (COUNT(*) FILTER (WHERE estado = 'presente')::NUMERIC / 
            NULLIF(COUNT(*), 0) * 100), 
            2
        ) as porcentaje_asistencia
    FROM reportes_asistencia
    WHERE evento_id = p_evento_id;
END;
$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE eventos IS 'Eventos programados para registro de asistencia';
COMMENT ON TABLE asistencias IS 'Registro de asistencias de asociados a eventos específicos';
COMMENT ON COLUMN eventos.activo IS 'Indica si el evento está activo para registro de asistencias';
COMMENT ON COLUMN asistencias.presente IS 'Indica si el asociado estuvo presente en el evento';
COMMENT ON TABLE reportes_asistencia IS 'Tabla consolidada de reportes de asistencia con información detallada';
COMMENT ON COLUMN reportes_asistencia.estado IS 'Estado de la asistencia: presente, ausente, justificado, tardanza';
COMMENT ON COLUMN reportes_asistencia.hora_registro IS 'Hora en que se registró la asistencia';
COMMENT ON COLUMN reportes_asistencia.justificacion IS 'Justificación en caso de ausencia o tardanza';
COMMENT ON MATERIALIZED VIEW vista_reportes_asistencia IS 'Vista materializada con información consolidada de reportes de asistencia';
COMMENT ON FUNCTION sync_asistencia_to_reporte() IS 'Sincroniza automáticamente los registros de asistencias con reportes_asistencia';
COMMENT ON FUNCTION get_estadisticas_asistencia(INTEGER, DATE, DATE) IS 'Obtiene estadísticas de asistencia para un asociado específico';
COMMENT ON FUNCTION get_estadisticas_evento(INTEGER) IS 'Obtiene estadísticas de asistencia para un evento específico';

-- Datos de prueba para validación
-- Insertar eventos de prueba
INSERT INTO eventos (nombre, descripcion, fecha, hora, activo) VALUES
('Culto Dominical', 'Servicio dominical matutino', CURRENT_DATE, '10:00:00', true),
('Reunión de Oración', 'Reunión semanal de oración', CURRENT_DATE + INTERVAL '2 days', '19:00:00', true),
('Estudio Bíblico', 'Estudio bíblico semanal', CURRENT_DATE + INTERVAL '4 days', '18:30:00', true);

-- Insertar asistencias de prueba (esto automáticamente creará reportes)
-- Nota: Asume que ya existen asociados en la tabla
INSERT INTO asistencias (asociado_id, evento_id, estado, hora_registro, observaciones)
SELECT 
    a.id,
    1, -- ID del primer evento
    'presente',
    '10:05:00',
    'Llegó puntual'
FROM asociados a
WHERE a.estado = 1
LIMIT 5
ON CONFLICT (asociado_id, evento_id) DO NOTHING;

-- Validación: Consultar reportes creados
SELECT 
    r.id,
    r.asociado_id,
    a.nombre_completo,
    e.nombre as evento,
    r.fecha,
    r.estado,
    r.hora_registro
FROM reportes_asistencia r
JOIN asociados a ON r.asociado_id = a.id
JOIN eventos e ON r.evento_id = e.id
ORDER BY r.fecha DESC, r.hora_registro DESC
LIMIT 10;