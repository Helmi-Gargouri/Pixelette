#!/usr/bin/env bash
set -o errexit

echo "🔧 Installation des dépendances..."
pip install -r requirements.txt

echo "📦 Collecte des fichiers statiques..."
python manage.py collectstatic --no-input

echo "🗄️ Affichage de l'état des migrations..."
python manage.py showmigrations

echo "🗄️ Migration complète..."
# Migrer TOUT sans fake
python manage.py migrate --run-syncdb

echo "✅ Build terminé !"