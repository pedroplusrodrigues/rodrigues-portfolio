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
  font-family:Phosphate;
  src:url("/fonts/Phosphate.woff2") format("woff2"),
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
  --display:"Phosphate","Arial Black",sans-serif;
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


/* Solid Phosphate display marks — outlined from the supplied TTC for identical iOS/desktop rendering */
.identityMark{
  display:block;
  width:5.061em;
  max-width:100%;
  height:auto;
  overflow:visible;
}
.infoTitleMark{
  display:block;
  width:2.122em;
  max-width:100%;
  height:auto;
  overflow:visible;
}

</style>
</head>
<body>
<div class="page">

  <header class="hero">
    <div>
      <div class="identity" role="img" aria-label="PEDRO RODRIGUES"><svg class="identityMark" viewBox="0 0 5061 1500" preserveAspectRatio="xMinYMin meet" aria-hidden="true" focusable="false"><g fill="currentColor"><path d="M554 287Q554 356 530.0 404.5Q506 453 464.5 483.0Q423 513 367.5 527.0Q312 541 248 541V700H35V33H248Q312 33 367.5 47.0Q423 61 464.5 91.0Q506 121 530.0 169.5Q554 218 554 287ZM248 361H257Q299 361 317.5 341.5Q336 322 336 287Q336 252 317.5 232.5Q299 213 257 213H248Z"/><path d="M604 33H997V208H817V282H994V448H817V525H1004V700H604Z"/><path d="M1064 700V33H1249Q1343 33 1416.5 54.0Q1490 75 1540.5 117.0Q1591 159 1617.5 221.5Q1644 284 1644 366Q1644 448 1617.5 510.5Q1591 573 1540.5 615.0Q1490 657 1416.5 678.5Q1343 700 1249 700ZM1277 510Q1352 510 1393.0 474.5Q1434 439 1434 366Q1434 293 1393.0 258.0Q1352 223 1277 223Z"/><path d="M1699 33H1929Q1993 33 2047.5 50.0Q2102 67 2142.0 100.0Q2182 133 2204.5 181.5Q2227 230 2227 293Q2227 343 2213.0 378.0Q2199 413 2182 436Q2162 462 2137 480L2262 700H2012L1912 531V700H1699ZM1912 361H1923Q1961 361 1987.5 344.0Q2014 327 2014 287Q2014 247 1987.5 230.0Q1961 213 1923 213H1912Z"/><path d="M2267 367Q2267 295 2294.5 231.0Q2322 167 2369.5 119.5Q2417 72 2481.0 44.5Q2545 17 2617 17Q2689 17 2753.0 44.5Q2817 72 2864.5 119.5Q2912 167 2939.5 231.0Q2967 295 2967 367Q2967 439 2939.5 503.0Q2912 567 2864.5 614.5Q2817 662 2753.0 689.5Q2689 717 2617 717Q2545 717 2481.0 689.5Q2417 662 2369.5 614.5Q2322 567 2294.5 503.0Q2267 439 2267 367ZM2477 367Q2477 396 2488.0 421.5Q2499 447 2518.0 466.0Q2537 485 2562.5 496.0Q2588 507 2617 507Q2646 507 2671.5 496.0Q2697 485 2716.0 466.0Q2735 447 2746.0 421.5Q2757 396 2757 367Q2757 338 2746.0 312.5Q2735 287 2716.0 268.0Q2697 249 2671.5 238.0Q2646 227 2617 227Q2588 227 2562.5 238.0Q2537 249 2518.0 268.0Q2499 287 2488.0 312.5Q2477 338 2477 367Z"/><path d="M35 783H265Q329 783 383.5 800.0Q438 817 478.0 850.0Q518 883 540.5 931.5Q563 980 563 1043Q563 1093 549.0 1128.0Q535 1163 518 1186Q498 1212 473 1230L598 1450H348L248 1281V1450H35ZM248 1111H259Q297 1111 323.5 1094.0Q350 1077 350 1037Q350 997 323.5 980.0Q297 963 259 963H248Z"/><path d="M603 1117Q603 1045 630.5 981.0Q658 917 705.5 869.5Q753 822 817.0 794.5Q881 767 953 767Q1025 767 1089.0 794.5Q1153 822 1200.5 869.5Q1248 917 1275.5 981.0Q1303 1045 1303 1117Q1303 1189 1275.5 1253.0Q1248 1317 1200.5 1364.5Q1153 1412 1089.0 1439.5Q1025 1467 953 1467Q881 1467 817.0 1439.5Q753 1412 705.5 1364.5Q658 1317 630.5 1253.0Q603 1189 603 1117ZM813 1117Q813 1146 824.0 1171.5Q835 1197 854.0 1216.0Q873 1235 898.5 1246.0Q924 1257 953 1257Q982 1257 1007.5 1246.0Q1033 1235 1052.0 1216.0Q1071 1197 1082.0 1171.5Q1093 1146 1093 1117Q1093 1088 1082.0 1062.5Q1071 1037 1052.0 1018.0Q1033 999 1007.5 988.0Q982 977 953 977Q924 977 898.5 988.0Q873 999 854.0 1018.0Q835 1037 824.0 1062.5Q813 1088 813 1117Z"/><path d="M1358 1450V783H1543Q1637 783 1710.5 804.0Q1784 825 1834.5 867.0Q1885 909 1911.5 971.5Q1938 1034 1938 1116Q1938 1198 1911.5 1260.5Q1885 1323 1834.5 1365.0Q1784 1407 1710.5 1428.5Q1637 1450 1543 1450ZM1571 1260Q1646 1260 1687.0 1224.5Q1728 1189 1728 1116Q1728 1043 1687.0 1008.0Q1646 973 1571 973Z"/><path d="M1993 783H2223Q2287 783 2341.5 800.0Q2396 817 2436.0 850.0Q2476 883 2498.5 931.5Q2521 980 2521 1043Q2521 1093 2507.0 1128.0Q2493 1163 2476 1186Q2456 1212 2431 1230L2556 1450H2306L2206 1281V1450H1993ZM2206 1111H2217Q2255 1111 2281.5 1094.0Q2308 1077 2308 1037Q2308 997 2281.5 980.0Q2255 963 2217 963H2206Z"/><path d="M2576 783H2802V1450H2576Z"/><path d="M3297 1010Q3279 994 3252.0 985.5Q3225 977 3199 977Q3170 977 3146.0 987.5Q3122 998 3104.5 1016.5Q3087 1035 3077.0 1061.0Q3067 1087 3067 1117Q3067 1147 3078.0 1173.0Q3089 1199 3108.0 1217.5Q3127 1236 3152.5 1246.5Q3178 1257 3207 1257Q3241 1257 3269.0 1242.5Q3297 1228 3317 1203H3257V1063H3514V1285Q3491 1326 3459.0 1359.5Q3427 1393 3387.5 1417.0Q3348 1441 3302.0 1454.0Q3256 1467 3207 1467Q3135 1467 3071.0 1440.0Q3007 1413 2959.5 1366.0Q2912 1319 2884.5 1255.0Q2857 1191 2857 1117Q2857 1045 2883.0 981.0Q2909 917 2954.5 869.5Q3000 822 3062.5 794.5Q3125 767 3197 767Q3253 767 3294.0 778.0Q3335 789 3363 803Q3396 819 3418 838Z"/><path d="M3842 1467Q3779 1467 3728.0 1451.0Q3677 1435 3641.0 1403.0Q3605 1371 3585.5 1322.0Q3566 1273 3566 1207V783H3779V1198Q3779 1233 3793.5 1251.5Q3808 1270 3842 1270Q3876 1270 3890.5 1251.5Q3905 1233 3905 1198V783H4119V1207Q4119 1273 4099.5 1322.0Q4080 1371 4043.5 1403.0Q4007 1435 3956.0 1451.0Q3905 1467 3842 1467Z"/><path d="M4186 783H4579V958H4399V1032H4576V1198H4399V1275H4586V1450H4186Z"/><path d="M4628 1243Q4650 1250 4674 1254Q4694 1259 4719.5 1262.0Q4745 1265 4771 1265Q4817 1265 4817 1231Q4817 1218 4803.0 1204.5Q4789 1191 4767.5 1174.5Q4746 1158 4721.5 1138.0Q4697 1118 4675.5 1092.0Q4654 1066 4640.0 1033.5Q4626 1001 4626 959Q4626 912 4643.0 876.0Q4660 840 4690.0 816.0Q4720 792 4760.5 779.5Q4801 767 4847 767Q4871 767 4895.0 769.5Q4919 772 4938 774Q4960 777 4981 780V967Q4973 966 4963 965Q4955 964 4945.0 963.0Q4935 962 4924 962Q4918 962 4909.0 962.5Q4900 963 4892.0 965.0Q4884 967 4878.0 972.0Q4872 977 4872 986Q4872 994 4885.5 1006.0Q4899 1018 4918.5 1034.0Q4938 1050 4961.5 1071.0Q4985 1092 5004.5 1119.0Q5024 1146 5037.5 1180.0Q5051 1214 5051 1256Q5051 1300 5037.0 1338.5Q5023 1377 4993.5 1405.5Q4964 1434 4918.0 1450.5Q4872 1467 4809 1467Q4771 1467 4738.5 1463.5Q4706 1460 4681 1455Q4652 1450 4628 1443Z"/></g></svg></div>
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

  // Immer auf die kanonische Domain. So kann kein alter www/Adobe-Pfad
  // nach dem Login wieder übernommen werden.
  if (url.hostname === "www.rodrigues.de") {
    return Response.redirect(`https://rodrigues.de${url.pathname}${url.search}`, 301);
  }

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
          "Location": `https://rodrigues.de${url.pathname}${url.search}`,
          "Set-Cookie": `${COOKIE}=${expected}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`
        }
      });
    }
    return new Response(loginPage(true), { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  return new Response(loginPage(false), { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
