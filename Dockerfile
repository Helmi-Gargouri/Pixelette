# Base image
FROM python:3.12-slim

# Arguments
ARG user=pixelette
ARG uid=1000

# Installer les dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Installer les dépendances Python
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn==22.0.0  # Serveur WSGI pour Django

# Créer l'utilisateur système
RUN useradd -G www-data,root -u $uid -d /home/$user $user
RUN mkdir -p /home/$user && chown -R $user:$user /home/$user

# Copier le code sélectivement (exclut .git, tests, etc.)
COPY --chown=$user:$user manage.py ./
COPY --chown=$user:$user Pixelette ./Pixelette

# Créer les répertoires nécessaires
RUN mkdir -p /app/static /app/media && chown -R $user:$user /app/static /app/media

# Changer d'utilisateur
USER $user

# Exposer le port
EXPOSE 8000

# Commande pour lancer l'application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "Pixelette.wsgi:application"]