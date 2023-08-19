export const runtime = 'edge'; // 'nodejs' is the default
export const preferredRegion = 'iad1'; // only execute this function on iad1
export const dynamic = 'force-dynamic'; // no caching
 
export function GET(request: Request) {
  return new Response(`I am an Edge Function!`, {
    status: 200,
  });
}