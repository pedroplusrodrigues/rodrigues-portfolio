// Passwortschutz für die ganze Seite (Cloudflare Pages Function).
// Liegt unter  functions/_middleware.js  und läuft automatisch vor jeder Anfrage.
//
// Passwort setzen — zwei Wege:
//  A) EMPFOHLEN: In Cloudflare → dein Pages-Projekt → Settings → Variables and Secrets
//     eine Variable  SITE_PASSWORD  mit deinem Passwort anlegen, dann neu deployen.
//  B) EINFACH:   Trag dein Passwort hier direkt ein (in die Anführungszeichen).
//     Nachteil: es steht dann im Repo.
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

function loginPage(showError) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Portfolio — Pedro Rodrigues</title>
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

.role{
  margin-top:14px;
  color:var(--fg);
  font-size:10px;
  line-height:1.35;
  letter-spacing:.055em;
}
.sources{
  margin-top:8px;
  color:var(--dim);
  font-size:9px;
  line-height:1.45;
  letter-spacing:.055em;
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
      <div class="role">Freelance Retouch &amp; Compositing Artist — Hamburg</div>
      <div class="sources">Photography. &nbsp; CGI. &nbsp; AI Image Creation.</div>
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

  // Impressum/Datenschutz immer öffentlich
  if (PUBLIC_PATHS.includes(url.pathname) || PUBLIC_PREFIXES.some(prefix => url.pathname.startsWith(prefix))) return next();

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
          "Location": url.pathname,
          "Set-Cookie": `${COOKIE}=${expected}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`
        }
      });
    }
    return new Response(loginPage(true), { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  return new Response(loginPage(false), { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
