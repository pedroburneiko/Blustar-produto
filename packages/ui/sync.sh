#!/usr/bin/env bash
# Blustar DS — commit + push rápido.
# Uso:  ./sync.sh "mensagem do commit"
set -e

MSG="${1:-update: atualização do design system}"

# remove lock antigo, se existir (deixado pelo ambiente do Cowork)
rm -f .git/index.lock 2>/dev/null || true

git add -A
git commit -m "$MSG"
git push
echo "✓ Sincronizado com o GitHub."
