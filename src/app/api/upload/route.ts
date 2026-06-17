import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No se recibió ningún archivo.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Tipo de archivo no permitido. Use PDF, JPG o PNG.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ success: false, message: `El archivo excede el límite de ${MAX_SIZE_MB}MB.` }, { status: 400 });
    }

    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'pdf';
    const nombreLimpio = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const blobName = `actas/${timestamp}_${nombreLimpio}`;

    const blob = await put(blobName, file, { access: 'private' });

    return NextResponse.json({
      success: true,
      url: blob.url,
      nombreArchivo: file.name,
    });
  } catch (error: any) {
    console.error('POST /api/upload:', error);
    return NextResponse.json({ success: false, message: 'Error al subir el archivo.' }, { status: 500 });
  }
}
