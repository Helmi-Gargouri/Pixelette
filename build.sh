#!/usr/bin/env bash
set -o errexit

echo "🔧 Installation des dépendances..."
pip install -r requirements.txt

echo "📦 Collecte des fichiers statiques..."
python manage.py collectstatic --no-input

echo "🗄️ Vérification des migrations..."
python manage.py showmigrations

echo "🗄️ Migration des apps Django de base..."
# Migrer auth, authtoken, sessions, etc. (CRITIQUE pour auth_user)
python manage.py migrate auth
python manage.py migrate authtoken
python manage.py migrate contenttypes
python manage.py migrate sessions

echo "🗄️ Migration de l'app Pixelette..."
# Si vous avez des conflits, fake la migration problématique d'abord
python manage.py migrate Pixelette 0015_interaction_filtered_content_and_more --fake
python manage.py migrate Pixelette 0013_alter_interaction_unique_together_and_more --fake
python manage.py migrate Pixelette 0014_interaction_parent --fake
# Puis migrer normalement
python manage.py migrate Pixelette

echo "🗄️ Migration finale de toutes les apps..."
python manage.py migrate

echo "✅ Build terminé !"