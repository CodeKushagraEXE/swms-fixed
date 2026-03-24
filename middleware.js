const HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
]);

export const config = {
  matcher: ['/api/:path*', '/ws', '/ws/:path*'],
};

export default async function middleware(request) {
  const raw = process.env.BACKEND_URL;
  const backend = raw ? raw.replace(/\/$/, '') : '';
  if (!backend) {
    return new Response(
      JSON.stringify({
        message:
          'Server misconfiguration: set BACKEND_URL on Vercel (Spring API origin, e.g. https://your-api.railway.app)',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(request.url);
  const target = `${backend}${url.pathname}${url.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (HOP.has(key.toLowerCase())) return;
    headers.set(key, value);
  });

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const buf = await request.arrayBuffer();
    if (buf.byteLength) init.body = buf;
  }

  let upstream;
  try {
    upstream = await fetch(target, init);
  } catch {
    return new Response(
      JSON.stringify({ message: 'Backend unreachable. Check BACKEND_URL and that the API is running.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const out = new Headers(upstream.headers);
  out.delete('transfer-encoding');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}
