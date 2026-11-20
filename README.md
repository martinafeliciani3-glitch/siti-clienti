# Feliciani Group Srl – Sito web

Sito a pagina unica in `index.html` (HTML, CSS e JavaScript in un solo file). Basta aprirlo nel browser o caricarlo su qualsiasi hosting.

## Da personalizzare prima della pubblicazione

1. **Contatti**: in fondo al file, nell'oggetto `CONFIG`, inserire telefono, numero WhatsApp (es. `393331234567`), email ed eventuale `formEndpoint` (es. Formspree). Senza endpoint il modulo apre un'email precompilata.
   Aggiornare anche i dati nel blocco JSON-LD nell'`<head>` e la P.IVA nel footer.
2. **Numeri**: nella sezione `#numeri` modificare gli attributi `data-target` (anni, cantieri, clienti, % consegne).
3. **Foto prima/dopo**: nella sezione `#lavori` sostituire ogni `<div class="ph ...">…</div>` con `<img src="foto/nome.jpg" alt="descrizione">`.
4. **Foto squadra**: nella sezione `#perche`, stesso procedimento.
5. **Foto di sfondo in apertura** (facoltativa): `<section class="hero" id="top" style="--hero-img:url('foto/hero.jpg')">`.
6. **Recensioni**: sostituire i testi segnaposto con recensioni reali (nome, zona, testo) e aggiornare il voto medio.
7. **Privacy e cookie policy**: collegare le pagine reali ai link nel footer e nel modulo.
