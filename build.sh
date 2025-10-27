#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

python manage.py migrate --plan 
python manage.py migrate Pixelette 0011_alter_interaction_options_and_more --fake 


