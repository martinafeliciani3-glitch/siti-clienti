#!/usr/bin/env python3
"""Aggiorna (o controlla) gli attributi integrity in index.html.

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
PAGE = ROOT / 'index.html'
TAG = re.compile(
    r'<(script src|link rel="stylesheet" href)="(assets/[^"]+)"(?: integrity="[^"]*")?(?: crossorigin="[^"]*")?>'
)


def sri(path):
    digest = hashlib.sha384((ROOT / path).read_bytes()).digest()
    return 'sha384-' + base64.b64encode(digest).decode()


def main():
    check = '--check' in sys.argv
    html = PAGE.read_text(encoding='utf-8')
    found = []

    def fix(m):
        found.append(m.group(2))
        return f'<{m.group(1)}="{m.group(2)}" integrity="{sri(m.group(2))}">'

    new = TAG.sub(fix, html)
    if not found:
        sys.exit('Nessuno script o foglio di stile trovato in index.html')
    if check:
        if new != html:
            sys.exit('ERRORE: gli attributi integrity in index.html non corrispondono ai file.\n'
                     'Eseguire: python3 tools/aggiorna-integrity.py')
        print('Integrity corretti per:', ', '.join(found))
    else:
        PAGE.write_text(new, encoding='utf-8')
        print('Integrity aggiornati per:', ', '.join(found))


if __name__ == '__main__':
    main()
