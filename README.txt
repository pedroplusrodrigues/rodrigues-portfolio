PEDRO RODRIGUES — CURRENT WEBSITE PACKAGE

Enthalten:
- index.html                 aktueller Chroma-/Design-Lab-Stand
- captions.json              Projekt-/Bildmetadaten
- impressum.html             öffentlich erreichbar
- datenschutz.html           öffentlich erreichbar
- functions/_middleware.js   Cloudflare Pages Passwortschutz
- images/                    hier den bestehenden Bilderordner einfügen
- fonts/                     hier die bestehenden lokalen Fonts einfügen

WICHTIG:
Die Website lädt keine Google Fonts mehr.
Phosphate und Rockwell Bold werden ausschließlich lokal aus /fonts/ geladen.

Bevorzugte Dateinamen:
Phosphate:
- Phosphate.woff2
- alternativ Phosphate.woff / Phosphate.otf

Rockwell Bold:
- Rockwell-Bold.woff2
- alternativ Rockwell-Bold.woff / Rockwell-Bold.otf / Rockwell-Bold.ttf

Die Fontdateien selbst sind in diesem Paket nicht enthalten.
Den bestehenden /images/-Ordner ebenfalls unverändert aus dem aktuellen Repo übernehmen.

Cloudflare:
- Repository-Struktur genau so beibehalten.
- functions/_middleware.js schützt das Portfolio.
- /impressum und /datenschutz bleiben öffentlich.
- /fonts/ ist öffentlich, damit Login- und Legal-Seiten die lokalen Fonts laden können.
