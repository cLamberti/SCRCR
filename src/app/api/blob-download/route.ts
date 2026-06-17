import { NextRequest, NextResponse } from 'next/server';

const BLOB_HOSTNAME_PATTERN = /^[a-z0-9-]+\.blob\.vercel-storage\.com$/i;

function isValidBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && BLOB_HOSTNAME_PATTERN.test(parsed.hostname);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const blobUrl = request.nextUrl.searchParams.get('url');

  if (!blobUrl) {
    return NextResponse.json({ error: 'URL requerida.' }, { status: 400 });
  }

  if (!isValidBlobUrl(blobUrl)) {
    return NextResponse.json({ error: 'URL no permitida.' }, { status: 400 });
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
