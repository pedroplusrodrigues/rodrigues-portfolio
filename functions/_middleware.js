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
  font-family:"PhosphateWeb";
  src:local("Phosphate Solid"),
      local("Phosphate-Solid"),
      url("/fonts/Phosphate.woff2") format("woff2"),
      url("/fonts/Phosphate.woff") format("woff"),
      url("/fonts/Phosphate.otf") format("opentype");
  font-weight:400;
  font-style:normal;
  font-display:swap;
}
@font-face{
  font-family:"RockwellBold";
  src:url("/fonts/Rockwell-Bold.woff2") format("woff2"),
      url("/fonts/Rockwell-Bold.woff") format("woff"),
      url("/fonts/Rockwell-Bold.otf") format("opentype"),
      url("/fonts/Rockwell-Bold.ttf") format("truetype"),
      url("/fonts/Rockwell.ttc") format("collection");
  font-weight:700;
  font-display:swap;
}
:root{
  color-scheme:dark;
  --black:#0a0a0b;
  --white:#f4f4ef;
  --yellow:#ffd800;
  --line:#2b2b2f;
  --dim:#a0a0a3;
  --display:"Phosphate Solid","PhosphateWeb","Phosphate","Arial Black",sans-serif;
  --rock:"RockwellBold",ui-monospace,"SF Mono",Menlo,Monaco,Consolas,"Courier New",monospace;
}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:var(--black)}
body{
  min-height:100dvh;
  color:var(--white);
  font-family:var(--rock);
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

/* same visual language as Chroma Clean */
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
  font-size:clamp(39px,6.15vw,88px);
  line-height:.83;
  letter-spacing:.005em;
  text-transform:uppercase;
}
.roleline{
  font-family:var(--rock);
  font-weight:700;
  margin-top:12px;
  font-size:clamp(12px,1.15vw,15px);
  line-height:1.28;
}
.copyflow{
  display:grid;
  grid-template-columns:minmax(180px,.9fr) 5px minmax(180px,1.1fr);
  gap:18px;
  align-items:end;
  max-width:620px;
}
.sourceblock,
.finishblock{
  font-family:var(--rock);
  font-weight:700;
  display:grid;
  gap:2px;
  font-size:clamp(12px,1.15vw,15px);
  line-height:1.24;
}
.flowmark{
  width:5px;
  min-height:82px;
  background:var(--yellow);
  box-shadow:none;
}
.finishblock strong{font-weight:700}

/* login block */
.access{
  background:var(--black);
  color:var(--white);
  padding:clamp(28px,5vw,58px) 26px;
  display:flex;
  align-items:center;
}
.panel{
  width:min(100%,760px);
  margin:0 auto;
}
.kicker{
  margin:0 0 10px;
  color:var(--yellow);
  font-size:9px;
  line-height:1;
  letter-spacing:.1em;
  text-transform:uppercase;
}
h1{
  margin:0;
  font-size:clamp(24px,3vw,40px);
  line-height:.95;
  font-family:var(--rock);
  text-transform:uppercase;
}
.copy{
  margin:14px 0 30px;
  color:var(--dim);
  font-size:12px;
  line-height:1.5;
}
.field{
  display:grid;
  grid-template-columns:1fr auto;
  gap:10px;
}
input{
  min-width:0;
  width:100%;
  padding:15px 16px;
  border:0;
  outline:0;
  background:#151518;
  color:var(--white);
  font:inherit;
  font-size:14px;
}
input::placeholder{color:#6d6d71}
button{
  padding:0 14px;
  border:0;
  background:#151518;
  color:var(--yellow);
  font:inherit;
  font-size:11px;
  text-transform:uppercase;
  cursor:pointer;
  white-space:nowrap;
}
button:hover{color:var(--white)}
.err{
  min-height:20px;
  padding-top:10px;
  color:#ff7474;
  font-size:10px;
}
.bottom{
  background:var(--black);
  color:var(--dim);
  padding:18px 26px 20px;
  display:flex;
  align-items:flex-end;
  justify-content:flex-start;
  gap:28px;
  font-size:9px;
  line-height:1.5;
  text-transform:uppercase;
  letter-spacing:.05em;
}
.links{display:flex;gap:10px 16px;flex-wrap:wrap}
.bottom a{color:inherit;text-decoration:none}
.bottom a:hover{color:var(--white)}

@media(max-width:850px){
  .hero{grid-template-columns:1fr}
  .copyflow{margin-top:16px}
}
@media(max-width:600px){
  .page{padding:7px;gap:7px}
  .hero{padding:22px;min-height:0}
  .copyflow{grid-template-columns:1fr;gap:9px}
  .flowmark{width:52px;height:4px;min-height:4px}
  .access{padding:38px 22px}
  .field{grid-template-columns:1fr}
  button{padding:14px 16px;text-align:left}
  .bottom{padding:18px 22px;align-items:flex-start;flex-direction:column}
  .accessmail{text-align:left}
}

/* WORKING ACROSS / POST-PRODUCTION — same hierarchy as main site */
.copyflow{
  display:grid;
  grid-template-columns:1fr!important;
  gap:14px!important;
  max-width:700px!important;
}
.scope-services{
  display:grid;
  grid-template-columns:minmax(0,1fr) 5px minmax(0,1fr);
  gap:18px;
  align-items:stretch;
}
.scopeblock,
.serviceblock{
  display:grid;
  gap:7px;
  align-content:end;
}
.copylabel{
  font-size:9px;
  line-height:1;
  letter-spacing:.1em;
  text-transform:uppercase;
  opacity:.62;
}
.copyline{
  font-size:clamp(12px,1.15vw,15px);
  line-height:1.42;
}
.scope-services .flowmark{
  width:5px;
  min-height:86px;
  background:var(--yellow);
}
@media(max-width:600px){
  .scope-services{grid-template-columns:1fr;gap:10px}
  .scope-services .flowmark{
    width:52px;
    height:4px;
    min-height:4px;
  }
}


/* calmer scope/service copy */
.copyline{line-height:1.48!important}
.claimblock{display:block!important}


.panel-access{
  margin-top:34px;
  display:flex;
  flex-wrap:wrap;
  gap:6px 10px;
  align-items:baseline;
  color:var(--dim);
  font-size:9px;
  line-height:1.5;
  text-transform:uppercase;
  letter-spacing:.05em;
}
.panel-access a{
  color:var(--white);
  text-decoration:none;
}
.panel-access a:hover{color:var(--yellow)}



/* fixed two-line Post-Production rhythm */
.service-lines{
  display:grid;
  gap:2px;
}
.service-lines span{
  display:block;
}


/* identical two-line Post-Production layout on main site and portfolio access page */
.service-lines{
  display:grid!important;
  gap:2px!important;
  line-height:1.42!important;
}
.service-lines span{
  display:block!important;
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
          <div class="copyline service-lines">
  <span>High-End Retouch. Compositing. CGI.</span>
  <span>Generative Workflows.</span>
</div>
        </div>
      </div>
    </div>
  </header>

  <main class="access">
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

      <div class="panel-access">
        <span>For portfolio access:</span>
        <a href="mailto:pedro@rodrigues.de">pedro@rodrigues.de</a>
      </div>
    </section>
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
