
CREATE SCHEMA "public";
 (UNIQUE)
CREATE TYPE "estado_asistencia" AS ENUM('presente', 'ausente', 'justificado');

-- Descripción: Almacena información de la asistencia a los eventos que se realizan en la organización.
-- Propósito: Registro de asistencias de asociados a eventos.

CREATE TABLE "asistencias" (
    "id" serial PRIMARY KEY,
    "asociado_id" integer NOT NULL UNIQUE,
    "evento_id" integer NOT NULL UNIQUE,
    "fecha_registro" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "observaciones" text,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "estado" estado_asistencia DEFAULT 'Sin registrar' NOT NULL,
    "hora_registro" time DEFAULT CURRENT_TIME NOT NULL,
    "justificacion" text,
    -- Restriccion:
    CONSTRAINT "asistencias_asociado_id_evento_id_key" UNIQUE("asociado_id","evento_id")
);
-- Índices: Optimiza búsquedas por asociado, evento y fecha de registro
CREATE UNIQUE INDEX "asistencias_asociado_id_evento_id_key" ON "asistencias" ("asociado_id","evento_id");
CREATE UNIQUE INDEX "asistencias_pkey" ON "asistencias" ("id");
CREATE INDEX "idx_asistencias_asociado_id" ON "asistencias" ("asociado_id");
CREATE INDEX "idx_asistencias_evento_id" ON "asistencias" ("evento_id");
CREATE INDEX "idx_asistencias_fecha_registro" ON "asistencias" ("fecha_registro");

-- FKs
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_asociado_id_fkey" FOREIGN KEY ("asociado_id") REFERENCES "asociados"("id") ON DELETE CASCADE;
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE;

-- Descripción: Almacena información de los miembros/asociados de la organización.
-- Propósito: Mantener un registro centralizado de datos personales y de contacto.
-- Relaciones:
--   - Referenciada por: asistencias(asociado_id), reportes_asistencia(asociado_id)
-- Campos clave:
--   - cedula: Identificador único nacional (UNIQUE)
--   - estado: 1=activo, 0=inactivo (soft delete)
--   - fecha_ingreso: Fecha de incorporación a la organización.

CREATE TABLE "asociados" (
    "id" serial PRIMARY KEY,
    "nombre_completo" varchar(100) NOT NULL,
    "cedula" varchar(20) NOT NULL CONSTRAINT "asociados_cedula_key" UNIQUE,
    "correo" varchar(100),
    "telefono" varchar(20),
    "ministerio" varchar(50),
    "direccion" text,
    "fecha_ingreso" timestamp DEFAULT CURRENT_TIMESTAMP,
    "estado" smallint DEFAULT 1,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asociados_estado_check" CHECK (CHECK ((estado = ANY (ARRAY[0, 1]))))
);
-- Índices
CREATE UNIQUE INDEX "asociados_cedula_key" ON "asociados" ("cedula");
CREATE UNIQUE INDEX "asociados_pkey" ON "asociados" ("id");
CREATE INDEX "idx_asociados_cedula" ON "asociados" ("cedula");
CREATE INDEX "idx_asociados_estado" ON "asociados" ("estado");
CREATE INDEX "idx_asociados_nombre" ON "asociados" ("nombre_completo");

-- Descripción: Define los eventos/reuniones de la organización.
-- Propósito: Centralizar información de eventos para asociarlos con registros de asistencia.
-- Relaciones:
--   - Referenciada por: asistencias(evento_id), reportes_asistencia(evento_id)
--   - Cuando se elimina un evento, se eliminan en cascada sus registros de asistencia
-- Campos clave:
--   - fecha: Fecha del evento (permite filtrar eventos pasados/futuros)
--   - activo: Indica si el evento está vigente (true=activo, false=inactivo)

CREATE TABLE "eventos" (
    "id" serial PRIMARY KEY,
    "nombre" varchar(255) NOT NULL,
    "descripcion" text,
    "fecha" date NOT NULL,
    "hora" time NOT NULL,
    "activo" boolean DEFAULT true,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índices
CREATE UNIQUE INDEX "eventos_pkey" ON "eventos" ("id");
CREATE INDEX "idx_eventos_activo" ON "eventos" ("activo");
CREATE INDEX "idx_eventos_fecha" ON "eventos" ("fecha");

-- Descripción: Tabla de reportes consolidados de asistencia con información detallada.
-- Propósito: Mantener un registro histórico y detallado de asistencia por asociado/evento/fecha.
-- Relaciones:
--   - asociado_id (FK): Referencia a asociados(id) - Identifica al asociado
--   - evento_id (FK): Referencia a eventos(id) - Identifica el evento
--   - Restricción UNIQUE compuesta: (asociado_id, evento_id, fecha) - Evita duplicados
-- Campos clave:
--   - estado: Tipo ENUM (presente, ausente, justificado)
--   - justificacion: Razón de ausencia o justificación
--   - hora_registro: Hora exacta del registro de asistencia

-- Nota: Diferente de "asistencias" - este es un reporte más detallado y estructurado
CREATE TABLE "reportes_asistencia" (
    "id" serial PRIMARY KEY,
    "asociado_id" integer NOT NULL UNIQUE,
    "evento_id" integer NOT NULL UNIQUE,
    "fecha" date NOT NULL UNIQUE,
    "estado" estado_asistencia NOT NULL,
    "hora_registro" time,
    "observaciones" text,
    "justificacion" text,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reportes_asistencia_asociado_id_evento_id_fecha_key" UNIQUE("asociado_id","evento_id","fecha")
);
-- Índices
CREATE UNIQUE INDEX "reportes_asistencia_asociado_id_evento_id_fecha_key" ON "reportes_asistencia" ("asociado_id","evento_id","fecha");
CREATE UNIQUE INDEX "reportes_asistencia_pkey" ON "reportes_asistencia" ("id");
ALTER TABLE "reportes_asistencia" ADD CONSTRAINT "reportes_asistencia_asociado_id_fkey" FOREIGN KEY ("asociado_id") REFERENCES "asociados"("id") ON DELETE CASCADE;
ALTER TABLE "reportes_asistencia" ADD CONSTRAINT "reportes_asistencia_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE;

-- Descripción: Almacena credenciales y datos de acceso de usuarios del sistema.
-- Propósito: Gestionar autenticación, autorización y auditoría de acceso.
-- Relaciones:
--   - Tabla independiente (sin referencias externas)
--   - Usuarios pueden ser de diferentes roles con permisos distintos
-- Campos clave:
--   - username: Identificador único para login (UNIQUE, validado con regex)
--   - email: Correo electrónico único (UNIQUE, validado con regex)
--   - password_hash: Hash seguro de contraseña (nunca se almacena en texto plano)
--   - rol: Tipo de usuario (admin, tesorero, pastorGeneral) - Define permisos
--   - estado: 1=activo, 0=inactivo (soft delete)
--   - intentos_fallidos: Contador para bloqueo por intentos fallidos
--   - bloqueado_hasta: Timestamp de desbloqueo automático tras intentos fallidos
--   - ultimo_acceso: Auditoría de último login exitoso
-- Validaciones:
--   - Email: Formato RFC válido
--   - Username: Solo alfanuméricos y guion bajo, 3-50 caracteres
--   - Rol: Solo valores permitidos (admin, tesorero, pastorGeneral)
--   - Intentos fallidos: No puede ser negativo
CREATE TABLE "usuarios" (
    "id" serial PRIMARY KEY,
    "username" varchar(50) NOT NULL CONSTRAINT "usuarios_username_key" UNIQUE,
    "email" varchar(255) NOT NULL CONSTRAINT "usuarios_email_key" UNIQUE,
    "password_hash" varchar(255) NOT NULL,
    "nombre_completo" varchar(255) NOT NULL,
    "rol" varchar(20) DEFAULT 'tesorero' NOT NULL,
    "estado" integer DEFAULT 1 NOT NULL,
    "ultimo_acceso" timestamp,
    "intentos_fallidos" integer DEFAULT 0 NOT NULL,
    "bloqueado_hasta" timestamp,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "chk_usuarios_email_format" CHECK (CHECK (((email)::text ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}::text))),
    CONSTRAINT "chk_usuarios_intentos_fallidos" CHECK (CHECK ((intentos_fallidos >= 0))),
    CONSTRAINT "chk_usuarios_rol_values" CHECK (CHECK (((rol)::text = ANY ((ARRAY['admin'::character varying, 'tesorero'::character varying, 'pastorGeneral'::character varying])::text[])))),
    CONSTRAINT "chk_usuarios_username_format" CHECK (CHECK (((username)::text ~ '^[a-zA-Z0-9_]{3,50}::text))),
    CONSTRAINT "usuarios_estado_check" CHECK (CHECK ((estado = ANY (ARRAY[0, 1]))))
);

CREATE INDEX "idx_usuarios_email" ON "usuarios" ("email");
CREATE INDEX "idx_usuarios_estado" ON "usuarios" ("estado");
CREATE INDEX "idx_usuarios_rol" ON "usuarios" ("rol");
CREATE INDEX "idx_usuarios_username" ON "usuarios" ("username");
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios" ("email");
CREATE UNIQUE INDEX "usuarios_pkey" ON "usuarios" ("id");
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios" ("username");
