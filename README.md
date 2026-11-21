# Feliciani Group Srl – Sito web

Sito a pagina unica dell'impresa di costruzioni Feliciani Group Srl.

Indirizzo pubblico: https://martinafeliciani3-glitch.github.io/siti-clienti/

## File

- `index.html` – struttura, testi e stile della pagina
- `assets/app.js` – animazioni, scena 3D, menu, prima/dopo e modulo di richiesta
- `assets/three.min.js` – libreria Three.js 0.128 per la scena 3D (licenza in `assets/three.LICENSE.txt`)
- `assets/fonts/` – font Cormorant Garamond e Manrope (licenza SIL OFL, file `OFL-*.txt`)

## Pubblicazione

Il sito si pubblica da solo su GitHub Pages a ogni modifica del branch `main`
(workflow `.github/workflows/pages.yml`). L'esito si vede nella scheda **Actions**.
Vengono pubblicati solo `index.html` e la cartella `assets`.

## Dove modificare i contenuti

- **Telefono**: in `index.html` cercare `366 155 7209` e `+393661557209`.
- **WhatsApp del modulo**: in `assets/app.js` cercare `wa.me/393661557209`.
- **Email**: cercare `felicianigrp@gmail.com` in `index.html` e in `assets/app.js`.
- **Sede e P.IVA**: in `index.html`, sezione contatti e footer.
- **Numeri animati** (sezione "In cifre"): in `index.html`, attributi `data-c` (es. `data-c="25"` = anni di attività).
- **Servizi**: in `assets/app.js`, elenco `SV` (titolo, descrizione, etichette).
- **Testi delle fasi del metodo**: in `assets/app.js`, elenco `DS`.

## Sicurezza

- Il sito non carica nulla da altri siti: font, librerie e immagini sono tutti nel repository.
  Nessun cookie, nessun tracciamento, nessun dato inviato a terzi durante la navigazione.
- `index.html` contiene una **Content Security Policy**: il browser esegue solo script e font
  provenienti dal sito stesso e blocca tutto il resto (script iniettati, plugin, moduli verso altri siti).
- **Regola importante**: non inserire script dentro `index.html` (`<script>…</script>`) né caricare
  script, font o immagini da altri siti: verrebbero bloccati. Il codice va in `assets/app.js`,
  i file nella cartella `assets/`. Se serve un servizio esterno (es. Google Maps incorporata, analytics),
  va prima aggiunto alla regola `Content-Security-Policy` in cima a `index.html`.
- I dati del modulo non passano da nessun server: la richiesta viene inviata dall'utente
  tramite WhatsApp o email.
- Il workflow di pubblicazione ha permessi minimi e usa azioni bloccate su una versione esatta.
  Dependabot (`.github/dependabot.yml`) propone ogni settimana gli aggiornamenti di sicurezza.
