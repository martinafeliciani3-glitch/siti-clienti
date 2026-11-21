# Feliciani Group Srl – Sito web

Sito a pagina unica dell'impresa di costruzioni Feliciani Group Srl.

Indirizzo pubblico: https://martinafeliciani3-glitch.github.io/siti-clienti/

## File

- `index.html` – struttura e testi della pagina
- `privacy.html` – informativa sul trattamento dei dati (da far verificare a un consulente)
- `assets/style.css` – grafica e animazioni CSS
- `assets/guard.js` – protezioni eseguite per prime (solo HTTPS, niente sito dentro pagine altrui)
- `assets/app.js` – animazioni, scena 3D, menu, prima/dopo e modulo di richiesta
- `tools/aggiorna-integrity.py` – ricalcola le impronte di sicurezza (`integrity`) dei file
- `assets/three.min.js` – libreria Three.js 0.128 per la scena 3D (licenza in `assets/three.LICENSE.txt`)
- `assets/fonts/` – font Cormorant Garamond e Manrope (licenza SIL OFL, file `OFL-*.txt`)

## Pubblicazione

Il sito si pubblica da solo su GitHub Pages a ogni modifica del branch `main`
(workflow `.github/workflows/pages.yml`). L'esito si vede nella scheda **Actions**.
Vengono pubblicati solo `index.html`, `privacy.html` e la cartella `assets`.

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
- `index.html` contiene una **Content Security Policy** molto severa: il browser accetta solo
  script, stili e font del sito stesso e blocca tutto il resto (script iniettati, stili scritti
  dentro l'HTML, plugin, moduli verso altri siti, inserimento di HTML non autorizzato).
- Ogni script e il foglio di stile hanno un'impronta **integrity**: se un file venisse alterato,
  il browser non lo userebbe.
- **Regole importanti per le modifiche:**
  - niente `<script>…</script>`, `<style>…</style>` o attributi `style="…"` dentro `index.html`:
    verrebbero bloccati. Il codice va in `assets/app.js`, la grafica in `assets/style.css`;
  - dopo aver modificato un file in `assets/` eseguire `python3 tools/aggiorna-integrity.py`.
    Se ci si dimentica, la pubblicazione automatica si ferma con un errore invece di mettere
    online un sito rotto;
  - per usare un servizio esterno (mappa incorporata, statistiche…) va prima aggiunto alla
    regola `Content-Security-Policy` in cima a `index.html`.
- Modulo contatti: campi con limiti di lunghezza, nome e telefono controllati, testo ripulito
  da caratteri nascosti e simboli `< >`, scelte accettate solo dall'elenco previsto, campo
  nascosto anti-bot e blocco delle compilazioni troppo veloci. I dati non passano da nessun
  server: la richiesta viene inviata dall'utente tramite WhatsApp o email.
- Il sito funziona solo in HTTPS e non può essere mostrato dentro pagine di altri siti.
- Il workflow di pubblicazione ha permessi minimi e usa azioni bloccate su una versione esatta.
  Dependabot (`.github/dependabot.yml`) propone ogni settimana gli aggiornamenti di sicurezza.
