#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

python manage.py migrate --plan 
python manage.py migrate Pixelette 0011_alter_interaction_options_and_more --fake 
python manage.py migrate python manage.py createsuperuser --noinput || true


# Superuser (ignore si existe)
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'password123') if not User.objects.filter(username='admin').exists() else print('Superuser existe')" | python manage.py shell

# Pas de createsuperuser --noinput car il demande input ; utilisez le script ci-dessus