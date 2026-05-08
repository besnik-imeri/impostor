export function jsonResponse(
  request: Request,
  env: { ALLOWED_ORIGIN?: string },
  body: unknown,
  init: ResponseInit = {}
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(request, env),
      ...init.headers
    }
  });
}

export function emptyResponse(
  request: Request,
  env: { ALLOWED_ORIGIN?: string },
  init: ResponseInit = {}
): Response {
  return new Response(null, {
    ...init,
    headers: {
      ...corsHeaders(request, env),
      ...init.headers
    }
  });
}

export function corsHeaders(request: Request, env: { ALLOWED_ORIGIN?: string }): HeadersInit {
  const origin = request.headers.get("origin");
  const allowedOrigin = env.ALLOWED_ORIGIN ?? "http://localhost:5173";

  return {
    "access-control-allow-origin": origin === allowedOrigin ? origin : allowedOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
    "access-control-max-age": "86400",
    vary: "origin"
  };
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}
