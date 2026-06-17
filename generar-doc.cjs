const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType,
} = require('docx');
const fs = require('fs');

const AZUL        = '1F4E79';
const AZUL_HEADER = '2E75B6';
const AZUL_CLARO  = 'DEEAF1';
const GRIS_FILA   = 'F2F2F2';
const NEGRO       = '1A1A1A';
const BLANCO      = 'FFFFFF';

const BORDE = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };

// ── helpers de texto ─────────────────────────────────────────────────────────

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 240 },
    children: [new TextRun({ text, bold: true, color: AZUL, size: 34, font: 'Calibri' })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: AZUL } },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, color: AZUL_HEADER, size: 28, font: 'Calibri' })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, color: AZUL, size: 24, font: 'Calibri' })],
  });
}

function p(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 20, color: NEGRO, font: 'Calibri' })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 20, color: NEGRO, font: 'Calibri' })],
  });
}

function gap(size = 100) {
  return new Paragraph({ spacing: { before: size, after: 0 }, children: [] });
}

// ── constructor de tablas ─────────────────────────────────────────────────────
// colWidths: array of numbers that sum to 100 (percentages per column)
// If omitted, columns are distributed evenly.

function makeCell(text, isHeader, shade) {
  return new TableCell({
    shading: {
      type: ShadingType.CLEAR,
      color: isHeader ? AZUL_HEADER : (shade ? GRIS_FILA : BLANCO),
      fill:  isHeader ? AZUL_HEADER : (shade ? GRIS_FILA : BLANCO),
    },
    borders: { top: BORDE, bottom: BORDE, left: BORDE, right: BORDE },
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: isHeader,
            color: isHeader ? BLANCO : NEGRO,
            size: isHeader ? 20 : 18,
            font: 'Calibri',
          }),
        ],
      }),
    ],
  });
}

function makeTable(headers, rows, colWidths) {
  const total = 9360; // total DXA width for a page with normal margins
  const n = headers.length;
  const widths = colWidths
    ? colWidths.map(w => Math.round((w / 100) * total))
    : headers.map(() => Math.round(total / n));

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      Object.assign(makeCell(h, true, false), {
        // apply width per cell
      }) && (() => {
        const c = makeCell(h, true, false);
        c.options = c.options || {};
        return c;
      })()
    ),
  });

  // rebuild using width on cell
  function cellWithWidth(text, isHeader, shade, width) {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      shading: {
        type: ShadingType.CLEAR,
        color: isHeader ? AZUL_HEADER : (shade ? GRIS_FILA : BLANCO),
        fill:  isHeader ? AZUL_HEADER : (shade ? GRIS_FILA : BLANCO),
      },
      borders: { top: BORDE, bottom: BORDE, left: BORDE, right: BORDE },
      margins: { top: 80, bottom: 80, left: 140, right: 140 },
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text,
              bold: isHeader,
              color: isHeader ? BLANCO : NEGRO,
              size: isHeader ? 20 : 18,
              font: 'Calibri',
            }),
          ],
        }),
      ],
    });
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: BORDE, bottom: BORDE, left: BORDE, right: BORDE, insideH: BORDE, insideV: BORDE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => cellWithWidth(h, true, false, widths[i])),
      }),
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((cell, i) => cellWithWidth(cell, false, ri % 2 === 1, widths[i])),
        })
      ),
    ],
  });
}

// ── documento ─────────────────────────────────────────────────────────────────

const doc = new Document({
  creator: 'Sistema SCRCR',
  title: 'Documentación Técnica del Sistema SCRCR',
  description: 'Estado actual, arquitectura y módulos del sistema',
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 20, color: NEGRO },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1080 },
        },
      },
      children: [

        // ── PORTADA ─────────────────────────────────────────────────────────
        gap(1800),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'SISTEMA SCRCR', bold: true, size: 60, color: AZUL, font: 'Calibri' })],
        }),
        gap(200),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Sistema de Control y Registro de', size: 30, color: '444444', font: 'Calibri' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Congregados y Recursos', size: 30, color: '444444', font: 'Calibri' })],
        }),
        gap(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: {
            top:    { style: BorderStyle.SINGLE, size: 6, color: AZUL_HEADER },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: AZUL_HEADER },
          },
          spacing: { before: 120, after: 120 },
          children: [
            new TextRun({ text: 'Iglesia Bíblica Emanuel — Liberia', size: 26, italics: true, color: '666666', font: 'Calibri' }),
          ],
        }),
        gap(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Documentación Técnica del Sistema', size: 24, color: '888888', font: 'Calibri' })],
        }),
        gap(100),
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
        p('SCRCR es una aplicación web desarrollada para la Iglesia Bíblica Emanuel de Liberia. Su propósito es digitalizar y centralizar la gestión de los miembros de la iglesia, el control de asistencia, la administración de personal, permisos, actas y reportes.'),
        gap(80),
        p('El sistema diferencia dos tipos de miembros: asociados (miembros formales con derechos plenos) y congregados (miembros regulares). Además gestiona el personal administrativo, eventos, actas de asambleas, planilla de empleados y permisos de ausencia.'),

        gap(200),
        h3('Tecnologías Principales'),
        makeTable(
          ['Tecnología', 'Versión', 'Uso en el Sistema'],
          [
            ['Next.js',           '15.x',              'Framework fullstack con App Router'],
            ['TypeScript',        '5.x',               'Tipado estático en todo el proyecto'],
            ['PostgreSQL (Neon)', 'Serverless',         'Base de datos principal'],
            ['Prisma ORM',        '7.8',               'Acceso a BD con type-safety completo'],
            ['Tailwind CSS',      '4.x',               'Estilos y diseño responsivo'],
            ['jose',              '6.x',               'Firma y verificación de tokens JWT'],
            ['bcryptjs',          '3.x',               'Hash y verificación de contraseñas'],
            ['Zod',               '4.x',               'Validación de esquemas de datos'],
            ['SweetAlert2',       '11.x',              'Alertas y confirmaciones UI'],
            ['jsPDF + ExcelJS',   '—',                 'Exportación de reportes PDF / Excel'],
            ['Vercel Blob',       '—',                 'Almacenamiento de documentos'],
          ],
          [28, 16, 56]
        ),

        new Paragraph({ pageBreakBefore: true }),

        // ── 2. ARQUITECTURA ──────────────────────────────────────────────────
        h1('2. Arquitectura del Sistema'),
        p('El sistema implementa una arquitectura en capas derivada del patrón MVC, adaptada al contexto de Next.js App Router. Se aplica el patrón DAO para aislar la lógica de acceso a datos, y DTOs para desacoplar las capas.'),

        gap(200),
        h3('Capas del Sistema'),
        makeTable(
          ['Capa', 'Ubicación', 'Responsabilidad'],
          [
            ['Presentación (View)',      'src/app/*/page.tsx',              'Componentes React cliente: UI, formularios, tablas'],
            ['Controlador (Controller)', 'src/app/api/*/route.ts',          'API Routes de Next.js — reciben HTTP y retornan JSON'],
            ['Servicio (Service)',       'src/services/*.service.ts',       'Lógica de negocio: validación, transformación, orquestación'],
            ['DAO',                      'src/dao/*.dao.ts',                'Acceso a BD mediante Prisma. Una clase por entidad'],
            ['Modelo (Model)',           'src/models/*.ts',                 'Interfaces TypeScript que representan entidades del dominio'],
            ['DTO',                      'src/dto/*.dto.ts',                'Objetos de transferencia para entrada (Request) y salida (Response)'],
            ['Validadores',             'src/validators/*.validator.ts',    'Reglas de validación de datos de entrada'],
            ['ORM',                      'prisma/schema.prisma',            'Esquema de BD y modelos Prisma'],
            ['Middleware',              'src/middleware.ts',                'Autenticación y autorización en el Edge de Next.js'],
            ['Utilidades',              'src/lib/ y src/utils/',            'Auth JWT, cliente Prisma, exportación CSV, permisos de roles'],
          ],
          [24, 30, 46]
        ),

        gap(240),
        h3('Flujo de una Petición HTTP'),
        bullet('1. El usuario interactúa con la UI (page.tsx) — componente React del lado del cliente'),
        bullet('2. Se realiza un fetch() a una API Route (/api/*)'),
        bullet('3. El Middleware Edge verifica el JWT antes de enrutar la petición'),
        bullet('4. La API Route parsea el body y delega al Service correspondiente'),
        bullet('5. El Service valida, aplica la lógica de negocio y llama al DAO'),
        bullet('6. El DAO ejecuta la consulta en PostgreSQL a través de Prisma'),
        bullet('7. El resultado sube por las capas como DTO/Response y se retorna como JSON'),

        gap(240),
        h3('Patrones de Diseño Aplicados'),
        makeTable(
          ['Patrón', 'Dónde se aplica'],
          [
            ['DAO (Data Access Object)', 'Cada entidad tiene su propio DAO que encapsula todas las consultas a BD'],
            ['DTO (Data Transfer Object)', 'DTOs separados para Request y Response desacoplan el modelo de la API'],
            ['Singleton', 'PrismaClient se instancia una sola vez y se reutiliza globalmente'],
            ['Repository (implícito)', 'Los DAOs actúan como repositorios sobre las entidades Prisma'],
            ['Service Layer', 'Toda la lógica de negocio está aislada en servicios; los controllers son delgados'],
            ['Middleware Chain', 'El Edge Middleware intercepta y evalúa cada petición antes de llegar al handler'],
            ['Soft Delete', 'Los registros se marcan con estado=0 en lugar de eliminarse físicamente'],
          ],
          [38, 62]
        ),

        new Paragraph({ pageBreakBefore: true }),

        // ── 3. MÓDULOS FRONTEND ──────────────────────────────────────────────
        h1('3. Módulos del Frontend'),
        p('Todas las páginas usan el App Router de Next.js. Las páginas marcadas con "use client" manejan estado local y efectos del lado del cliente. El layout global incluye el Sidebar y la Navbar.'),

        gap(200),
        makeTable(
          ['Módulo / Ruta', 'Descripción', 'Acceso por Rol'],
          [
            ['/ (Dashboard)',          'Pantalla principal con accesos rápidos según el rol del usuario',                                                    'Todos los roles'],
            ['/login',                 'Formulario de autenticación con bloqueo tras 5 intentos fallidos',                                                  'Solo no autenticados'],
            ['/consulta-asociados',    'Gestión completa: listado, búsqueda, creación, edición, documentos, exportación Excel/PDF',                         'Admin / Pastor General'],
            ['/congregados',           'Gestión de congregados con filtros, paginación, subida de foto y documentos',                                        'Admin / Tesorero / Pastor'],
            ['/eventos',               'Alta, edición y desactivación de eventos de la iglesia, vinculados a asistencia y actas',                            'Protegida'],
            ['/asistencia/registro',   'Registro de asistencia individual o masiva a eventos por asociado o congregado',                                     'Protegida'],
            ['/reportes',              'Reportes de asistencia filtrados por evento, fecha y estado. Exportación Excel/PDF',                                 'Protegida'],
            ['/actas',                 'Registro de sesiones y actas de asamblea de asociados y junta directiva con lista de asistentes',                   'Protegida'],
            ['/permisos',              'Solicitud y gestión de permisos/ausencias con validación de traslapes de fechas',                                    'Protegida'],
            ['/planilla',              'Gestión de empleados, salarios, vacaciones y permisos de personal administrativo',                                   'Protegida'],
            ['/historial',             'Tabla de auditoría con todos los cambios realizados en el sistema',                                                  'Protegida'],
            ['/gestion-usuarios',      'Alta, edición y desactivación de cuentas de usuario (solo admin)',                                                   'Solo admin'],
            ['/gestion-roles',         'Configuración dinámica de permisos por rol y módulo',                                                               'Solo admin'],
            ['/unauthorized',          'Página de acceso denegado cuando el rol no tiene permiso',                                                          'Pública'],
          ],
          [28, 48, 24]
        ),

        gap(240),
        h3('Componentes Reutilizables'),
        makeTable(
          ['Componente', 'Descripción'],
          [
            ['SideBar.tsx',            'Menú lateral responsivo con navegación dinámica según el rol. En mobile colapsa con hamburguesa'],
            ['Navbar.tsx',             'Barra superior con logo, nombre de usuario, rol activo y botón de cierre de sesión'],
            ['ProtectedRoute.tsx',     'HOC que verifica autenticación y redirige si el usuario no está logueado'],
            ['ToastProvider.tsx',      'Proveedor de notificaciones emergentes (react-hot-toast)'],
            ['AccessibilityWidget.tsx','Widget flotante con opciones de zoom, contraste y accesibilidad'],
          ],
          [30, 70]
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
          [12, 34, 54]
        ),

        gap(160),
        h3('Asociados (/api/asociados)'),
        makeTable(
          ['Método', 'Ruta', 'Descripción'],
          [
            ['GET',    '/api/asociados',               'Lista todos los asociados sin paginación'],
            ['POST',   '/api/asociados',               'Crea un nuevo asociado con validación completa'],
            ['GET',    '/api/asociados/[id]',          'Obtiene un asociado por ID con todos sus campos'],
            ['PUT',    '/api/asociados/update?id=X',   'Actualiza campos de un asociado existente'],
            ['DELETE', '/api/asociados/delete?id=X',   'Soft delete (estado=0) o hard delete permanente'],
            ['GET',    '/api/asociados/consulta',      'Búsqueda con filtros (nombre, cédula) y paginación'],
          ],
          [14, 36, 50]
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
          [14, 36, 50]
        ),

        gap(160),
        h3('Eventos, Asistencia y Reportes'),
        makeTable(
          ['Método', 'Ruta', 'Descripción'],
          [
            ['GET/POST',        '/api/eventos',                     'Listar y crear eventos'],
            ['GET/PUT/DELETE',  '/api/eventos/[id]',                'CRUD sobre evento específico'],
            ['POST',            '/api/asistencia/registro',         'Registra asistencia individual a un evento'],
            ['GET/POST',        '/api/reporte-asistencia',          'Crear y consultar reportes de asistencia con estado'],
            ['GET',             '/api/reportes/asistencia',         'Reportes con filtros (evento, fecha, estado)'],
            ['GET',             '/api/reportes/asistencia/export',  'Exporta reporte en CSV o Excel'],
          ],
          [20, 38, 42]
        ),

        gap(160),
        h3('Usuarios, Permisos, Actas y Otros'),
        makeTable(
          ['Método', 'Ruta', 'Descripción'],
          [
            ['GET/POST',   '/api/usuarios',                           'Listar y crear usuarios del sistema'],
            ['GET/PUT/DEL','/api/usuarios/[id]',                      'CRUD sobre usuario específico'],
            ['GET/POST',   '/api/permisos',                           'Solicitar y listar permisos de ausencia'],
            ['PUT',        '/api/permisos/[id]/estado',               'Aprobar o rechazar una solicitud de permiso'],
            ['GET',        '/api/permisos/traslape',                  'Verifica si un rango de fechas traslapa con otro permiso'],
            ['GET/POST',   '/api/actas/asociacion',                   'CRUD de actas de asamblea de asociados'],
            ['POST',       '/api/actas/asociacion/[id]/asistencia',   'Registra asistencia a un acta específica'],
            ['GET/POST',   '/api/actas/jd',                           'CRUD de actas de junta directiva'],
            ['GET/POST',   '/api/empleados',                          'Gestión de empleados con planilla y vacaciones'],
            ['POST',       '/api/documentos/upload',                  'Subida de documentos al almacenamiento (Vercel Blob)'],
            ['GET',        '/api/blob-download',                      'Descarga de archivos desde Vercel Blob'],
            ['GET/POST',   '/api/historial',                          'Registro de auditoría de cambios en el sistema'],
          ],
          [18, 40, 42]
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
            ['usuarios',                      'Cuentas de acceso al sistema',                              'username, email, passwordHash, rol, intentosFallidos, bloqueadoHasta'],
            ['asociados',                     'Miembros formales de la asociación',                        'cedula, estadoCivil, perteneceJuntaDirectiva, puestoJuntaDirectiva, urlCedula, urlCartaSolicitud'],
            ['congregados',                   'Miembros regulares de la congregación',                     'cedula, ministerio, estadoCivil, urlFotoCedula'],
            ['empleados',                     'Personal administrativo con planilla',                      'cedula, puesto, salarioBase, cuentaBancaria, diasVacacionesDisponibles'],
            ['eventos',                       'Actividades y reuniones de la iglesia',                     'nombre, fecha, hora, activo'],
            ['asistencias',                   'Registro de asistencia por asociado/evento',                'asociadoId, eventoId — UNIQUE(asociadoId, eventoId)'],
            ['reportes_asistencia',           'Reporte consolidado con estado',                            'asociadoId, eventoId, fecha, estado (presente/ausente/justificado)'],
            ['permisos',                      'Solicitudes de ausencia del personal',                      'usuarioId, fechaInicio, fechaFin, estado (PENDIENTE/APROBADO/RECHAZADO)'],
            ['actas_asociacion',              'Actas de asamblea de asociados',                            'fecha, tipoSesion, urlActa'],
            ['asistencias_acta_asociacion',   'Asistencia por acta y asociado',                           'actaId, asociadoId, estado, justificacion'],
            ['actas_junta_directiva',         'Actas de junta directiva',                                 'fecha, tipoSesion, urlActa'],
            ['vacaciones_empleado',           'Solicitudes de vacaciones',                                 'empleadoId, fechaInicio, fechaFin, cantidadDias, estado'],
            ['permisos_rol',                  'Control de acceso por rol y módulo en BD',                  'rol, modulo, activo'],
            ['auditoria',                     'Historial de cambios en el sistema',                        'tabla, registroId, accion, detalles, fecha'],
          ],
          [24, 28, 48]
        ),

        gap(240),
        h3('Estrategia de Eliminación'),
        bullet('Soft Delete — Los asociados y congregados se marcan con estado = 0 (inactivo) y se excluyen de las búsquedas por defecto. Permite recuperación de datos.'),
        bullet('Hard Delete — Opción disponible para eliminar registros permanentemente de la base de datos cuando sea necesario.'),
        bullet('Cascade — Las asistencias y reportes se eliminan en cascada cuando se elimina el asociado o evento padre.'),

        new Paragraph({ pageBreakBefore: true }),

        // ── 6. AUTENTICACIÓN ─────────────────────────────────────────────────
        h1('6. Autenticación y Seguridad'),

        h3('Flujo de Autenticación'),
        bullet('1. El usuario ingresa username y password en /login'),
        bullet('2. El backend verifica la contraseña con bcryptjs (hash bcrypt, salt 10)'),
        bullet('3. Si es correcta: se genera un JWT firmado con HS256 y JWT_SECRET (validez 24 h)'),
        bullet('4. El token se guarda en una cookie HttpOnly, Secure, SameSite: Lax'),
        bullet('5. En cada petición el Middleware Edge verifica el token antes de llegar al controlador'),
        bullet('6. Si el token es inválido o expiró: se limpia la cookie y se redirige al login'),

        gap(160),
        h3('Mecanismo de Bloqueo de Cuenta'),
        bullet('Después de 5 intentos fallidos consecutivos, la cuenta queda bloqueada durante 30 minutos'),
        bullet('El campo bloqueadoHasta en la tabla usuarios almacena el timestamp de desbloqueo'),
        bullet('Al login exitoso se resetean los intentos fallidos a 0 automáticamente'),

        gap(200),
        h3('Roles del Sistema'),
        makeTable(
          ['Rol (código)', 'Etiqueta visible', 'Módulos con acceso'],
          [
            ['admin',                  'Administrador',           'Acceso total a todos los módulos del sistema'],
            ['pastorGeneral',          'Pastor General',          'Asociados, congregados, eventos, reportes, actas, permisos, configuración'],
            ['juntaDirectiva',         'Junta Directiva',         'Consulta de asociados, reportes y actas'],
            ['asistenteAdministrativo','Asistente Administrativo','Congregados, usuarios, eventos, permisos, asistencia, reportes'],
            ['tesorero',               'Tesorero',                'Congregados, reportes financieros y configuración'],
          ],
          [26, 26, 48]
        ),

        gap(200),
        h3('Control de Acceso en 3 Niveles'),
        bullet('Nivel 1 — Edge Middleware (src/middleware.ts): Verifica el JWT y redirige según el rol antes de servir la página. Runs en el Edge de Vercel, sin servidor Node.'),
        bullet('Nivel 2 — Frontend (useAuth hook + Sidebar): Filtra el menú mostrando solo los módulos permitidos para el rol activo del usuario.'),
        bullet('Nivel 3 — API Routes: Cada endpoint valida el token y aplica lógica específica de permisos antes de ejecutar la operación.'),

        new Paragraph({ pageBreakBefore: true }),

        // ── 7. SERVICIOS ─────────────────────────────────────────────────────
        h1('7. Servicios y Lógica de Negocio'),

        h3('UsuarioService'),
        p('Gestiona la autenticación: valida credenciales, genera tokens, maneja el contador de intentos fallidos y los bloqueos temporales. Usa bcryptjs para verificar contraseñas hasheadas.'),

        h3('AsociadoService'),
        p('Controla el ciclo de vida completo de los asociados: creación con validación, actualización parcial de campos, soft delete y hard delete. Valida y sanitiza datos antes de persistir. Mapea el modelo interno al DTO de respuesta incluyendo documentos, junta directiva y campos extendidos.'),

        h3('CongregadoService'),
        p('Análogo al AsociadoService para congregados. Gestiona documentos de identidad (foto de cédula), campos extendidos como segundo ministerio, profesión, fecha de nacimiento y registro de auditoría en cada operación.'),

        h3('PermisoService'),
        p('Verifica que no haya traslape de fechas con permisos existentes (PENDIENTE o APROBADO) del mismo usuario antes de crear una nueva solicitud. Permite aprobar o rechazar con observaciones registradas.'),

        h3('AsistenciaService / ReporteAsistenciaService'),
        p('El servicio de asistencia valida que el asociado exista y previene registros duplicados por evento/asociado. El reporte usa UPSERT (Prisma upsert) para actualizar el estado si ya existe el registro, en lugar de duplicarlo.'),

        new Paragraph({ pageBreakBefore: true }),

        // ── 8. ESTADO ACTUAL ─────────────────────────────────────────────────
        h1('8. Estado Actual del Proyecto'),

        h3('Funcionalidades Implementadas'),
        makeTable(
          ['Módulo', 'Estado'],
          [
            ['Autenticación (login, logout, JWT, bloqueo de cuenta)',         '✅ Completo'],
            ['Gestión de Usuarios (CRUD completo)',                            '✅ Completo'],
            ['Gestión de Roles y Permisos (configuración dinámica en BD)',     '✅ Completo'],
            ['Gestión de Asociados (CRUD, documentos, junta directiva)',       '✅ Completo'],
            ['Gestión de Congregados (CRUD, documentos, filtros avanzados)',   '✅ Completo'],
            ['Gestión de Eventos (CRUD, activar/desactivar)',                  '✅ Completo'],
            ['Registro de Asistencia (individual y masiva)',                   '✅ Completo'],
            ['Reportes de Asistencia (con exportación Excel/PDF)',             '✅ Completo'],
            ['Actas de Asamblea y Junta Directiva',                           '✅ Completo'],
            ['Solicitud y Aprobación de Permisos (con validación traslapes)',  '✅ Completo'],
            ['Planilla de Empleados (salarios, vacaciones, permisos)',         '✅ Completo'],
            ['Historial de Auditoría',                                         '✅ Completo'],
            ['Migración a Prisma ORM 7 con adaptador Neon',                   '✅ Completo'],
            ['Subida y descarga de documentos (Vercel Blob)',                  '✅ Completo'],
            ['Middleware de autenticación Edge (Next.js)',                     '✅ Completo'],
            ['Widget de Accesibilidad',                                        '✅ Completo'],
          ],
          [78, 22]
        ),

        gap(200),
        h3('Pendiente / En Progreso'),
        makeTable(
          ['Tarea', 'Detalle'],
          [
            ['Migración de BD para campos nuevos de asociados', 'Ejecutar npx prisma db push para aplicar los campos: telefonoContacto, fechaNacimiento, estadoCivil, profesion, anosCongregarse, fechaAceptacion, perteneceJuntaDirectiva, puestoJuntaDirectiva, urlCedula, urlCartaSolicitud, urlCartaRenuncia, urlCartaDesafiliacion'],
            ['Formulario de Registro de Asociados extendido',   'Página /registro-asociados actualizada con los 9 campos nuevos y carga de mínimo 3 documentos'],
            ['Módulo de recuperación de contraseña',            'Página /recuperar-password con envío de email (pendiente integración de servicio de correo)'],
            ['Filtros avanzados en Historial',                  'Página /historial con filtros por tabla, acción, usuario y rango de fechas'],
          ],
          [36, 64]
        ),

        new Paragraph({ pageBreakBefore: true }),

        // ── 9. ESTRUCTURA DE CARPETAS ────────────────────────────────────────
        h1('9. Estructura de Carpetas del Proyecto'),
        makeTable(
          ['Ruta', 'Descripción'],
          [
            ['src/app/',                   'Páginas y API Routes (Next.js App Router)'],
            ['src/app/api/',               'Endpoints REST organizados por dominio de negocio'],
            ['src/components/',            'Componentes React reutilizables (Sidebar, Navbar, etc.)'],
            ['src/contexts/',              'Contextos React globales (AuthContext)'],
            ['src/dao/',                   'Data Access Objects — consultas Prisma por entidad del dominio'],
            ['src/dto/',                   'Data Transfer Objects para request y response de cada entidad'],
            ['src/hooks/',                 'Hooks personalizados (useAuth)'],
            ['src/lib/',                   'Utilidades globales: auth.ts (JWT), prisma.ts (cliente singleton), db.ts'],
            ['src/middleware.ts',          'Middleware Edge de Next.js — autenticación global por ruta'],
            ['src/models/',               'Interfaces y clases TypeScript que representan el dominio'],
            ['src/services/',             'Lógica de negocio aislada por dominio'],
            ['src/utils/',                'Funciones auxiliares: exportación CSV, permisos por rol'],
            ['src/validators/',           'Validadores de datos de entrada por entidad'],
            ['prisma/schema.prisma',       'Esquema de BD: modelos Prisma, relaciones y enums'],
            ['prisma.config.ts',           'Configuración de Prisma 7 (URL de conexión, adaptador)'],
            ['prisma/seed.ts',             'Datos iniciales para poblar la base de datos'],
            ['database/schema.sql',        'SQL original de referencia del esquema de base de datos'],
            ['.env.local',                 'Variables de entorno: POSTGRES_URL, JWT_SECRET, BLOB_READ_WRITE_TOKEN'],
          ],
          [36, 64]
        ),

        gap(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: AZUL_HEADER } },
          spacing: { before: 160, after: 80 },
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
});
