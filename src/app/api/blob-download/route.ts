import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const blobUrl = request.nextUrl.searchParams.get('url');

  if (!blobUrl) {
    return NextResponse.json({ error: 'URL requerida.' }, { status: 400 });
  }

  try {
    const response = await fetch(blobUrl, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Archivo no encontrado.' }, { status: 404 });
    }

    const contentType = response.headers.get('Content-Type') ?? 'application/octet-stream';
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error al obtener el archivo.' }, { status: 500 });
  }
}
