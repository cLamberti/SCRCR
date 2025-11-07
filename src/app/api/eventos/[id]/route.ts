import { NextRequest, NextResponse } from 'next/server';
import { ActualizarEventoRequest, EventoResponse } from '@/dto/evento.dto';
import { EventoValidator } from '@/validators/evento.validator';
import { db } from '@/lib/db';

/**
 * GET /api/eventos/[id] - Obtener un evento por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de evento inválido' },
        { status: 400 }
      );
    }

    const query = 'SELECT * FROM eventos WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    const evento: EventoResponse = result.rows[0];

    return NextResponse.json({
      success: true,
      data: evento
    });
  } catch (error) {
    console.error('Error al obtener evento:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener evento' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/eventos/[id] - Actualizar un evento
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de evento inválido' },
        { status: 400 }
      );
    }

    // Verificar que el evento existe
    const checkQuery = 'SELECT * FROM eventos WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    const body: ActualizarEventoRequest = await request.json();

    // Sanitizar datos
    const datosSanitizados = EventoValidator.sanitizarDatos(body);

    // Validar datos
    const validacion = EventoValidator.validarActualizarEvento(datosSanitizados);
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

    // Validar fecha futura si se proporcionan fecha y hora
    if (datosSanitizados.fecha && datosSanitizados.hora) {
      if (!EventoValidator.validarFechaFutura(datosSanitizados.fecha, datosSanitizados.hora)) {
        return NextResponse.json(
          {
            success: false,
            message: 'La fecha y hora del evento no puede ser en el pasado'
          },
          { status: 400 }
        );
      }
    }

    // Construir query de actualización
    const campos: string[] = [];
    const valores: any[] = [];
    let paramIndex = 1;

    if (datosSanitizados.nombre !== undefined) {
      campos.push(`nombre = $${paramIndex}`);
      valores.push(datosSanitizados.nombre);
      paramIndex++;
    }

    if (datosSanitizados.descripcion !== undefined) {
      campos.push(`descripcion = $${paramIndex}`);
      valores.push(datosSanitizados.descripcion || null);
      paramIndex++;
    }

    if (datosSanitizados.fecha !== undefined) {
      campos.push(`fecha = $${paramIndex}`);
      valores.push(datosSanitizados.fecha);
      paramIndex++;
    }

    if (datosSanitizados.hora !== undefined) {
      campos.push(`hora = $${paramIndex}`);
      valores.push(datosSanitizados.hora);
      paramIndex++;
    }

    if (datosSanitizados.activo !== undefined) {
      campos.push(`activo = $${paramIndex}`);
      valores.push(datosSanitizados.activo);
      paramIndex++;
    }

    if (campos.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    campos.push(`updated_at = CURRENT_TIMESTAMP`);
    valores.push(id);

    const updateQuery = `
      UPDATE eventos 
      SET ${campos.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(updateQuery, valores);
    const evento: EventoResponse = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: evento
    });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    return NextResponse.json(
      { success: false, message: 'Error al actualizar evento' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/eventos/[id] - Eliminar un evento (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de evento inválido' },
        { status: 400 }
      );
    }

    // Verificar que el evento existe
    const checkQuery = 'SELECT * FROM eventos WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete: marcar como inactivo
    const deleteQuery = `
      UPDATE eventos 
      SET activo = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(deleteQuery, [id]);
    const evento: EventoResponse = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Evento eliminado exitosamente',
      data: evento
    });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    return NextResponse.json(
      { success: false, message: 'Error al eliminar evento' },
      { status: 500 }
    );
  }
}