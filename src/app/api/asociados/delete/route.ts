/**
 * Controller para eliminar un asociado
 */
import { NextRequest, NextResponse } from 'next/server';
import { AsociadoDAO } from '@/dao/asociado.dao';
import { DeleteAsociadoValidator } from '@/validators/asociado.validator';
import { requireAuth } from '@/middleware/auth.middleware';

const asociadoDAO = new AsociadoDAO();

/**
 * DELETE /api/asociados/delete - Eliminar (soft/hard) un asociado
 * - id por query: /api/asociados/delete?id=123
 * - hard delete opcional: /api/asociados/delete?id=123&permanente=true
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación - solo usuarios logueados pueden eliminar
    const authResult = await requireAuth(request, ['admin', 'tesorero', 'pastorGeneral']);
    if (!authResult.success) {
      return authResult.response!;
    }
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id') ?? undefined;
    const permanenteParam = url.searchParams.get('permanente') ?? undefined;

    const { valid, errors, id: asociadoId, permanente } = DeleteAsociadoValidator.validar({
      id,
      permanente: permanenteParam,
    });

    if (!valid || !asociadoId) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID de asociado inválido',
          errors, // ej: ['El ID debe ser un número']
        },
        { status: 400 }
      );
    }

    // Hard delete (opcional)
    if (permanente) {
      const ok = await asociadoDAO.eliminarPermanente(asociadoId);

      if (!ok) {
        return NextResponse.json(
          {
            success: false,
            message: 'Asociado no encontrado',
            errors: ['No existe un asociado con este ID']
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Asociado eliminado exitosamente (permanente)'
      });
    }

    // Soft delete (estado = 0)
    const eliminado = await asociadoDAO.eliminar(asociadoId);

    if (!eliminado) {
      return NextResponse.json(
        {
          success: false,
          message: 'Asociado no encontrado',
          errors: ['No existe un asociado con este ID']
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Asociado eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('Error al eliminar asociado:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error al eliminar el asociado',
        errors: [error.message]
      },
      { status: 500 }
    );
  }
}