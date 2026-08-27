// functions/_middleware.js — Cloudflare Pages shared-password gate
// Set the password in Cloudflare → Pages → Settings → Environment variables → SITE_PASSWORD
// Impressum & Datenschutz stay public (legally required to be reachable without login).

const COOKIE = "rp_auth";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const PUBLIC = ["/impressum.html", "/datenschutz.html", "/favicon.ico", "/robots.txt"];

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function loginPage(wrong) {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pedro Rodrigues</title>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600&family=IBM+Plex+Mono&display=swap" rel="stylesheet">
<style>
:root{--bg:#0a0a0b;--ink:#f3f1ec;--dim:rgba(243,241,236,.5);--line:rgba(243,241,236,.18);--accent:#c9a15f}
*{box-sizing:border-box}html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--ink);display:flex;align-items:center;justify-content:center;font-family:"IBM Plex Mono",monospace}
.box{width:min(360px,88vw);text-align:center;padding:20px}
.name{font-family:"Oswald",sans-serif;text-transform:uppercase;letter-spacing:.12em;font-size:22px;font-weight:600;margin:0 0 4px}
.tag{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--dim);margin:0 0 34px}
input{width:100%;background:transparent;border:0;border-bottom:1px solid var(--line);color:var(--ink);font-family:inherit;font-size:15px;letter-spacing:.1em;text-align:center;padding:12px 4px;outline:none}
input:focus{border-bottom-color:var(--accent)}
button{margin-top:22px;width:100%;background:var(--ink);color:#0a0a0b;border:0;padding:13px;font-family:"Oswald",sans-serif;text-transform:uppercase;letter-spacing:.16em;font-size:13px;cursor:pointer}
.err{color:var(--accent);font-size:12px;letter-spacing:.06em;margin-top:16px;min-height:16px}
</style></head><body>
<form class="box" method="POST" action="">
  <p class="name">Pedro Rodrigues</p>
  <p class="tag">Retouch &amp; Compositing</p>
  <input type="password" name="password" placeholder="Passwort" autofocus autocomplete="current-password">
  <button type="submit">Ansehen</button>
  <p class="err">${wrong ? "Falsches Passwort." : ""}</p>
</form></body></html>`;
  return new Response(html, {
    status: wrong ? 401 : 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const pass = env.SITE_PASSWORD || "";
  const expected = pass ? await sha256Hex(pass) : "";

  // always-public pages
  if (PUBLIC.includes(url.pathname)) return next();

  // login submit
  if (request.method === "POST") {
    const form = await request.formData();
    const given = (form.get("password") || "").toString();
    if (pass && given === pass) {
      const headers = new Headers({ Location: url.pathname || "/" });
      headers.append(
        "Set-Cookie",
        `${COOKIE}=${expected}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`
      );
      return new Response(null, { status: 303, headers });
    }
    return loginPage(true);
  }

  // valid session cookie?
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(new RegExp(`${COOKIE}=([a-f0-9]+)`));
  if (expected && m && m[1] === expected) return next();

  // otherwise: show login
  return loginPage(false);
}
