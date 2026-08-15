import { type NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.API_INTERNAL_URL ||
  'https://projectatlas-production-0c80.up.railway.app/api/v1';

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const targetPath = path.join('/');

  // Preserve query string
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}/${targetPath}${search}`;

  // Forward all headers except host (which must be the backend host)
  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host') {
      forwardHeaders.set(key, value);
    }
  });

  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.arrayBuffer()
      : undefined;

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers: forwardHeaders,
    body: body ? Buffer.from(body) : undefined,
    // @ts-expect-error — Node 18+ fetch duplex
    duplex: 'half',
  });

  const responseBody = await backendResponse.arrayBuffer();

  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    // Don't forward encoding headers — Next.js handles this
    if (['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
      return;
    }
    // Use append for set-cookie to preserve multiple cookies
    if (key.toLowerCase() === 'set-cookie') {
      responseHeaders.append(key, value);
    } else {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
