const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType,
} = require('docx');
const fs = require('fs');

const AZUL        = '1F4E79';
const AZUL_HEADER = '2E75B6';
const GRIS_FILA   = 'F2F2F2';
const NEGRO       = '1A1A1A';
const BLANCO      = 'FFFFFF';

const BORDE = { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA' };

// ── helpers de texto ─────────────────────────────────────────────────────────

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 240 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: AZUL } },
    children: [new TextRun({ text, bold: true, color: AZUL, size: 34, font: 'Calibri' })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, color: AZUL_HEADER, size: 24, font: 'Calibri' })],
  });
}

function p(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 20, color: NEGRO, font: 'Calibri' })],
  });
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 20, color: NEGRO, font: 'Calibri' })],
  });
}

function gap(before = 120) {
  return new Paragraph({ spacing: { before, after: 0 }, children: [] });
}

// ── tablas (porcentajes puros en todo) ───────────────────────────────────────
// colPcts: array de enteros que suman 100 (porcentaje por columna).
// Si se omite, las columnas se distribuyen de forma equitativa.

function makeTable(headers, rows, colPcts) {
  const n = headers.length;
  const pcts = colPcts || headers.map(() => Math.round(100 / n));

  function cell(text, isHeader, odd) {
    return new TableCell({
      width: { size: pcts[headers.indexOf ? 0 : 0], type: WidthType.PERCENTAGE },
      shading: {
        type: ShadingType.CLEAR,
        fill: isHeader ? AZUL_HEADER : (odd ? GRIS_FILA : BLANCO),
      },
      borders: { top: BORDE, bottom: BORDE, left: BORDE, right: BORDE },
      margins: { top: 80, bottom: 80, left: 150, right: 150 },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text,
              bold: isHeader,
              color: isHeader ? BLANCO : NEGRO,
              size: isHeader ? 19 : 18,
              font: 'Calibri',
            }),
          ],
        }),
      ],
    });
  }

  function row(cells, isHeader, odd) {
    return new TableRow({
      tableHeader: isHeader,
      children: cells.map((text, ci) => {
        const pct = pcts[ci] || Math.round(100 / n);
        return new TableCell({
          width: { size: pct, type: WidthType.PERCENTAGE },
          shading: {
            type: ShadingType.CLEAR,
            fill: isHeader ? AZUL_HEADER : (odd ? GRIS_FILA : BLANCO),
          },
          borders: { top: BORDE, bottom: BORDE, left: BORDE, right: BORDE },
          margins: { top: 80, bottom: 80, left: 150, right: 150 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text,
                  bold: isHeader,
                  color: isHeader ? BLANCO : NEGRO,
                  size: isHeader ? 19 : 18,
                  font: 'Calibri',
                }),
              ],
            }),
          ],
        });
      }),
    });
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      row(headers, true, false),
      ...rows.map((r, ri) => row(r, false, ri % 2 === 1)),
    ],
  });
}

// ── documento ─────────────────────────────────────────────────────────────────

const doc = new Document({
  creator: 'Sistema SCRCR',
  title: 'Documentación Técnica del Sistema SCRCR',
  sections: [
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1080 } },
      },
      children: [

        // ── PORTADA ─────────────────────────────────────────────────────────
        gap(1600),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'SISTEMA SCRCR', bold: true, size: 60, color: AZUL, font: 'Calibri' })],
        }),
        gap(160),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Sistema de Control y Registro de Congregados y Recursos', size: 28, color: '555555', font: 'Calibri' })],
        }),
        gap(320),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          border: {
            top:    { style: BorderStyle.SINGLE, size: 6, color: AZUL_HEADER },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: AZUL_HEADER },
          },
          children: [new TextRun({ text: 'Iglesia Bíblica Emanuel — Liberia', size: 26, italics: true, color: '666666', font: 'Calibri' })],
        }),
        gap(320),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Documentación Técnica del Sistema', size: 22, color: '888888', font: 'Calibri' })],
        }),
        gap(80),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            text: `Fecha: ${new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })}`,
            size: 20, color: '999999', font: 'Calibri',
          })],
        }),
        new Paragraph({ pageBreakBefore: true }),

        // ── 1. DESCRIPCIÓN GENERAL ───────────────────────────────────────────
        h1('1. Descripción General del Proyecto'),
        p('SCRCR es una aplicación web desarrollada para la Iglesia Bíblica Emanuel de Liberia. Su propósito es digitalizar y centralizar la gestión de miembros, control de asistencia, administración de personal, permisos, actas y reportes.'),
        gap(80),
        p('El sistema diferencia dos tipos de miembros: asociados (miembros formales con derechos plenos) y congregados (miembros regulares). Además gestiona personal administrativo, eventos, actas de asambleas, planilla de empleados y permisos de ausencia.'),
        gap(200),
        h3('Tecnologías Principales'),
        makeTable(
          ['Tecnología', 'Versión', 'Uso en el Sistema'],
          [
            ['Next.js',           '15.x',       'Framework fullstack con App Router'],
            ['TypeScript',        '5.x',        'Tipado estático en todo el proyecto'],
            ['PostgreSQL (Neon)', 'Serverless',  'Base de datos principal'],
            ['Prisma ORM',        '7.8',        'Acceso a BD con type-safety completo'],
            ['Tailwind CSS',      '4.x',        'Estilos y diseño responsivo'],
            ['jose + bcryptjs',   '6.x / 3.x',  'JWT y hash de contraseñas'],
            ['Zod',               '4.x',        'Validación de esquemas de datos'],
            ['jsPDF + ExcelJS',   '—',          'Exportación de reportes PDF / Excel'],
            ['Vercel Blob',       '—',          'Almacenamiento de documentos'],
          ],
          [28, 15, 57]
        ),
        new Paragraph({ pageBreakBefore: true }),

        // ── 2. ARQUITECTURA ──────────────────────────────────────────────────
        h1('2. Arquitectura del Sistema'),
        p('El sistema implementa una arquitectura en capas derivada del patrón MVC, adaptada al contexto de Next.js App Router. Se aplica el patrón DAO para aislar la lógica de acceso a datos y DTOs para desacoplar las capas.'),
        gap(200),
        h3('Capas del Sistema'),
        makeTable(
          ['Capa', 'Ubicación', 'Responsabilidad'],
          [
            ['Presentación (View)',      'src/app/*/page.tsx',           'Componentes React cliente: UI, formularios, tablas'],
            ['Controlador (Controller)', 'src/app/api/*/route.ts',       'API Routes de Next.js — reciben HTTP y retornan JSON'],
            ['Servicio (Service)',       'src/services/*.service.ts',    'Lógica de negocio: validación, transformación, orquestación'],
            ['DAO',                      'src/dao/*.dao.ts',             'Acceso a BD mediante Prisma. Una clase por entidad'],
            ['Modelo (Model)',           'src/models/*.ts',              'Interfaces TypeScript del dominio'],
            ['DTO',                      'src/dto/*.dto.ts',             'Objetos de transferencia Request/Response'],
            ['Validadores',             'src/validators/*.validator.ts', 'Reglas de validación de datos de entrada'],
            ['Middleware',              'src/middleware.ts',             'Autenticación y autorización en el Edge de Next.js'],
          ],
          [25, 30, 45]
        ),
        gap(240),
        h3('Flujo de una Petición HTTP'),
        bullet('1. El usuario interactúa con la UI (page.tsx) — componente React del lado del cliente'),
        bullet('2. Se realiza un fetch() a una API Route (/api/*)'),
        bullet('3. El Middleware Edge verifica el JWT antes de enrutar la petición'),
        bullet('4. La API Route parsea el body y delega al Service correspondiente'),
        bullet('5. El Service valida, aplica la lógica de negocio y llama al DAO'),
        bullet('6. El DAO ejecuta la consulta en PostgreSQL a través de Prisma'),
        bullet('7. El resultado sube como DTO/Response y se retorna como JSON'),
        gap(240),
        h3('Patrones de Diseño Aplicados'),
        makeTable(
          ['Patrón', 'Dónde se aplica'],
          [
            ['DAO (Data Access Object)',  'Cada entidad tiene su propio DAO que encapsula todas las consultas a BD'],
            ['DTO (Data Transfer Object)','DTOs separados para Request y Response desacoplan el modelo de la API'],
            ['Singleton',                'PrismaClient se instancia una sola vez y se reutiliza globalmente'],
            ['Service Layer',            'Toda la lógica de negocio está aislada en servicios; los controllers son delgados'],
            ['Middleware Chain',         'El Edge Middleware intercepta y evalúa cada petición antes de llegar al handler'],
            ['Soft Delete',              'Los registros se marcan con estado=0 en lugar de eliminarse físicamente'],
          ],
          [35, 65]
        ),
        new Paragraph({ pageBreakBefore: true }),

        // ── 3. MÓDULOS FRONTEND ──────────────────────────────────────────────
        h1('3. Módulos del Frontend'),
        p('Todas las páginas usan el App Router de Next.js. Las páginas con "use client" manejan estado local y efectos del lado del cliente. El layout global incluye el Sidebar y la Navbar.'),
        gap(200),
        makeTable(
          ['Módulo / Ruta', 'Descripción', 'Acceso'],
          [
            ['/ (Dashboard)',         'Pantalla principal con accesos rápidos según el rol del usuario',                                  'Todos los roles'],
            ['/login',                'Formulario de autenticación con bloqueo tras 5 intentos fallidos',                                 'Solo no autenticados'],
            ['/consulta-asociados',   'Gestión completa: listado, búsqueda, creación, edición, documentos, exportación Excel/PDF',        'Admin / Pastor General'],
            ['/congregados',          'Gestión de congregados con filtros, paginación, foto y documentos',                                'Admin / Tesorero / Pastor'],
            ['/eventos',              'Alta, edición y desactivación de eventos, vinculados a asistencia y actas',                        'Protegida'],
            ['/asistencia/registro',  'Registro de asistencia individual o masiva a eventos',                                             'Protegida'],
            ['/reportes',             'Reportes de asistencia filtrados por evento, fecha y estado. Exportación Excel/PDF',               'Protegida'],
            ['/actas',                'Registro de sesiones y actas de asamblea y junta directiva con lista de asistentes',               'Protegida'],
            ['/permisos',             'Solicitud y gestión de permisos/ausencias con validación de traslapes de fechas',                  'Protegida'],
            ['/planilla',             'Gestión de empleados, salarios, vacaciones y permisos del personal',                               'Protegida'],
            ['/historial',            'Tabla de auditoría con todos los cambios realizados en el sistema',                                'Protegida'],
            ['/gestion-usuarios',     'Alta, edición y desactivación de cuentas de usuario',                                              'Solo admin'],
            ['/gestion-roles',        'Configuración dinámica de permisos por rol y módulo',                                              'Solo admin'],
          ],
          [28, 52, 20]
        ),
        gap(240),
        h3('Componentes Reutilizables'),
        makeTable(
          ['Componente', 'Descripción'],
          [
            ['SideBar.tsx',             'Menú lateral responsivo con navegación dinámica según el rol. En mobile colapsa con hamburguesa'],
            ['Navbar.tsx',              'Barra superior con logo, nombre de usuario, rol activo y botón de cierre de sesión'],
            ['ProtectedRoute.tsx',      'HOC que verifica autenticación y redirige si el usuario no está logueado'],
            ['AccessibilityWidget.tsx', 'Widget flotante con opciones de zoom, contraste y accesibilidad'],
          ],
          [28, 72]
        ),
        new Paragraph({ pageBreakBefore: true }),

        // ── 4. API REST ──────────────────────────────────────────────────────
        h1('4. API REST — Endpoints del Backend'),
        h3('Autenticación (/api/auth)'),
        makeTable(
          ['Método', 'Ruta', 'Descripción'],
          [
            ['POST', '/api/auth/login',       'Valida credenciales, genera JWT de 24 h y lo guarda en cookie HttpOnly'],
            ['POST', '/api/auth/logout',      'Elimina la cookie auth-token y cierra la sesión'],
            ['GET',  '/api/auth/me',          'Retorna los datos del usuario autenticado actualmente'],
            ['GET',  '/api/auth/verify',      'Verifica si el token JWT es válido y no ha expirado'],
            ['GET',  '/api/auth/verify-role', 'Valida que el token tenga el rol requerido para el módulo'],
          ],
          [12, 32, 56]
        ),
        gap(160),
        h3('Asociados (/api/asociados)'),
        makeTable(
          ['Método', 'Ruta', 'Descripción'],
          [
            ['GET',    '/api/asociados',             'Lista todos los asociados sin paginación'],
            ['POST',   '/api/asociados',             'Crea un nuevo asociado con validación completa'],
            ['GET',    '/api/asociados/[id]',        'Obtiene un asociado por ID con todos sus campos'],
            ['PUT',    '/api/asociados/update?id=X', 'Actualiza campos de un asociado existente'],
            ['DELETE', '/api/asociados/delete?id=X', 'Soft delete (estado=0) o hard delete permanente'],
            ['GET',    '/api/asociados/consulta',    'Búsqueda con filtros (nombre, cédula) y paginación'],
          ],
          [12, 36, 52]
        ),
        gap(160),
        h3('Congregados (/api/congregados)'),
        makeTable(
          ['Método', 'Ruta', 'Descripción'],
          [
            ['GET',    '/api/congregados',      'Lista congregados con filtros y paginación'],
            ['POST',   '/api/congregados',      'Crea congregado con documentos asociados'],
            ['GET',    '/api/congregados/[id]', 'Obtiene congregado por ID'],
            ['PUT',    '/api/congregados/[id]', 'Actualiza datos y documentos del congregado'],
            ['DELETE', '/api/congregados/[id]', 'Elimina o desactiva el congregado'],
          ],
          [12, 36, 52]
        ),
        gap(160),
        h3('Eventos, Asistencia y Reportes'),
        makeTable(
          ['Método', 'Ruta', 'Descripción'],
          [
            ['GET/POST',       '/api/eventos',                    'Listar y crear eventos'],
            ['GET/PUT/DELETE', '/api/eventos/[id]',               'CRUD sobre evento específico'],
            ['POST',           '/api/asistencia/registro',        'Registra asistencia individual a un evento'],
            ['GET/POST',       '/api/reporte-asistencia',         'Crear y consultar reportes con estado'],
            ['GET',            '/api/reportes/asistencia',        'Reportes con filtros (evento, fecha, estado)'],
            ['GET',            '/api/reportes/asistencia/export', 'Exporta reporte en CSV o Excel'],
          ],
          [18, 38, 44]
        ),
        gap(160),
        h3('Usuarios, Permisos, Actas y Otros'),
        makeTable(
          ['Método', 'Ruta', 'Descripción'],
          [
            ['GET/POST',    '/api/usuarios',                         'Listar y crear usuarios del sistema'],
            ['GET/PUT/DEL', '/api/usuarios/[id]',                    'CRUD sobre usuario específico'],
            ['GET/POST',    '/api/permisos',                         'Solicitar y listar permisos de ausencia'],
            ['PUT',         '/api/permisos/[id]/estado',             'Aprobar o rechazar una solicitud de permiso'],
            ['GET/POST',    '/api/actas/asociacion',                 'CRUD de actas de asamblea de asociados'],
            ['POST',        '/api/actas/asociacion/[id]/asistencia', 'Registra asistencia a un acta específica'],
            ['GET/POST',    '/api/actas/jd',                         'CRUD de actas de junta directiva'],
            ['GET/POST',    '/api/empleados',                        'Gestión de empleados con planilla y vacaciones'],
            ['POST',        '/api/documentos/upload',                'Subida de documentos (Vercel Blob)'],
            ['GET/POST',    '/api/historial',                        'Registro de auditoría de cambios'],
          ],
          [16, 40, 44]
        ),
        new Paragraph({ pageBreakBefore: true }),

        // ── 5. BASE DE DATOS ─────────────────────────────────────────────────
        h1('5. Modelo de Base de Datos'),
        p('La base de datos está hospedada en Neon (PostgreSQL serverless). El acceso se realiza exclusivamente a través de Prisma ORM v7 con el adaptador @prisma/adapter-neon para conexiones serverless eficientes.'),
        gap(200),
        h3('Tablas Principales'),
        makeTable(
          ['Tabla', 'Descripción', 'Campos Clave'],
          [
            ['usuarios',                   'Cuentas de acceso al sistema',                   'username, email, passwordHash, rol, intentosFallidos, bloqueadoHasta'],
            ['asociados',                  'Miembros formales de la asociación',             'cedula, estadoCivil, perteneceJuntaDirectiva, puestoJuntaDirectiva, urlCedula, urlCartaSolicitud'],
            ['congregados',                'Miembros regulares de la congregación',          'cedula, ministerio, estadoCivil, urlFotoCedula'],
            ['empleados',                  'Personal administrativo con planilla',           'cedula, puesto, salarioBase, cuentaBancaria, diasVacacionesDisponibles'],
            ['eventos',                    'Actividades y reuniones de la iglesia',          'nombre, fecha, hora, activo'],
            ['asistencias',                'Registro de asistencia por asociado/evento',     'asociadoId, eventoId — UNIQUE(asociadoId, eventoId)'],
            ['reportes_asistencia',        'Reporte consolidado con estado',                 'asociadoId, eventoId, fecha, estado (presente/ausente/justificado)'],
            ['permisos',                   'Solicitudes de ausencia del personal',           'usuarioId, fechaInicio, fechaFin, estado (PENDIENTE/APROBADO/RECHAZADO)'],
            ['actas_asociacion',           'Actas de asamblea de asociados',                'fecha, tipoSesion, urlActa'],
            ['actas_junta_directiva',      'Actas de junta directiva',                      'fecha, tipoSesion, urlActa'],
            ['vacaciones_empleado',        'Solicitudes de vacaciones del personal',         'empleadoId, fechaInicio, fechaFin, cantidadDias, estado'],
            ['permisos_rol',               'Control de acceso por rol y módulo',             'rol, modulo, activo'],
            ['auditoria',                  'Historial de cambios en el sistema',             'tabla, registroId, accion, detalles, fecha'],
          ],
          [22, 28, 50]
        ),
        gap(240),
        h3('Estrategia de Eliminación'),
        bullet('Soft Delete — Los asociados y congregados se marcan con estado = 0 (inactivo) y se excluyen de las búsquedas por defecto. Permite recuperación de datos.'),
        bullet('Hard Delete — Opción disponible para eliminar registros permanentemente de la base de datos.'),
        bullet('Cascade — Las asistencias y reportes se eliminan en cascada cuando se elimina el asociado o evento padre.'),
        new Paragraph({ pageBreakBefore: true }),

        // ── 6. AUTENTICACIÓN ─────────────────────────────────────────────────
        h1('6. Autenticación y Seguridad'),
        h3('Flujo de Autenticación'),
        bullet('1. El usuario ingresa username y password en /login'),
        bullet('2. El backend verifica la contraseña con bcryptjs (hash bcrypt, salt 10)'),
        bullet('3. Si es correcta: se genera un JWT firmado con HS256 (validez 24 h)'),
        bullet('4. El token se guarda en una cookie HttpOnly, Secure, SameSite: Lax'),
        bullet('5. En cada petición el Middleware Edge verifica el token antes de llegar al controlador'),
        bullet('6. Si el token es inválido o expiró: se limpia la cookie y se redirige al login'),
        gap(160),
        h3('Bloqueo de Cuenta'),
        bullet('Después de 5 intentos fallidos consecutivos, la cuenta queda bloqueada 30 minutos'),
        bullet('El campo bloqueadoHasta en tabla usuarios almacena el timestamp de desbloqueo'),
        bullet('Al login exitoso se resetean los intentos fallidos a 0 automáticamente'),
        gap(200),
        h3('Roles del Sistema'),
        makeTable(
          ['Rol (código)', 'Etiqueta visible', 'Módulos con acceso'],
          [
            ['admin',                  'Administrador',           'Acceso total a todos los módulos del sistema'],
            ['pastorGeneral',          'Pastor General',          'Asociados, congregados, eventos, reportes, actas, permisos'],
            ['juntaDirectiva',         'Junta Directiva',         'Consulta de asociados, reportes y actas'],
            ['asistenteAdministrativo','Asistente Administrativo','Congregados, eventos, permisos, asistencia, reportes'],
            ['tesorero',               'Tesorero',                'Congregados, reportes financieros y configuración'],
          ],
          [25, 25, 50]
        ),
        gap(200),
        h3('Control de Acceso en 3 Niveles'),
        bullet('Nivel 1 — Edge Middleware (src/middleware.ts): Verifica JWT y redirige según rol antes de servir la página'),
        bullet('Nivel 2 — Frontend (useAuth hook + Sidebar): Filtra el menú mostrando solo módulos permitidos para el rol activo'),
        bullet('Nivel 3 — API Routes: Cada endpoint valida el token y aplica lógica específica de permisos'),
        new Paragraph({ pageBreakBefore: true }),

        // ── 7. SERVICIOS ─────────────────────────────────────────────────────
        h1('7. Servicios y Lógica de Negocio'),
        h3('UsuarioService'),
        p('Gestiona la autenticación: valida credenciales, genera tokens, maneja el contador de intentos fallidos y bloqueos temporales. Usa bcryptjs para verificar contraseñas hasheadas.'),
        h3('AsociadoService'),
        p('Controla el ciclo de vida completo de los asociados: creación con validación, actualización parcial, soft delete y hard delete. Mapea el modelo interno al DTO de respuesta incluyendo documentos, junta directiva y campos extendidos.'),
        h3('CongregadoService'),
        p('Análogo al AsociadoService para congregados. Gestiona documentos de identidad, campos extendidos y registra auditoría en cada operación.'),
        h3('PermisoService'),
        p('Verifica que no haya traslape de fechas con permisos existentes (PENDIENTE o APROBADO) del mismo usuario antes de crear una solicitud. Permite aprobar o rechazar con observaciones.'),
        h3('AsistenciaService / ReporteAsistenciaService'),
        p('El servicio de asistencia previene registros duplicados por evento/asociado. El reporte usa UPSERT de Prisma para actualizar el estado si ya existe el registro, en lugar de duplicarlo.'),
        new Paragraph({ pageBreakBefore: true }),

        // ── 8. ESTADO ACTUAL ─────────────────────────────────────────────────
        h1('8. Estado Actual del Proyecto'),
        h3('Funcionalidades Implementadas'),
        makeTable(
          ['Módulo', 'Estado'],
          [
            ['Autenticación (login, logout, JWT, bloqueo de cuenta)',        '✅ Completo'],
            ['Gestión de Usuarios (CRUD completo)',                           '✅ Completo'],
            ['Gestión de Roles y Permisos (configuración dinámica en BD)',    '✅ Completo'],
            ['Gestión de Asociados (CRUD, documentos, junta directiva)',      '✅ Completo'],
            ['Gestión de Congregados (CRUD, documentos, filtros avanzados)', '✅ Completo'],
            ['Gestión de Eventos (CRUD, activar/desactivar)',                 '✅ Completo'],
            ['Registro de Asistencia (individual y masiva)',                  '✅ Completo'],
            ['Reportes de Asistencia (con exportación Excel/PDF)',            '✅ Completo'],
            ['Actas de Asamblea y Junta Directiva',                          '✅ Completo'],
            ['Solicitud y Aprobación de Permisos (con validación traslapes)', '✅ Completo'],
            ['Planilla de Empleados (salarios, vacaciones, permisos)',        '✅ Completo'],
            ['Historial de Auditoría',                                        '✅ Completo'],
            ['Migración a Prisma ORM 7 con adaptador Neon',                  '✅ Completo'],
            ['Subida y descarga de documentos (Vercel Blob)',                 '✅ Completo'],
            ['Middleware de autenticación Edge (Next.js)',                    '✅ Completo'],
          ],
          [80, 20]
        ),
        gap(200),
        h3('Pendiente / En Progreso'),
        makeTable(
          ['Tarea', 'Detalle'],
          [
            ['Migración de BD para campos nuevos de asociados', 'Ejecutar npx prisma db push para los campos: telefonoContacto, fechaNacimiento, estadoCivil, profesion, anosCongregarse, fechaAceptacion, perteneceJuntaDirectiva, puestoJuntaDirectiva, urlCedula y URLs de documentos'],
            ['Formulario de Registro de Asociados extendido',   'Página /registro-asociados actualizada con los 9 campos nuevos y carga de mínimo 3 documentos'],
            ['Módulo de recuperación de contraseña',            'Página /recuperar-password con envío de email (pendiente integración de servicio de correo)'],
            ['Filtros avanzados en Historial',                  'Página /historial con filtros por tabla, acción, usuario y rango de fechas'],
          ],
          [35, 65]
        ),
        new Paragraph({ pageBreakBefore: true }),

        // ── 9. ESTRUCTURA DE CARPETAS ────────────────────────────────────────
        h1('9. Estructura de Carpetas del Proyecto'),
        makeTable(
          ['Ruta', 'Descripción'],
          [
            ['src/app/',                 'Páginas y API Routes (Next.js App Router)'],
            ['src/app/api/',             'Endpoints REST organizados por dominio de negocio'],
            ['src/components/',          'Componentes React reutilizables (Sidebar, Navbar, etc.)'],
            ['src/contexts/',            'Contextos React globales (AuthContext)'],
            ['src/dao/',                 'Data Access Objects — consultas Prisma por entidad'],
            ['src/dto/',                 'Data Transfer Objects para request y response'],
            ['src/hooks/',               'Hooks personalizados (useAuth)'],
            ['src/lib/',                 'Utilidades globales: auth.ts (JWT), prisma.ts (singleton), db.ts'],
            ['src/middleware.ts',        'Middleware Edge de Next.js — autenticación global por ruta'],
            ['src/models/',             'Interfaces TypeScript del dominio'],
            ['src/services/',           'Lógica de negocio por dominio'],
            ['src/utils/',              'Funciones auxiliares: exportación CSV, permisos por rol'],
            ['src/validators/',         'Validadores de datos de entrada por entidad'],
            ['prisma/schema.prisma',     'Esquema de BD: modelos Prisma, relaciones y enums'],
            ['prisma.config.ts',         'Configuración de Prisma 7 (URL de conexión, adaptador)'],
            ['prisma/seed.ts',           'Datos iniciales para poblar la base de datos'],
            ['.env.local',               'Variables de entorno: POSTGRES_URL, JWT_SECRET, BLOB_READ_WRITE_TOKEN'],
          ],
          [35, 65]
        ),

        gap(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 160, after: 80 },
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: AZUL_HEADER } },
          children: [new TextRun({ text: 'Sistema SCRCR — Iglesia Bíblica Emanuel, Liberia', size: 18, italics: true, color: '888888', font: 'Calibri' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            text: `Documento generado el ${new Date().toLocaleDateString('es-CR')}`,
            size: 16, color: 'BBBBBB', font: 'Calibri',
          })],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/home/user/SCRCR/documentacion-scrcr.docx', buffer);
  console.log('✅ Documento generado: documentacion-scrcr.docx');
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
