import { NextRequest, NextResponse } from 'next/server';
import { CrearEventoRequest, EventoResponse, ListarEventosResponse } from '@/dto/evento.dto';
import { EventoValidator } from '@/validators/evento.validator';
import { db } from '@/lib/db'; // Asumiendo configuración de base de datos

/**
 * GET /api/eventos - Listar eventos con filtros y paginación
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nombre = searchParams.get('nombre') || undefined;
    const fechaDesde = searchParams.get('fechaDesde') || undefined;
    const fechaHasta = searchParams.get('fechaHasta') || undefined;
    const activoParam = searchParams.get('activo');
    const activo = activoParam !== null ? activoParam === 'true' : undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Construir query de filtros
    let query = 'SELECT * FROM eventos WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (nombre) {
      query += ` AND nombre ILIKE $${paramIndex}`;
      params.push(`%${nombre}%`);
      paramIndex++;
    }

    if (fechaDesde) {
      query += ` AND fecha >= $${paramIndex}`;
      params.push(fechaDesde);
      paramIndex++;
    }

    if (fechaHasta) {
      query += ` AND fecha <= $${paramIndex}`;
      params.push(fechaHasta);
      paramIndex++;
    }

    if (activo !== undefined) {
      query += ` AND activo = $${paramIndex}`;
      params.push(activo);
      paramIndex++;
    }

    // Query para contar total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Query con paginación
    query += ` ORDER BY fecha DESC, hora DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const response: ListarEventosResponse = {
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error al listar eventos:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener eventos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/eventos - Crear un nuevo evento
 */
export async function POST(request: NextRequest) {
  try {
    const body: CrearEventoRequest = await request.json();

    // Sanitizar datos
    const datosSanitizados = EventoValidator.sanitizarDatos(body);

    // Validar datos
    const validacion = EventoValidator.validarCrearEvento(datosSanitizados);
    if (!validacion.valid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Errores de validación',
          errors: validacion.errors
        },
        { status: 400 }
      );
    }

    // Validar que la fecha no sea en el pasado (opcional)
    if (!EventoValidator.validarFechaFutura(datosSanitizados.fecha, datosSanitizados.hora)) {
      return NextResponse.json(
        {
          success: false,
          message: 'La fecha y hora del evento no puede ser en el pasado'
        },
        { status: 400 }
      );
    }

    // Insertar en la base de datos
    const query = `
      INSERT INTO eventos (nombre, descripcion, fecha, hora, activo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      datosSanitizados.nombre,
      datosSanitizados.descripcion || null,
      datosSanitizados.fecha,
      datosSanitizados.hora,
      datosSanitizados.activo ?? true
    ];

    const result = await db.query(query, values);
    const evento: EventoResponse = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        message: 'Evento creado exitosamente',
        data: evento
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear evento:', error);
    return NextResponse.json(
      { success: false, message: 'Error al crear evento' },
      { status: 500 }
    );
  }
}