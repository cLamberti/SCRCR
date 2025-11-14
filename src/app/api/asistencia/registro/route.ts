import { NextRequest, NextResponse } from "next/server";
import { AsistenciaService, AsistenciaServiceError } from "@/services/asistencia.service";
import { RegistroAsistenciaRequest } from "@/dto/asistencia.dto";

const asistenciaService = new AsistenciaService();

export async function POST(request: NextRequest) {
  try {
    const body: RegistroAsistenciaRequest = await request.json();
    const resultado = await asistenciaService.registroAsistencia(body);

    return NextResponse.json(
      { success: true, message: resultado.message, data: resultado.data },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AsistenciaServiceError) {
      return NextResponse.json(
        { success: false, message: error.message, errors: error.errors ?? [] },
        { status: error.statusCode ?? 400 }
      );
    }
    console.error("Error en POST /api/asistencia/registro:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor al registrar asistencia." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Ruta de listado de asistencia no implementada" },
    { status: 200 }
  );
}
