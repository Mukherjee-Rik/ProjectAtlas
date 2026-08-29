import { type NextRequest, NextResponse } from 'next/server';

// This route is a pass-through to the Atlas API; nothing about it is static.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EXPLICIT_BACKEND_URL = process.env.BACKEND_URL || process.env.API_INTERNAL_URL;

const PRIMARY_BACKEND_URL = EXPLICIT_BACKEND_URL || 'http://127.0.0.1:4002/api/v1';

/**
 * Last-resort target, used only when the primary is unreachable at the socket
 * level. The hardcoded default is retained because existing deployments may
 * still depend on it, but relying on it means production traffic silently
 * crosses into another environment's API — set BACKEND_URL explicitly and
 * then drop this default.
 */
const FALLBACK_BACKEND_URL =
  process.env.BACKEND_FALLBACK_URL ||
  'https://projectatlas-production-0c80.up.railway.app/api/v1';

if (!EXPLICIT_BACKEND_URL && process.env.NODE_ENV === 'production') {
  console.warn(
    '[proxy] BACKEND_URL is not set in a production build. Requests will attempt localhost first and then fall back to the hardcoded Railway API. Set BACKEND_URL to remove this ambiguity.',
  );
}

/** Stops a stalled upstream from pinning a Next.js server thread indefinitely. */
const UPSTREAM_TIMEOUT_MS = Number(process.env.BACKEND_TIMEOUT_MS ?? 30_000);

/**
 * Hop-by-hop headers are connection-scoped and must not be forwarded.
 * Content-encoding/length are dropped separately because we hand the body
 * through as a stream and let the runtime frame it.
 */
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'expect',
]);

function buildForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'host' || lower === 'content-length' || HOP_BY_HOP.has(lower)) {
      return;
    }
    headers.set(key, value);
  });

  return headers;
}

function buildResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    // The body is re-framed by this runtime, so the upstream's encoding and
    // chunking headers no longer describe what we are sending.
    if (lower === 'content-encoding' || lower === 'content-length' || HOP_BY_HOP.has(lower)) {
      return;
    }
    if (lower === 'set-cookie') {
      headers.append(key, value);
    } else {
      headers.set(key, value);
    }
  });

  return headers;
}

async function forward(
  targetUrl: string,
  request: NextRequest,
  headers: Headers,
  body: ArrayBuffer | undefined,
): Promise<Response> {
  const init: RequestInit = {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  };
  return fetch(targetUrl, init);
}

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const targetPath = path.join('/');
  const search = request.nextUrl.search;

  const forwardHeaders = buildForwardHeaders(request);

  const body =
    request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.arrayBuffer()
      : undefined;

  const primaryUrl = `${PRIMARY_BACKEND_URL.replace(/\/+$/, '')}/${targetPath}${search}`;

  let upstream: Response | null = null;
  let lastError: unknown = null;

  try {
    upstream = await forward(primaryUrl, request, forwardHeaders, body);
  } catch (err: any) {
    lastError = err;
    const causeMsg = err?.cause ? ` (cause: ${err.cause.message || err.cause})` : '';
    const message = (err instanceof Error ? err.message : String(err)) + causeMsg;
    console.warn(`[proxy] primary backend unreachable (${primaryUrl}): ${message}`);

    if (FALLBACK_BACKEND_URL && FALLBACK_BACKEND_URL !== PRIMARY_BACKEND_URL) {
      const fallbackUrl = `${FALLBACK_BACKEND_URL.replace(/\/+$/, '')}/${targetPath}${search}`;
      try {
        upstream = await forward(fallbackUrl, request, forwardHeaders, body);
        console.warn(`[proxy] served from fallback backend: ${fallbackUrl}`);
      } catch (fallbackErr: any) {
        lastError = fallbackErr;
        const fallbackCauseMsg = fallbackErr?.cause
          ? ` (cause: ${fallbackErr.cause.message || fallbackErr.cause})`
          : '';
        const fallbackMessage =
          (fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)) + fallbackCauseMsg;
        console.error(`[proxy] fallback backend unreachable (${fallbackUrl}): ${fallbackMessage}`);
      }
    }
  }

  if (!upstream) {
    const timedOut = lastError instanceof Error && lastError.name === 'TimeoutError';

    return NextResponse.json(
      {
        success: false,
        statusCode: timedOut ? 504 : 503,
        error: timedOut
          ? 'The Atlas API did not respond in time. Please try again.'
          : 'Unable to reach the Atlas API. Please try again shortly.',
      },
      { status: timedOut ? 504 : 503 },
    );
  }

  // Stream the body straight through rather than buffering the whole payload
  // in memory first — this cuts time-to-first-byte on large list responses.
  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: buildResponseHeaders(upstream),
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
