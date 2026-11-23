/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Liveness of the storefront and its link to the API (for the load balancer / uptime checks). */
export async function GET() {
  const url = (
    process.env['API_INTERNAL_URL'] ?? 'http://127.0.0.1:4000/api/v1'
  ).replace(/\/$/, '');
  let api: 'ok' | 'down' = 'down';
  try {
    const res = await fetch(`${url}/health/live`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    api = res.ok ? 'ok' : 'down';
  } catch {
    api = 'down';
  }
  return NextResponse.json(
    { status: api === 'ok' ? 'ok' : 'degraded', api },
    {
      status: api === 'ok' ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
