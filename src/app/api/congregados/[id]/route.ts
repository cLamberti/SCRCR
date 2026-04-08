import { NextRequest, NextResponse } from 'next/server';
import { CongregadoService, CongregadoServiceError } from '@/services/congregado.service';
import { ActualizarCongregadoRequest } from '@/dto/congregado.dto';

const congregadoService = new CongregadoService();

type Params = Promise<{ id: string }>;

// GET /api/congregados/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam, 10);

        if (isNaN(id) || id <= 0) {
            return NextResponse.json(
                { success: false, message: 'ID de congregado inválido' },
                { status: 400 }
            );
        }

        const congregado = await congregadoService.obtenerPorId(id);
        return NextResponse.json({ success: true, data: congregado }, { status: 200 });

    } catch (error: any) {
        console.error('Error en GET /api/congregados/[id]:', error);
        const status = error instanceof CongregadoServiceError ? (error.statusCode || 500) : 500;
        return NextResponse.json(
            { success: false, message: error.message || 'Error al obtener congregado' },
            { status }
        );
    }
}

// PUT /api/congregados/[id]
export async function PUT(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam, 10);

        if (isNaN(id) || id <= 0) {
            return NextResponse.json(
                { success: false, message: 'ID de congregado inválido' },
                { status: 400 }
            );
        }

        const body: ActualizarCongregadoRequest = await request.json();
        const actualizado = await congregadoService.actualizar(id, body);

        return NextResponse.json(
            { success: true, data: actualizado, message: 'Congregado actualizado exitosamente.' },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Error en PUT /api/congregados/[id]:', error);
        const status = error instanceof CongregadoServiceError ? (error.statusCode || 500) : 500;
        return NextResponse.json(
            { success: false, message: error.message || 'Error al actualizar congregado', errors: error.errors },
            { status }
        );
    }
}

// DELETE /api/congregados/[id]?permanente=true
export async function DELETE(
    request: NextRequest,
    { params }: { params: Params }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam, 10);

        if (isNaN(id) || id <= 0) {
            return NextResponse.json(
                { success: false, message: 'ID de congregado inválido' },
                { status: 400 }
            );
        }

        const permanente = request.nextUrl.searchParams.get('permanente') === 'true';

        if (permanente) {
            await congregadoService.eliminarPermanente(id);
            return NextResponse.json(
                { success: true, message: 'Congregado eliminado permanentemente.' },
                { status: 200 }
            );
        }

        await congregadoService.eliminar(id);
        return NextResponse.json(
            { success: true, message: 'Congregado desactivado exitosamente.' },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Error en DELETE /api/congregados/[id]:', error);
        const status = error instanceof CongregadoServiceError ? (error.statusCode || 500) : 500;
        return NextResponse.json(
            { success: false, message: error.message || 'Error al eliminar congregado' },
            { status }
        );
    }
}