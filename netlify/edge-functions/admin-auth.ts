import type { Context } from "https://edge.netlify.com";

const SENHA = Deno.env.get("ADMIN_PASSWORD") ?? "";

export default async (request: Request, context: Context) => {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Basic ")) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Sacolas MJ Admin"' },
    });
  }

  const decoded = atob(authHeader.slice(6));
  const [, senha] = decoded.split(":");

  if (!timingSafeEqual(senha ?? "", SENHA)) {
    return new Response("Forbidden", { status: 403 });
  }

  return context.next();
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export const config = { path: "/admin/*" };
