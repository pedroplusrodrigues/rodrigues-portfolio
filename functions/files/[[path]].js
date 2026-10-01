const SEAFILE_BASE = "https://cloud.rodrigues.de";

export async function onRequest(context) {
  const p = context.params?.path;

  const parts = Array.isArray(p)
    ? p.filter(Boolean)
    : String(p || "").split("/").filter(Boolean);

  if (parts.length !== 1) {
    return new Response("Not found", { status: 404 });
  }

  const token = parts[0];

  if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) {
    return new Response("Invalid download link", { status: 400 });
  }

  return Response.redirect(
    `${SEAFILE_BASE}/d/${encodeURIComponent(token)}/`,
    302
  );
}
