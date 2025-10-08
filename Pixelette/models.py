from django.db import models

# Modèle Utilisateur
class Utilisateur(models.Model):
    nom = models.CharField(max_length=100, verbose_name="Nom")
    prenom = models.CharField(max_length=100, verbose_name="Prénom")
    email = models.EmailField(unique=True, verbose_name="Email")
    telephone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")  
    password = models.CharField(max_length=128, default='', verbose_name="Mot de passe")
    image = models.ImageField(upload_to="profiles/", blank=True, null=True, verbose_name="Image de profil")
    date_inscription = models.DateTimeField(auto_now_add=True, verbose_name="Date d'inscription")

    def __str__(self):
        return f"{self.prenom} {self.nom}"  # ← Amélioré : affiche prénom + nom

    # Ajoute ces properties (pas des champs DB !)
    @property
    def is_authenticated(self):
        """Simule l'utilisateur authentifié pour DRF/Django."""
        return True

    @property
    def is_anonymous(self):
        """Opposé à is_authenticated."""
        return False

    @property
    def is_active(self):
        """Utilisateur actif par défaut."""
        return True

# Modèle Oeuvre
class Oeuvre(models.Model):
    titre = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(verbose_name="Description", blank=True)
    image = models.ImageField(upload_to="oeuvres/", verbose_name="Image", blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    auteur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name="oeuvres", verbose_name="Auteur")

    def __str__(self):
        return self.titre

# Modèle Galerie
class Galerie(models.Model):
    nom = models.CharField(max_length=150, verbose_name="Nom de la galerie")
    description = models.TextField(verbose_name="Description", blank=True)
    proprietaire = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name="galeries", verbose_name="Propriétaire")
    privee = models.BooleanField(default=False, verbose_name="Privée")
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")

    def __str__(self):
        return self.nom

# Modèle Interaction
class Interaction(models.Model):
    TYPE_CHOICES = [
        ("like", "Like"),
        ("commentaire", "Commentaire"),
    ]
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name="Type d'interaction")
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, verbose_name="Utilisateur")
    oeuvre = models.ForeignKey(Oeuvre, on_delete=models.CASCADE, verbose_name="Œuvre")
    contenu = models.TextField(blank=True, verbose_name="Contenu du commentaire")
    date = models.DateTimeField(auto_now_add=True, verbose_name="Date")

    def __str__(self):
        return f"{self.type} par {self.utilisateur} sur {self.oeuvre}"

# Modèle Statistique
class Statistique(models.Model):
    oeuvre = models.ForeignKey(Oeuvre, on_delete=models.CASCADE, verbose_name="Œuvre")
    vues = models.PositiveIntegerField(default=0, verbose_name="Nombre de vues")
    likes = models.PositiveIntegerField(default=0, verbose_name="Nombre de likes")
    date = models.DateField(auto_now_add=True, verbose_name="Date")

    def __str__(self):
        return f"Statistiques pour {self.oeuvre} le {self.date}"
