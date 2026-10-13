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

  const validShape = /^[A-Za-z0-9_-]{16,128}$/.test(token);
  const isCheck = new URL(context.request.url).searchParams.has("check");
  const json = (valid, status) => new Response(JSON.stringify({ valid }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });

  if (isCheck) {
    if (context.request.method !== "GET") return json(false, 405);
    if (!validShape) return json(false, 400);

    // The public folder-share endpoint distinguishes valid, unprotected
    // shares (200), password-protected shares (403) and unknown tokens (404).
    // Do not expose the file list to clients. Fail closed on upstream errors.
    try {
      const response = await fetch(
        `${SEAFILE_BASE}/api2/d/${encodeURIComponent(token)}/dir/?path=%2F`,
        {
          method: "GET",
          headers: { "Accept": "application/json" },
          redirect: "manual",
          signal: AbortSignal.timeout(7000)
        }
      );
      if (response.status === 404 || response.status === 410) return json(false, 404);
      if (response.status === 403) return json(false, 403);
      if (!response.ok) return json(false, 503);
      const data = await response.json();
      if (Array.isArray(data) || (data && typeof data === "object" && Array.isArray(data.dirent_list))) {
        return json(true, 200);
      }
      return json(false, 503);
    } catch (_) {
      return json(false, 503);
    }
  }

  if (!validShape) {
    return new Response("Invalid download link", { status: 400 });
  }

  return Response.redirect(
    `${SEAFILE_BASE}/d/${encodeURIComponent(token)}/`,
    302
  );
}
