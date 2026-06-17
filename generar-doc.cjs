const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType, UnderlineType,
} = require('docx');
const fs = require('fs');

const AZUL = '003366';
const AZUL_CLARO = 'E8EFF7';
const GRIS = 'F5F5F5';
const NEGRO = '1A1A1A';

function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, color: AZUL, size: 32 })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, color: AZUL, size: 26 })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, color: NEGRO, size: 22 })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 20, color: NEGRO, ...opts })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 20, color: NEGRO })],
  });
}

function bold(text) {
  return new TextRun({ text, bold: true, size: 20, color: NEGRO });
}

function separator() {
  return new Paragraph({
    border: { bottom: { color: AZUL, space: 1, value: BorderStyle.SINGLE, size: 6 } },
    spacing: { before: 200, after: 200 },
    children: [],
  });
}

function tableRow(cells, isHeader = false) {
  return new TableRow({
    children: cells.map(cell =>
      new TableCell({
        shading: isHeader ? { type: ShadingType.CLEAR, color: AZUL, fill: AZUL } : { type: ShadingType.CLEAR, fill: 'FFFFFF' },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: cell, bold: isHeader, color: isHeader ? 'FFFFFF' : NEGRO, size: 18 })],
          }),
        ],
      })
    ),
  });
}

function makeTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow(headers, true),
      ...rows.map(r => tableRow(r, false)),
    ],
  });
}

const doc = new Document({
  creator: 'Sistema SCRCR',
  title: 'Documentación del Sistema SCRCR',
  description: 'Estado actual del proyecto, arquitectura y módulos',
  sections: [
    {
      children: [

        // ── PORTADA ──────────────────────────────────────────────────────────
        new Paragraph({ spacing: { before: 1200 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'SISTEMA SCRCR', bold: true, size: 52, color: AZUL })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: 'Sistema de Control y Registro de', size: 28, color: '555555' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: 'Congregados y Recursos', size: 28, color: '555555' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [new TextRun({ text: 'Iglesia Bíblica Emanuel — Liberia', size: 24, italics: true, color: '777777' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: 'Documentación Técnica del Sistema', size: 22, color: '777777' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: `Fecha: ${new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })}`, size: 20, color: '999999' })],
        }),
        new Paragraph({ pageBreakBefore: true }),

        // ── 1. DESCRIPCIÓN GENERAL ───────────────────────────────────────────
        h1('1. Descripción General del Proyecto'),
        separator(),
        p('SCRCR es una aplicación web desarrollada para la Iglesia Bíblica Emanuel de Liberia. Su propósito es digitalizar y centralizar la gestión de los miembros de la iglesia, el control de asistencia, la administración de personal, permisos, actas y reportes.'),
        p(''),
        p('El sistema permite administrar dos tipos de miembros: asociados (miembros formales con derechos plenos) y congregados (miembros regulares de la congregación). Además gestiona el personal administrativo, los eventos de la iglesia, las actas de asambleas, la planilla de empleados y los permisos de ausencia.'),

        new Paragraph({ spacing: { before: 200, after: 100 } }),
        h3('Tecnologías Principales'),
        makeTable(
          ['Tecnología', 'Versión', 'Uso'],
          [
            ['Next.js', '15.x', 'Framework fullstack con App Router'],
            ['TypeScript', '5.x', 'Tipado estático en todo el proyecto'],
            ['PostgreSQL', 'Neon (Serverless)', 'Base de datos principal'],
            ['Prisma ORM', '7.8', 'Acceso a BD con type-safety'],
            ['Tailwind CSS', '4.x', 'Estilos y diseño responsivo'],
            ['JWT + bcryptjs', '—', 'Autenticación y hash de contraseñas'],
            ['jose', '6.x', 'Firma y verificación de tokens JWT'],
            ['Zod', '4.x', 'Validación de esquemas'],
            ['SweetAlert2', '11.x', 'Alertas y confirmaciones UI'],
            ['React Icons', '5.x', 'Iconografía'],
            ['jsPDF + ExcelJS', '—', 'Exportación de reportes PDF/Excel'],
            ['Vercel Blob', '—', 'Almacenamiento de documentos'],
          ]
        ),

        new Paragraph({ pageBreakBefore: true }),

        // ── 2. ARQUITECTURA ──────────────────────────────────────────────────
        h1('2. Arquitectura del Sistema'),
        separator(),
        p('El sistema implementa una arquitectura en capas derivada del patrón MVC (Model-View-Controller), adaptada al contexto de Next.js con App Router. Se aplica el patrón DAO (Data Access Object) para aislar la lógica de acceso a datos, y DTOs (Data Transfer Objects) para desacoplar las capas.'),

        new Paragraph({ spacing: { before: 200, after: 100 } }),
        h3('Capas del Sistema'),
        makeTable(
          ['Capa', 'Ubicación', 'Responsabilidad'],
          [
            ['Presentación (View)', 'src/app/*/page.tsx', 'Componentes React del lado del cliente (UI, formularios, tablas)'],
            ['Controlador (Controller)', 'src/app/api/*/route.ts', 'API Routes de Next.js que reciben peticiones HTTP y retornan JSON'],
            ['Servicio (Service)', 'src/services/*.service.ts', 'Lógica de negocio: validación, transformación y orquestación'],
            ['DAO (Data Access Object)', 'src/dao/*.dao.ts', 'Acceso a base de datos mediante Prisma. Una clase por entidad'],
            ['Modelo (Model)', 'src/models/*.ts', 'Interfaces TypeScript que representan las entidades del dominio'],
            ['DTO', 'src/dto/*.dto.ts', 'Objetos de transferencia para entrada (Request) y salida (Response)'],
            ['Validadores', 'src/validators/*.validator.ts', 'Reglas de validación de datos de entrada'],
            ['ORM', 'prisma/schema.prisma', 'Definición del esquema de BD y modelos Prisma'],
            ['Middleware', 'src/middleware.ts', 'Autenticación y autorización en el Edge de Next.js'],
            ['Utilidades', 'src/lib/ y src/utils/', 'Auth JWT, conexión Prisma, exportación CSV, permisos de roles'],
          ]
        ),

        new Paragraph({ spacing: { before: 300, after: 100 } }),
        h3('Flujo de una Petición'),
        bullet('1. El usuario interactúa con la UI (page.tsx) — componente React cliente'),
        bullet('2. Se realiza una petición fetch() a una API Route (/api/*)'),
        bullet('3. El Middleware verifica el JWT antes de llegar al controlador'),
        bullet('4. La API Route (Controller) parsea el body y llama al Service correspondiente'),
        bullet('5. El Service valida los datos, aplica la lógica de negocio y llama al DAO'),
        bullet('6. El DAO ejecuta la consulta en PostgreSQL a través de Prisma'),
        bullet('7. El resultado sube por las capas como DTO/Response y se retorna como JSON'),

        new Paragraph({ spacing: { before: 300, after: 100 } }),
        h3('Patrones de Diseño Aplicados'),
        makeTable(
          ['Patrón', 'Dónde se aplica'],
          [
            ['DAO (Data Access Object)', 'Cada entidad tiene su propio DAO que encapsula todas las consultas a BD'],
            ['DTO (Data Transfer Object)', 'DTOs separados para Request y Response desacoplan el modelo interno de la API'],
            ['Singleton', 'PrismaClient y DatabaseConnection se instancian una sola vez'],
            ['Factory / Builder', 'AsociadoModel, CongregadoModel construyen entidades desde datos crudos'],
            ['Repository (implícito)', 'Los DAOs actúan como repositorios sobre las entidades Prisma'],
            ['Service Layer', 'Toda la lógica de negocio está aislada en servicios, los controllers son delgados'],
            ['Middleware Chain', 'El Edge Middleware de Next.js intercepta y evalúa cada petición'],
            ['Soft Delete', 'Los registros se marcan con estado=0 en lugar de eliminarse físicamente'],
          ]
        ),

        new Paragraph({ pageBreakBefore: true }),

        // ── 3. MÓDULOS FRONTEND ──────────────────────────────────────────────
        h1('3. Módulos del Frontend'),
        separator(),
        p('Todas las páginas usan el App Router de Next.js. Las páginas con "use client" manejan estado local y efectos del lado del cliente. El layout global incluye el Sidebar y la Navbar.'),

        new Paragraph({ spacing: { before: 200, after: 100 } }),
        makeTable(
          ['Módulo / Ruta', 'Descripción', 'Acceso'],
          [
            ['/ (Inicio)', 'Dashboard principal con accesos rápidos a módulos según el rol del usuario', 'Público'],
            ['/login', 'Formulario de autenticación con manejo de errores y bloqueo de cuenta', 'Solo no autenticados'],
            ['/consulta-asociados', 'Gestión completa de asociados: listado, búsqueda, creación, edición, eliminación, exportación Excel/PDF', 'Admin / Pastor General'],
            ['/congregados', 'Gestión de congregados con filtros avanzados, paginación, subida de documentos y fotos', 'Admin / Tesorero / Pastor'],
            ['/eventos', 'Alta, edición y desactivación de eventos de la iglesia. Vinculados a asistencia y actas', 'Protegida'],
            ['/asistencia/registro', 'Registro de asistencia individual o masiva a eventos, por asociado/congregado', 'Protegida'],
            ['/reportes', 'Reportes de asistencia filtrados por evento, fecha, estado. Exportación Excel/PDF', 'Protegida'],
            ['/actas', 'Registro de sesiones y actas de asamblea de asociados y junta directiva, con lista de asistentes', 'Protegida'],
            ['/permisos', 'Solicitud y gestión de permisos/ausencias con validación de traslapes de fechas', 'Protegida'],
            ['/permisos/registro', 'Formulario para solicitar nuevos permisos de ausencia', 'Protegida'],
            ['/planilla', 'Gestión de empleados, salarios, vacaciones y permisos de personal administrativo', 'Protegida'],
            ['/historial', 'Tabla de auditoría con todos los cambios realizados en el sistema', 'Protegida'],
            ['/gestion-usuarios', 'Alta, edición y desactivación de usuarios del sistema (solo admin)', 'Solo admin'],
            ['/gestion-roles', 'Configuración dinámica de permisos por rol y módulo (solo admin)', 'Solo admin'],
            ['/configuracion', 'Configuración general del sistema y preferencias', 'Admin / Pastor / Tesorero'],
            ['/unauthorized', 'Página de acceso denegado cuando el rol no tiene permiso', 'Pública'],
          ]
        ),

        new Paragraph({ spacing: { before: 300, after: 100 } }),
        h3('Componentes Reutilizables'),
        makeTable(
          ['Componente', 'Descripción'],
          [
            ['SideBar.tsx', 'Menú lateral responsivo con navegación dinámica según el rol. En mobile colapsa con hamburguesa'],
            ['Navbar.tsx', 'Barra superior con logo, nombre de usuario, rol, y botón de logout'],
            ['ProtectedRoute.tsx', 'HOC que verifica autenticación y redirige si el usuario no está logueado'],
            ['ToastProvider.tsx', 'Proveedor de notificaciones emergentes (react-hot-toast)'],
            ['AccessibilityWidget.tsx', 'Widget flotante con opciones de zoom, contraste y accesibilidad'],
          ]
        ),

        new Paragraph({ pageBreakBefore: true }),

        // ── 4. MÓDULOS BACKEND / API ─────────────────────────────────────────
        h1('4. API REST — Endpoints del Backend'),
        separator(),

        h3('Autenticación (/api/auth)'),
        makeTable(
          ['Método', 'Ruta', 'Descripción'],
          [
            ['POST', '/api/auth/login', 'Valida credenciales, genera JWT de 24h y lo guarda en cookie HttpOnly. Bloquea tras 5 intentos fallidos por 30 minutos'],
            ['POST', '/api/auth/logout', 'Elimina la cookie auth-token y cierra la sesión'],
            ['GET', '/api/auth/me', 'Retorna los datos del usuario autenticado actualmente'],
            ['GET', '/api/auth/verify', 'Verifica si el token es válido y no ha expirado'],
            ['GET', '/api/auth/verify-role', 'Valida que el token tenga el rol requerido'],
          ]
        ),

        new Paragraph({ spacing: { before: 200 } }),
        h3('Asociados (/api/asociados)'),
        makeTable(
          ['Método', 'Ruta', 'Descripción'],
          [
            ['GET', '/api/asociados', 'Lista todos los asociados sin paginación'],
            ['POST', '/api/asociados', 'Crea un nuevo asociado con validación completa'],
            ['GET', '/api/asociados/[id]', 'Obtiene un asociado por ID con todos sus campos'],
            ['PUT', '/api/asociados/update?id=X', 'Actualiza campos de un asociado existente'],
            ['DELETE', '/api/asociados/delete?id=X', 'Soft delete (estado=0) o hard delete permanente'],
            ['GET', '/api/asociados/consulta', 'Búsqueda con filtros (nombre, cédula) y paginación'],
          ]
        ),

        new Paragraph({ spacing: { before: 200 } }),
        h3('Congregados (/api/congregados)'),
        makeTable(
          ['Método', 'Ruta', 'Descripción'],
          [
            ['GET', '/api/congregados', 'Lista congregados con filtros y paginación'],
            ['POST', '/api/congregados', 'Crea congregado con documentos asociados'],
            ['GET', '/api/congregados/[id]', 'Obtiene congregado por ID'],
            ['PUT', '/api/congregados/[id]', 'Actualiza datos y documentos del congregado'],
            ['DELETE', '/api/congregados/[id]', 'Elimina o desactiva el congregado'],
          ]
        ),

        new Paragraph({ spacing: { before: 200 } }),
        h3('Eventos, Asistencia y Reportes'),
        makeTable(
          ['Método', 'Ruta', 'Descripción'],
          [
            ['GET/POST', '/api/eventos', 'Listar y crear eventos'],
            ['GET/PUT/DELETE', '/api/eventos/[id]', 'Operaciones CRUD sobre evento específico'],
            ['POST', '/api/asistencia/registro', 'Registra asistencia individual a un evento'],
            ['GET/POST', '/api/reporte-asistencia', 'Crear y consultar reportes de asistencia con estado'],
            ['GET', '/api/reportes/asistencia', 'Reportes con filtros (evento, fecha, estado)'],
            ['GET', '/api/reportes/asistencia/export', 'Exporta reporte en CSV o Excel'],
          ]
        ),

        new Paragraph({ spacing: { before: 200 } }),
        h3('Usuarios y Permisos'),
        makeTable(
          ['Método', 'Ruta', 'Descripción'],
          [
            ['GET/POST', '/api/usuarios', 'Listar y crear usuarios del sistema'],
            ['GET/PUT/DELETE', '/api/usuarios/[id]', 'CRUD sobre usuario específico'],
            ['GET/POST', '/api/permisos', 'Solicitar y listar permisos de ausencia'],
            ['PUT', '/api/permisos/[id]/estado', 'Aprobar o rechazar una solicitud de permiso'],
            ['GET', '/api/permisos/traslape', 'Verifica si un rango de fechas traslapa con otro permiso'],
          ]
        ),

        new Paragraph({ spacing: { before: 200 } }),
        h3('Actas, Empleados y Otros'),
        makeTable(
          ['Método', 'Ruta', 'Descripción'],
          [
            ['GET/POST', '/api/actas/asociacion', 'CRUD de actas de asamblea de asociados'],
            ['POST', '/api/actas/asociacion/[id]/asistencia', 'Registra asistencia a un acta específica'],
            ['GET/POST', '/api/actas/jd', 'CRUD de actas de junta directiva'],
            ['GET/POST', '/api/empleados', 'Gestión de empleados con planilla y vacaciones'],
            ['GET/POST', '/api/empleados/vacaciones', 'Solicitudes de vacaciones de empleados'],
            ['POST', '/api/documentos/upload', 'Subida de documentos al almacenamiento (Vercel Blob)'],
            ['GET', '/api/blob-download', 'Descarga de archivos desde Vercel Blob'],
            ['GET/POST', '/api/historial', 'Registro de auditoría de cambios en el sistema'],
            ['GET/POST', '/api/roles-config', 'Configuración de permisos por rol en BD'],
          ]
        ),

        new Paragraph({ pageBreakBefore: true }),

        // ── 5. BASE DE DATOS ─────────────────────────────────────────────────
        h1('5. Modelo de Base de Datos'),
        separator(),
        p('La base de datos está hospedada en Neon (PostgreSQL serverless). El acceso se realiza exclusivamente a través de Prisma ORM con el adaptador @prisma/adapter-neon para conexiones serverless.'),

        new Paragraph({ spacing: { before: 200, after: 100 } }),
        h3('Tablas Principales'),
        makeTable(
          ['Tabla', 'Descripción', 'Campos Clave'],
          [
            ['usuarios', 'Cuentas de acceso al sistema', 'username, email, passwordHash, rol, intentosFallidos, bloqueadoHasta'],
            ['asociados', 'Miembros formales de la asociación', 'cedula, fechaIngreso, estadoCivil, perteneceJuntaDirectiva, puestoJuntaDirectiva, urlCedula, urlCartaSolicitud'],
            ['congregados', 'Miembros regulares de la congregación', 'cedula, ministerio, estadoCivil, urlFotoCedula'],
            ['empleados', 'Personal administrativo con planilla', 'cedula, puesto, salarioBase, cuentaBancaria, diasVacacionesDisponibles'],
            ['eventos', 'Actividades y reuniones de la iglesia', 'nombre, fecha, hora, activo'],
            ['asistencias', 'Registro de asistencia por asociado/evento', 'asociadoId, eventoId — UNIQUE(asociadoId, eventoId)'],
            ['reportes_asistencia', 'Reporte consolidado con estado', 'asociadoId, eventoId, fecha, estado (enum), justificacion'],
            ['permisos', 'Solicitudes de ausencia del personal', 'usuarioId, fechaInicio, fechaFin, estado (PENDIENTE/APROBADO/RECHAZADO)'],
            ['actas_asociacion', 'Actas de asamblea de asociados', 'fecha, tipoSesion, urlActa'],
            ['asistencias_acta_asociacion', 'Asistencia por acta y asociado', 'actaId, asociadoId, estado, justificacion'],
            ['actas_junta_directiva', 'Actas de junta directiva', 'fecha, tipoSesion, urlActa'],
            ['vacaciones_empleado', 'Solicitudes de vacaciones', 'empleadoId, fechaInicio, fechaFin, cantidadDias, estado'],
            ['permisos_empleado', 'Permisos de ausencia de empleados', 'empleadoId, fechaInicio, fechaFin, estado'],
            ['permisos_rol', 'Control de acceso por rol y módulo', 'rol, modulo, activo'],
            ['auditoria', 'Historial de cambios en el sistema', 'tabla, registroId, accion, detalles, fecha'],
          ]
        ),

        new Paragraph({ spacing: { before: 300, after: 100 } }),
        h3('Enum EstadoAsistencia'),
        bullet('presente — El miembro estuvo en el evento'),
        bullet('ausente — No se presentó sin justificación'),
        bullet('justificado — No asistió pero con justificación registrada'),

        new Paragraph({ spacing: { before: 200, after: 100 } }),
        h3('Estrategia de Eliminación'),
        bullet('Soft Delete: Los asociados y congregados se marcan con estado = 0 (inactivo) y se excluyen de las búsquedas por defecto'),
        bullet('Hard Delete: Opción disponible para eliminar registros permanentemente de la BD'),
        bullet('Cascade: Las asistencias y reportes se eliminan en cascada cuando se elimina el asociado/evento padre'),

        new Paragraph({ pageBreakBefore: true }),

        // ── 6. AUTENTICACIÓN Y SEGURIDAD ─────────────────────────────────────
        h1('6. Autenticación y Seguridad'),
        separator(),

        h3('Flujo de Autenticación'),
        bullet('1. El usuario ingresa username y password en /login'),
        bullet('2. El backend verifica la contraseña con bcryptjs (hash bcrypt, salt 10)'),
        bullet('3. Si es correcta: se genera un JWT firmado con HS256 y JWT_SECRET (24h de validez)'),
        bullet('4. El token se guarda en una cookie HttpOnly, Secure, SameSite: Lax'),
        bullet('5. En cada petición el Middleware Edge verifica el token antes de llegar al controlador'),
        bullet('6. Si el token es inválido o expiró: se limpia la cookie y se redirige al login'),

        new Paragraph({ spacing: { before: 200, after: 100 } }),
        h3('Mecanismo de Bloqueo de Cuenta'),
        bullet('Después de 5 intentos fallidos consecutivos, la cuenta queda bloqueada durante 30 minutos'),
        bullet('El campo bloqueadoHasta en la tabla usuarios almacena el timestamp de desbloqueo'),
        bullet('Al login exitoso se resetean los intentos fallidos a 0'),

        new Paragraph({ spacing: { before: 200, after: 100 } }),
        h3('Roles del Sistema'),
        makeTable(
          ['Rol', 'Etiqueta', 'Acceso'],
          [
            ['admin', 'Administrador', 'Acceso total: usuarios, roles, todas las secciones'],
            ['pastorGeneral', 'Pastor General', 'Asociados, congregados, eventos, reportes, actas, permisos, configuración'],
            ['juntaDirectiva', 'Junta Directiva', 'Consulta de asociados, reportes y actas'],
            ['asistenteAdministrativo', 'Asistente Administrativo', 'Congregados, usuarios, eventos, permisos, asistencia, reportes'],
            ['tesorero', 'Tesorero', 'Congregados, reportes y configuración'],
          ]
        ),

        new Paragraph({ spacing: { before: 200, after: 100 } }),
        h3('Control de Acceso en 3 Niveles'),
        bullet('Nivel 1 — Edge Middleware: Verifica JWT y redirige según rol antes de servir la página'),
        bullet('Nivel 2 — Frontend (useAuth hook): Filtra el menú del Sidebar mostrando solo módulos permitidos por rol'),
        bullet('Nivel 3 — API Routes: Valida token en cada endpoint y aplica lógica específica de permisos'),

        new Paragraph({ pageBreakBefore: true }),

        // ── 7. SERVICIOS CLAVE ───────────────────────────────────────────────
        h1('7. Servicios y Lógica de Negocio'),
        separator(),

        h3('UsuarioService'),
        p('Gestiona la autenticación: valida credenciales, genera tokens, maneja bloqueos y registra el último acceso. Usa bcryptjs para verificar contraseñas hasheadas.'),

        h3('AsociadoService'),
        p('Controla el ciclo de vida completo de los asociados: creación con validación, actualización, soft delete y hard delete. Valida y sanitiza datos antes de persistirlos. Mapea el modelo interno al DTO de respuesta, incluyendo todos los campos de documentos y junta directiva.'),

        h3('CongregadoService'),
        p('Análogo al AsociadoService pero para congregados. Gestiona documentos de identidad (foto de cédula) y campos adicionales como segundo ministerio, segundo teléfono, fecha de nacimiento y profesión.'),

        h3('PermisoService'),
        p('Verifica que no haya traslape de fechas con permisos existentes (PENDIENTE o APROBADO) del mismo usuario antes de crear una nueva solicitud. Permite aprobar o rechazar permisos con observaciones.'),

        h3('AsistenciaService / ReporteAsistenciaService'),
        p('El servicio de asistencia valida que el asociado exista y previene registros duplicados por evento/asociado/fecha. El reporte usa UPSERT para actualizar el estado si ya existe el registro, en lugar de duplicarlo.'),

        new Paragraph({ pageBreakBefore: true }),

        // ── 8. ESTADO ACTUAL ─────────────────────────────────────────────────
        h1('8. Estado Actual del Proyecto'),
        separator(),

        h3('Funcionalidades Implementadas'),
        makeTable(
          ['Módulo', 'Estado'],
          [
            ['Autenticación (login, logout, JWT, bloqueo de cuenta)', '✅ Completo'],
            ['Gestión de Usuarios (CRUD completo)', '✅ Completo'],
            ['Gestión de Roles y Permisos (configuración dinámica)', '✅ Completo'],
            ['Gestión de Asociados (CRUD, documentos, junta directiva)', '✅ Completo'],
            ['Gestión de Congregados (CRUD, documentos, filtros)', '✅ Completo'],
            ['Gestión de Eventos (CRUD, activar/desactivar)', '✅ Completo'],
            ['Registro de Asistencia (individual y masivo)', '✅ Completo'],
            ['Reportes de Asistencia (con exportación Excel/PDF)', '✅ Completo'],
            ['Actas de Asamblea y Junta Directiva', '✅ Completo'],
            ['Solicitud y Aprobación de Permisos (con validación de traslapes)', '✅ Completo'],
            ['Planilla de Empleados (salarios, vacaciones, permisos)', '✅ Completo'],
            ['Historial de Auditoría', '✅ Completo'],
            ['Migración a Prisma ORM 7', '✅ Completo'],
            ['Subida de Documentos (Vercel Blob)', '✅ Completo'],
            ['Middleware de autenticación Edge', '✅ Completo'],
            ['Widget de Accesibilidad', '✅ Completo'],
          ]
        ),

        new Paragraph({ spacing: { before: 200, after: 100 } }),
        h3('Pendiente / En Progreso'),
        bullet('Aplicar migración de BD para los nuevos campos de asociados (npx prisma db push)'),
        bullet('Formulario de Registro de Asociados con campos extendidos (en revisión)'),
        bullet('Módulo de recuperación de contraseña (/recuperar-password)'),
        bullet('Página de Historial (/historial) con filtros avanzados'),

        new Paragraph({ pageBreakBefore: true }),

        // ── 9. ESTRUCTURA DE CARPETAS ────────────────────────────────────────
        h1('9. Estructura de Carpetas'),
        separator(),
        makeTable(
          ['Carpeta / Archivo', 'Descripción'],
          [
            ['src/app/', 'Páginas y API Routes (Next.js App Router)'],
            ['src/app/api/', 'Endpoints REST organizados por dominio'],
            ['src/components/', 'Componentes React reutilizables (Sidebar, Navbar, etc.)'],
            ['src/contexts/', 'Contextos React (AuthContext)'],
            ['src/dao/', 'Data Access Objects — consultas Prisma por entidad'],
            ['src/dto/', 'Data Transfer Objects para request y response'],
            ['src/hooks/', 'Hooks personalizados (useAuth)'],
            ['src/lib/', 'Utilidades globales: auth.ts (JWT), prisma.ts (cliente), db.ts'],
            ['src/middleware.ts', 'Middleware Edge de Next.js (autenticación global)'],
            ['src/models/', 'Interfaces y clases TypeScript del dominio'],
            ['src/services/', 'Lógica de negocio por dominio'],
            ['src/utils/', 'Funciones auxiliares (exportación CSV, permisos de roles)'],
            ['src/validators/', 'Validadores de datos de entrada'],
            ['prisma/schema.prisma', 'Esquema de BD: modelos, relaciones y enums'],
            ['prisma.config.ts', 'Configuración de Prisma 7 (URL de conexión)'],
            ['database/schema.sql', 'SQL original de referencia del esquema'],
            ['.env.local', 'Variables de entorno (POSTGRES_URL, JWT_SECRET)'],
          ]
        ),

        new Paragraph({ spacing: { before: 400 } }),
        separator(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: 'Sistema SCRCR — Iglesia Bíblica Emanuel, Liberia', size: 18, italics: true, color: '999999' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `Documento generado el ${new Date().toLocaleDateString('es-CR')}`, size: 16, color: 'BBBBBB' })],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/home/user/SCRCR/documentacion-scrcr.docx', buffer);
  console.log('✅ Documento generado: documentacion-scrcr.docx');
});
