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
const PUBLIC_PATHS = ["/impressum", "/impressum.html", "/datenschutz", "/datenschutz.html", "/lab"];
const PUBLIC_PREFIXES = ["/fonts/", "/files/", "/lab/"];

const COOKIE = "site_auth";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 Tage eingeloggt bleiben

async function tokenFor(pw) {
  const data = new TextEncoder().encode("pedro-portfolio::" + pw);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function configuredPasswords(env) {
  const passwords = [];

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
      // Falsches JSON sperrt nicht aus; der alte SITE_PASSWORD bleibt als Fallback nutzbar.
    }
  }

  const legacy = (env && env.SITE_PASSWORD) || HARDCODED_PASSWORD;
  if (legacy) passwords.push(legacy);

  return [...new Set(passwords)];
}

function cookieValue(header, name) {
  for (const part of (header || "").split(";")) {
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
<title>Pedro Rodrigues — Access</title>
<style>
@font-face{
  font-family:"Phosphate";
  src:url("/fonts/Phosphate.woff2") format("woff2"),
      url("/fonts/Phosphate.woff") format("woff"),
      url("/fonts/Phosphate.otf") format("opentype");
  font-weight:400;
  font-style:normal;
  font-display:swap;
}
@font-face{
  font-family:"RockwellBold";
  src:local("Rockwell Bold"),
      local("Rockwell-Bold"),
      local("Rockwell Std Bold"),
      url("/fonts/Rockwell-Bold.woff2") format("woff2"),
      url("/fonts/Rockwell-Bold.woff") format("woff"),
      url("/fonts/Rockwell-Bold.otf") format("opentype"),
      url("/fonts/Rockwell-Bold.ttf") format("truetype"),
      url("/fonts/Rockwell.ttc") format("collection");
  font-weight:700;
  font-style:normal;
  font-display:swap;
}

:root{
  color-scheme:dark;
  --black:#0a0a0b;
  --surface:#151518;
  --white:#f4f4ef;
  --yellow:#ffd800;
  --dim:#a0a0a3;
  --display:"Phosphate","Arial Black",sans-serif;
  --rock:"RockwellBold","Rockwell","Rockwell Std",Georgia,"Times New Roman",serif;
}

*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:var(--black)}
body{
  min-height:100dvh;
  color:var(--white);
  font-family:var(--rock);
  font-weight:700;
  -webkit-font-smoothing:antialiased;
}

.page{
  min-height:100dvh;
  padding:10px;
  display:grid;
  grid-template-rows:auto 1fr auto;
  gap:10px;
  background:var(--black);
}

.hero{
  min-height:250px;
  padding:26px;
  background:var(--black);
  color:var(--white);
  display:grid;
  grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);
  gap:34px;
  align-items:end;
}

.identity{
  display:inline-block;
  font-family:var(--display);
  font-weight:400;
  font-style:normal;
  font-size:clamp(39px,6.15vw,88px);
  line-height:.83;
  letter-spacing:.005em;
  text-transform:uppercase;
}

.roleline{
  font-family:var(--rock);
  font-weight:700;
  margin-top:12px;
  font-size:clamp(13px,1.2vw,16px);
  line-height:1.28;
}

.copyflow{
  width:100%;
  max-width:700px;
  min-width:0;
}

.scope-services{
  display:grid;
  grid-template-columns:minmax(0,1fr) 5px minmax(0,1fr);
  gap:18px;
  align-items:stretch;
  width:100%;
  min-width:0;
}

.scopeblock,
.serviceblock{
  min-width:0;
  display:grid;
  gap:7px;
  align-content:end;
}

.copylabel{
  padding-block:2px;
  font-size:10px;
  font-weight:700;
  line-height:1.25;
  letter-spacing:.1em;
  text-transform:uppercase;
  opacity:.62;
  overflow:visible;
}

.copyline{
  min-width:0;
  max-width:100%;
  font-size:clamp(13px,1.2vw,16px);
  font-weight:700;
  line-height:1.48;
  white-space:normal;
  overflow-wrap:break-word;
}

.flowmark{
  width:5px;
  min-height:86px;
  background:var(--yellow);
}

.access{
  background:var(--black);
  color:var(--white);
  padding:clamp(28px,4vw,52px) 26px;
  display:flex;
  align-items:center;
}

.portal-grid{
  width:100%;
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:12px;
}

.portal-card{
  min-width:0;
  min-height:320px;
  padding:24px;
  background:#111114;
  display:flex;
  flex-direction:column;
  border-top:4px solid var(--surface);
}

.portal-card.primary{border-top-color:var(--yellow)}

.kicker{
  margin:0 0 12px;
  color:var(--yellow);
  font-size:10px;
  font-weight:700;
  line-height:1.2;
  letter-spacing:.1em;
  text-transform:uppercase;
}

.portal-card h1,
.portal-card h2{
  margin:0;
  font-family:var(--rock);
  font-size:clamp(26px,2.5vw,38px);
  font-weight:700;
  line-height:.95;
  text-transform:uppercase;
}

.card-copy{
  margin:14px 0 26px;
  color:var(--dim);
  font-size:13px;
  font-weight:700;
  line-height:1.5;
}

.card-spacer{flex:1}

.stack-form{
  display:grid;
  grid-template-columns:1fr;
  gap:10px;
}

input{
  min-width:0;
  width:100%;
  padding:15px 16px;
  border:0;
  outline:0;
  background:#1b1b1f;
  color:var(--white);
  font:inherit;
  font-size:15px;
  font-weight:700;
}

input::placeholder{color:#6d6d71}

button,
.card-action{
  min-height:48px;
  padding:14px 16px;
  border:0;
  background:#1b1b1f;
  color:var(--yellow);
  font:inherit;
  font-size:12px;
  font-weight:700;
  line-height:1.2;
  text-transform:uppercase;
  text-decoration:none;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:flex-start;
}

button:hover,
.card-action:hover{color:var(--white)}

.err{
  min-height:20px;
  padding-top:10px;
  color:#ff7474;
  font-size:10px;
}

.panel-access{
  margin-top:18px;
  display:flex;
  flex-wrap:wrap;
  gap:6px 10px;
  align-items:baseline;
  color:var(--dim);
  font-size:10px;
  font-weight:700;
  line-height:1.5;
  text-transform:uppercase;
  letter-spacing:.05em;
}

.panel-access a{color:var(--white);text-decoration:none}
.panel-access a:hover{color:var(--yellow)}

.bottom{
  background:var(--black);
  color:var(--dim);
  padding:18px 26px 20px;
  display:flex;
  align-items:flex-end;
  justify-content:flex-start;
  gap:28px;
  font-size:10px;
  font-weight:700;
  line-height:1.5;
  text-transform:uppercase;
  letter-spacing:.05em;
}

.links{display:flex;gap:10px 16px;flex-wrap:wrap}
.bottom a{color:inherit;text-decoration:none}
.bottom a:hover{color:var(--white)}

@media(max-width:1100px){
  .hero{grid-template-columns:1fr}
  .copyflow{margin-top:16px;max-width:760px}
  .portal-grid{grid-template-columns:1fr 1fr}
  .portal-card:last-child{grid-column:1/-1}
}

@media(max-width:760px){
  .scope-services{grid-template-columns:1fr;gap:10px}
  .scope-services .flowmark{width:52px;height:4px;min-height:4px}
  .portal-grid{grid-template-columns:1fr}
  .portal-card:last-child{grid-column:auto}
}

@media(max-width:600px){
  .page{padding:7px;gap:7px}
  .hero{padding:22px;min-height:0}
  .access{padding:28px 14px}
  .portal-card{min-height:0;padding:22px}
  .bottom{padding:18px 22px;align-items:flex-start;flex-direction:column}
}
</style>
</head>
<body>
<div class="page">

  <header class="hero">
    <div>
      <div class="identity">PEDRO<br>RODRIGUES</div>
      <div class="roleline">Freelance Retouch &amp; Compositing Artist</div>
    </div>

    <div class="copyflow">
      <div class="scope-services">
        <div class="scopeblock">
          <div class="copylabel">Working Across</div>
          <div class="copyline">Automotive. People. Advertising. Food. Still Life. Beauty. AI.</div>
        </div>
        <div class="flowmark" aria-hidden="true"></div>
        <div class="serviceblock">
          <div class="copylabel">Post-Production</div>
          <div class="copyline">High-End Retouch. Compositing. CGI. Generative Workflows.</div>
        </div>
      </div>
    </div>
  </header>

  <main class="access">
    <div class="portal-grid">

      <section class="portal-card primary">
        <div class="kicker">Private access</div>
        <h1>Portfolio</h1>
        <p class="card-copy">Selected commercial work is password protected.</p>
        <div class="card-spacer"></div>

        <form method="POST" autocomplete="off" class="stack-form">
          <input
            type="password"
            name="password"
            placeholder="PASSWORD"
            autofocus
            autocomplete="current-password"
            aria-label="Password">
          <button type="submit">Enter Portfolio →</button>
        </form>
        <div class="err" role="status">${showError ? "Incorrect password." : ""}</div>

        <div class="panel-access">
          <span>For portfolio access:</span>
          <a href="mailto:pedro@rodrigues.de">pedro@rodrigues.de</a>
        </div>
      </section>

      <section class="portal-card">
        <div class="kicker">Client transfer</div>
        <h2>Client Files</h2>
        <p class="card-copy">Download delivered files and upload project material.</p>
        <div class="card-spacer"></div>

        <form class="stack-form" onsubmit="event.preventDefault();var v=this.elements.code.value.trim();if(!v)return;var m=v.match(/\\/files\\/([^/?#]+)|\\/d\\/([^/?#]+)/);var c=(m&&(m[1]||m[2]))||v;location.href='/files/'+encodeURIComponent(c)+'/';">
          <input type="text" name="code" placeholder="PROJECT CODE" autocomplete="off" aria-label="Project code">
          <button type="submit">Open Files →</button>
        </form>
      </section>

      <section class="portal-card">
        <div class="kicker">Generative work</div>
        <h2>AI Lab</h2>
        <p class="card-copy">Generative imaging, AI-assisted retouching and experimental workflows.</p>
        <div class="card-spacer"></div>
        <a class="card-action" href="/lab/">Enter AI Lab →</a>
      </section>

    </div>
  </main>

  <footer class="bottom">
    <nav class="links" aria-label="Legal">
      <a href="/impressum">Impressum</a>
      <a href="/datenschutz">Datenschutz</a>
      <a href="mailto:pedro@rodrigues.de">Contact</a>
    </nav>
  </footer>

</div>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Canonical Domain
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

  // Kein Passwort gesetzt -> Seite bleibt offen.
  if (passwords.length === 0) return next();

  // Der Cookie ist an den konkreten Zugangscode gebunden.
  // Wird ein Code entfernt/geändert, verliert nur dieser Cookie seine Gültigkeit.
  const validTokens = await Promise.all(passwords.map(tokenFor));
  const currentToken = cookieValue(request.headers.get("Cookie") || "", COOKIE);

  if (currentToken && validTokens.includes(currentToken)) return next();

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