export function jsonResponse(
  request: Request,
  env: { ALLOWED_ORIGIN?: string; ALLOWED_ORIGINS?: string },
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
  env: { ALLOWED_ORIGIN?: string; ALLOWED_ORIGINS?: string },
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

export function corsHeaders(
  request: Request,
  env: { ALLOWED_ORIGIN?: string; ALLOWED_ORIGINS?: string }
): HeadersInit {
  const origin = request.headers.get("origin");
  const allowedOrigins = getAllowedOrigins(env);
  const fallbackOrigin = allowedOrigins[0] ?? "https://impostor.localhost";
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : fallbackOrigin;

  return {
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
    "access-control-max-age": "86400",
    vary: "origin"
  };
}

function getAllowedOrigins(env: { ALLOWED_ORIGIN?: string; ALLOWED_ORIGINS?: string }): string[] {
  const configured = env.ALLOWED_ORIGINS ?? env.ALLOWED_ORIGIN ?? "https://impostor.localhost";
  const origins = configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : ["https://impostor.localhost"];
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}
