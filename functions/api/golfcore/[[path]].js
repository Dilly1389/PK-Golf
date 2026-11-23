// Proxies /api/golfcore/* to api.golfcore.org/*, attaching the secret API key
// server-side. GolfCore's own key dialog says "never put it in an app or a
// web page" — this keeps it out of index.html, which is otherwise fully
// static/client-side. Key is set via `wrangler pages secret put GOLFCORE_API_KEY`,
// never committed to the repo.
export async function onRequest(context) {
  const { request, env, params } = context;
  const path = Array.isArray(params.path) ? params.path.join("/") : (params.path || "");
  const url = new URL(request.url);
  const target = `https://api.golfcore.org/${path}${url.search}`;

  const upstream = await fetch(target, {
    method: request.method,
    headers: { "Authorization": `Bearer ${env.GOLFCORE_API_KEY}` },
  });

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") || "application/json" },
  });
}
