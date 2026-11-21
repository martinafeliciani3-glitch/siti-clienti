#!/usr/bin/env python3
"""Aggiorna (o controlla) gli attributi integrity nelle pagine del sito (*.html).

Ogni script e foglio di stile del sito ha un'impronta (hash SHA-384): se il file
venisse alterato, il browser si rifiuterebbe di usarlo.

Dopo aver modificato un file in assets/ eseguire:
    python3 tools/aggiorna-integrity.py
Per il solo controllo (usato dalla pubblicazione automatica):
    python3 tools/aggiorna-integrity.py --check
"""
import base64
import hashlib
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = sorted(ROOT.glob('*.html'))
TAG = re.compile(
    r'<(script src|link rel="stylesheet" href)="(assets/[^"]+)"(?: integrity="[^"]*")?(?: crossorigin="[^"]*")?>'
)


def sri(path):
    digest = hashlib.sha384((ROOT / path).read_bytes()).digest()
    return 'sha384-' + base64.b64encode(digest).decode()


def main():
    check = '--check' in sys.argv
    errors = []
    for page in PAGES:
        html = page.read_text(encoding='utf-8')
        found = []

        def fix(m):
            found.append(m.group(2))
            return f'<{m.group(1)}="{m.group(2)}" integrity="{sri(m.group(2))}">'

        new = TAG.sub(fix, html)
        if not found:
            errors.append(f'{page.name}: nessuno script o foglio di stile trovato')
            continue
        if check:
            if new != html:
                errors.append(f'{page.name}: gli attributi integrity non corrispondono ai file')
            else:
                print(f'{page.name}: integrity corretti per', ', '.join(found))
        else:
            page.write_text(new, encoding='utf-8')
            print(f'{page.name}: integrity aggiornati per', ', '.join(found))
    if errors:
        sys.exit('ERRORE:\n' + '\n'.join(errors) + '\nEseguire: python3 tools/aggiorna-integrity.py')


if __name__ == '__main__':
    main()
