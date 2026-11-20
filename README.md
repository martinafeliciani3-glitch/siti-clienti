# Feliciani Group Srl – Sito web

Sito a pagina unica dell'impresa di costruzioni Feliciani Group Srl.
Tutto (HTML, CSS e JavaScript) è nel file `index.html`.

Indirizzo pubblico: https://martinafeliciani3-glitch.github.io/siti-clienti/

## Pubblicazione

Il sito si pubblica da solo su GitHub Pages a ogni modifica del branch `main`
(workflow `.github/workflows/pages.yml`). L'esito si vede nella scheda **Actions**.

Da fare una sola volta: **Settings → Pages → Source: GitHub Actions**.

## Dove modificare i contenuti (in `index.html`)

- **Telefono**: cercare `366 155 7209` e `+393661557209` (compaiono nei contatti e nel riepilogo del modulo).
- **WhatsApp del modulo**: cercare `wa.me/393661557209`.
- **Email**: cercare `felicianigrp@gmail.com`.
- **Sede e P.IVA**: nella sezione contatti e nel footer.
- **Numeri animati** (sezione "In cifre"): attributi `data-c` (es. `data-c="25"` = anni di attività).
- **Servizi**: elenco `SV` nello script (titolo, descrizione, etichette).
- **Testi delle fasi del metodo**: elenco `DS` nello script.

## Librerie esterne

- Three.js 0.128 da jsDelivr (scena 3D del cantiere). Se non si carica, al posto della scena compare uno sfondo sfumato.
- Font Cormorant Garamond e Manrope da Google Fonts.
