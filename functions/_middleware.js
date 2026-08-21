// Passwortschutz für die ganze Seite (Cloudflare Pages Function).
// Liegt unter  functions/_middleware.js  und läuft automatisch vor jeder Anfrage.
//
// Passwort setzen — zwei Wege:
//  A) EMPFOHLEN: In Cloudflare → dein Pages-Projekt → Settings → Variables and Secrets
//     eine Variable  SITE_PASSWORD  mit deinem Passwort anlegen, dann neu deployen.
//  B) EINFACH:   Trag dein Passwort hier direkt ein (in die Anführungszeichen).
//     Nachteil: es steht dann im Repo.
const HARDCODED_PASSWORD = "";

const COOKIE = "site_auth";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 Tage eingeloggt bleiben

async function tokenFor(pw) {
  const data = new TextEncoder().encode("pedro-portfolio::" + pw);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function loginPage(showError) {
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Pedro Rodrigues</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;height:100dvh;display:flex;align-items:center;justify-content:center;
  background:#08080a;color:#f4f4f2;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
form{width:min(88vw,340px);text-align:center}
h1{font-weight:700;letter-spacing:.06em;font-size:19px;margin:0 0 6px;text-transform:uppercase}
p{color:#8a8a88;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin:0 0 26px}
input{width:100%;padding:14px;background:#111114;border:1px solid #26262a;color:#f4f4f2;
  border-radius:10px;font-size:16px;outline:none;text-align:center;letter-spacing:.04em}
input:focus{border-color:#5a5a5f}
button{width:100%;margin-top:10px;padding:14px;border:0;border-radius:10px;background:#f4f4f2;
  color:#08080a;font-weight:700;font-size:15px;letter-spacing:.02em;cursor:pointer}
.err{color:#e06a6a;font-size:12px;margin-top:14px;min-height:16px;letter-spacing:.03em}
</style></head><body>
<form method="POST" autocomplete="off">
  <h1>Pedro Rodrigues</h1>
  <p>Portfolio</p>
  <input type="password" name="password" placeholder="Passwort" autofocus autocomplete="current-password">
  <button type="submit">Ansehen</button>
  <div class="err">${showError ? "Falsches Passwort." : ""}</div>
</form></body></html>`;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const PASSWORD = (env && env.SITE_PASSWORD) || HARDCODED_PASSWORD;

  // Kein Passwort gesetzt -> Seite bleibt offen (kein Aussperren).
  if (!PASSWORD) return next();

  const expected = await tokenFor(PASSWORD);
  const cookie = request.headers.get("Cookie") || "";
  const authed = cookie.split(";").some(c => c.trim() === COOKIE + "=" + expected);
  if (authed) return next();

  if (request.method === "POST") {
    let pw = "";
    try { pw = (await request.formData()).get("password") || ""; } catch (e) {}
    if (pw === PASSWORD) {
      return new Response(null, {
        status: 302,
        headers: {
          "Location": new URL(request.url).pathname,
          "Set-Cookie": `${COOKIE}=${expected}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`
        }
      });
    }
    return new Response(loginPage(true), { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  return new Response(loginPage(false), { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
