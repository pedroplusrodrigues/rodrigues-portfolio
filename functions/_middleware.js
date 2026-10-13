// Passwortschutz für die ganze Seite (Cloudflare Pages Function).
// Liegt unter  functions/_middleware.js  und läuft automatisch vor jeder Anfrage.
//
// Passwortschutz:
//  A) EMPFOHLEN: SITE_PASSWORDS als Cloudflare Secret anlegen.
//     Erwartet JSON, z. B. {"Access-01":"code1","Access-02":"code2"}.
//     Die Bezeichnungen links sind nur intern; im Login gibt es weiterhin nur EIN Passwortfeld.
//  B) SITE_PASSWORD bleibt vorerst als Legacy-Fallback unterstützt.
//  C) Optional kann ein einzelnes Passwort hier hart codiert werden (nicht empfohlen).
const HARDCODED_PASSWORD = "";

// Diese Pfade sind IMMER ohne Passwort erreichbar (Impressum/Datenschutz müssen öffentlich sein).
const PUBLIC_PATHS = ["/impressum", "/impressum.html", "/datenschutz", "/datenschutz.html"];
const PUBLIC_PREFIXES = ["/fonts/"];

const COOKIE = "site_auth";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 Tage eingeloggt bleiben

async function tokenFor(pw) {
  const data = new TextEncoder().encode("pedro-portfolio::" + pw);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function configuredPasswords(env) {
  const passwords = [];

  // Neue Variante: mehrere benannte Zugangscodes aus SITE_PASSWORDS.
  const raw = env && env.SITE_PASSWORDS;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const values = Array.isArray(parsed)
        ? parsed
        : (parsed && typeof parsed === "object" ? Object.values(parsed) : []);

      for (const value of values) {
        if (typeof value === "string" && value.length > 0) passwords.push(value);
      }
    } catch (e) {
      // Bei fehlerhaftem JSON bleibt der alte SITE_PASSWORD-Fallback nutzbar.
    }
  }

  // Legacy-Fallback während der Umstellung.
  const legacy = (env && env.SITE_PASSWORD) || HARDCODED_PASSWORD;
  if (legacy) passwords.push(legacy);

  return [...new Set(passwords)];
}

function cookieValue(header, name) {
  const parts = (header || "").split(";");
  for (const part of parts) {
    const item = part.trim();
    if (item.startsWith(name + "=")) return item.slice(name.length + 1);
  }
  return "";
}

function loginPage(showError) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Private Portfolio — Pedro Rodrigues</title>
<style>
@font-face{
  font-family:"Phosphate";
  src:url("/fonts/Phosphate.woff2") format("woff2"),
      url("/fonts/Phosphate.woff") format("woff"),
      url("/fonts/Phosphate.otf") format("opentype");
  font-display:swap;
}
:root{
  color-scheme:dark;
  --bg:#08080a;
  --fg:#f4f4f2;
  --dim:#8f8f91;
  --line:#2a2a2f;
  --yellow:#e8ff00;
}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:var(--bg)}
body{
  min-height:100dvh;
  color:var(--fg);
  font-family:"Courier New",ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
  -webkit-font-smoothing:antialiased;
}
.page{
  min-height:100dvh;
  display:grid;
  grid-template-rows:auto 1fr auto;
  padding:clamp(18px,3vw,38px);
}
.top{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:20px;
}
.name{
  margin:0;
  font-family:"Phosphate","Arial Black","Helvetica Neue",Arial,sans-serif;
  font-size:clamp(28px,4.6vw,62px);
  font-weight:400;
  line-height:.86;
  letter-spacing:-.015em;
  text-transform:uppercase;
}
.mark{
  width:clamp(46px,7vw,88px);
  height:7px;
  margin-top:4px;
  background:var(--yellow);
}
.center{
  display:flex;
  align-items:center;
  justify-content:center;
  padding:clamp(42px,8vh,90px) 0;
}
.panel{
  width:min(100%,720px);
}
.kicker{
  margin:0 0 12px;
  color:var(--yellow);
  font-size:10px;
  font-weight:700;
  letter-spacing:.18em;
  text-transform:uppercase;
}
h1{
  margin:0;
  font-family:"Helvetica Neue",Arial,sans-serif;
  font-size:clamp(25px,3.2vw,42px);
  font-weight:800;
  line-height:.92;
  letter-spacing:-.045em;
  text-transform:uppercase;
}
.copy{
  max-width:none;
  margin:16px 0 34px;
  white-space:nowrap;
  color:var(--dim);
  font-size:12px;
  line-height:1.55;
}
form{margin:0}
.field{
  display:grid;
  grid-template-columns:1fr auto;
  border-top:2px solid var(--fg);
  border-bottom:2px solid var(--fg);
}
input{
  min-width:0;
  width:100%;
  padding:17px 0;
  border:0;
  outline:0;
  background:transparent;
  color:var(--fg);
  font:inherit;
  font-size:14px;
  letter-spacing:.04em;
}
input::placeholder{color:#66666a}
button{
  margin:0;
  padding:0 4px 0 24px;
  border:0;
  background:transparent;
  color:var(--yellow);
  font:inherit;
  font-size:11px;
  font-weight:700;
  letter-spacing:.1em;
  text-transform:uppercase;
  cursor:pointer;
  white-space:nowrap;
}
button:hover{color:var(--fg)}
.err{
  min-height:20px;
  padding-top:10px;
  color:#ff6b6b;
  font-size:10px;
  letter-spacing:.04em;
}
.bottom{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:28px;
  padding-top:20px;
  border-top:1px solid var(--line);
  color:var(--dim);
  font-size:10px;
  line-height:1.5;
}
.links{
  display:flex;
  flex-wrap:wrap;
  gap:9px 16px;
}
.bottom a{
  color:var(--dim);
  text-decoration:none;
}
.bottom a:hover{color:var(--fg)}
.access{text-align:right}
.access a{
  color:var(--fg);
  border-bottom:1px solid #45454a;
}
.access a:hover{border-color:var(--fg)}
@media(max-width:600px){
  .page{padding:18px}
  .copy{white-space:normal}
  .center{align-items:center;padding:54px 0}
  .field{grid-template-columns:1fr}
  button{
    padding:0 0 14px;
    text-align:left;
  }
  .bottom{
    align-items:flex-start;
    flex-direction:column;
  }
  .access{text-align:left}
}
</style>
</head>
<body>
<div class="page">
  <header class="top">
    <div>
      <div class="name">PEDRO<br>RODRIGUES</div>
    </div>
    <div class="mark" aria-hidden="true"></div>
  </header>

  <main class="center">
    <section class="panel">
      <div class="kicker">Private access</div>
      <h1>Portfolio</h1>
      <p class="copy">Selected commercial work is password protected.</p>

      <form method="POST" autocomplete="off">
        <div class="field">
          <input
            type="password"
            name="password"
            placeholder="PASSWORD"
            autofocus
            autocomplete="current-password"
            aria-label="Password">
          <button type="submit">Enter Portfolio →</button>
        </div>
        <div class="err" role="status">${showError ? "Incorrect password." : ""}</div>
      </form>
    </section>
  </main>

  <footer class="bottom">
    <nav class="links" aria-label="Legal">
      <a href="/impressum">Impressum</a>
      <a href="/datenschutz">Datenschutz</a>
      <a href="mailto:pedro@rodrigues.de">Contact</a>
    </nav>
    <div class="access">
      For portfolio access:
      <a href="mailto:pedro@rodrigues.de">pedro@rodrigues.de</a>
    </div>
  </footer>
</div>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Canonical Domain: www immer auf die Hauptdomain umleiten.
  if (url.hostname === "www.rodrigues.de") {
    return Response.redirect(`https://rodrigues.de${url.pathname}${url.search}`, 301);
  }

  // Impressum/Datenschutz und Fonts immer öffentlich.
  if (
    PUBLIC_PATHS.includes(url.pathname) ||
    PUBLIC_PREFIXES.some(prefix => url.pathname.startsWith(prefix))
  ) {
    return next();
  }

  const passwords = configuredPasswords(env);

  // Kein Passwort gesetzt -> Seite bleibt offen (kein Aussperren).
  if (passwords.length === 0) return next();

  // Cookie ist an den konkreten Zugangscode gebunden.
  // Wird ein Code aus SITE_PASSWORDS entfernt/geändert, ist genau dessen Cookie sofort ungültig.
  const validTokens = await Promise.all(passwords.map(tokenFor));
  const currentToken = cookieValue(request.headers.get("Cookie") || "", COOKIE);

  if (currentToken && validTokens.includes(currentToken)) {
    return next();
  }

  if (request.method === "POST") {
    let pw = "";
    try {
      pw = (await request.formData()).get("password") || "";
    } catch (e) {}

    const matched = passwords.find(candidate => candidate === pw);

    if (matched) {
      const token = await tokenFor(matched);

      return new Response(null, {
        status: 302,
        headers: {
          "Location": url.pathname + url.search,
          "Set-Cookie": `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`
        }
      });
    }

    return new Response(loginPage(true), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  return new Response(loginPage(false), {
    status: 401,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
