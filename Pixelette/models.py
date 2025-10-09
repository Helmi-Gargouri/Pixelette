from django.db import models
import pyotp
from django.core.mail import send_mail 

class Utilisateur(models.Model): 
    nom = models.CharField(max_length=100, verbose_name="Nom")
    prenom = models.CharField(max_length=100, verbose_name="Prénom")
    email = models.EmailField(unique=True, verbose_name="Email")
    telephone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    image = models.ImageField(upload_to="profiles/", blank=True, null=True, verbose_name="Image de profil")
    date_inscription = models.DateTimeField(auto_now_add=True, verbose_name="Date d'inscription")
    password = models.CharField(max_length=128, verbose_name="Mot de passe")
    is_two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=100, blank=True, null=True)
    two_factor_temp_secret = models.CharField(max_length=100, blank=True, null=True)
    reset_code = models.CharField(max_length=5, blank=True, null=True)
    reset_code_expires = models.DateTimeField(blank=True, null=True)

    ROLE_CHOICES = [
        ('user', 'User'),
        ('artiste', 'Artiste'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user', verbose_name="Rôle")

    def __str__(self):
        return f"{self.prenom} {self.nom}"

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_active(self):
        return True

    @property
    def two_factor_enabled(self):
        return self.is_two_factor_enabled

class Oeuvre(models.Model):
    titre = models.CharField(max_length=200, verbose_name="Titre")
    description = models.TextField(verbose_name="Description", blank=True)
    image = models.ImageField(upload_to="oeuvres/", verbose_name="Image", blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    auteur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name="oeuvres", verbose_name="Auteur")

    def __str__(self):
        return self.titre

class Galerie(models.Model):
    nom = models.CharField(max_length=150, verbose_name="Nom de la galerie")
    description = models.TextField(verbose_name="Description", blank=True)
    proprietaire = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name="galeries", verbose_name="Propriétaire")
    privee = models.BooleanField(default=False, verbose_name="Privée")
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")

    def __str__(self):
        return self.nom

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

class Statistique(models.Model):
    oeuvre = models.ForeignKey(Oeuvre, on_delete=models.CASCADE, verbose_name="Œuvre")
    vues = models.PositiveIntegerField(default=0, verbose_name="Nombre de vues")
    likes = models.PositiveIntegerField(default=0, verbose_name="Nombre de likes")
    date = models.DateField(auto_now_add=True, verbose_name="Date")

    def __str__(self):
        return f"Statistiques pour {self.oeuvre} le {self.date}"
    

class DemandeRole(models.Model):
    STATUT_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvée'),
        ('rejected', 'Rejetée'),
    ]
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='demandes', verbose_name="Utilisateur")
    nouveau_role = models.CharField(max_length=10, default='artiste', verbose_name="Nouveau rôle demandé")
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='pending', verbose_name="Statut")
    raison = models.TextField(blank=True, verbose_name="Raison (optionnelle)")
    date_demande = models.DateTimeField(auto_now_add=True, verbose_name="Date de demande")

    def __str__(self):
        return f"{self.utilisateur.prenom} {self.utilisateur.nom} → {self.nouveau_role} ({self.statut})"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=DemandeRole)
def handle_demande_save(sender, instance, created, **kwargs):
    if created and instance.statut == 'pending':
        # Email à admin
        admin = Utilisateur.objects.filter(role='admin').first()
        if admin:
            subject = f'Demande de rôle: {instance.utilisateur.prenom} {instance.utilisateur.nom} veut devenir {instance.nouveau_role}'
            message = f'{instance.utilisateur.prenom} {instance.utilisateur.nom} ({instance.utilisateur.email}) a demandé à devenir {instance.nouveau_role}.\nRaison: {instance.raison or "Aucune"}\nApprouvez via /api/demandes/{instance.id}/approuver/ ou /admin/.'
            send_mail(subject, message, 'no-reply@pixelette.com', [admin.email])
    
    if not created and instance.statut == 'approved' and instance.nouveau_role == 'artiste':
        # Mail félicitations au user
        user = instance.utilisateur
        subject = 'Félicitations ! Vous êtes maintenant Artiste sur Pixelette'
        message = f'Bonjour {user.prenom}, votre demande a été approuvée ! Vous êtes maintenant Artiste. Créez vos œuvres et galeries dès maintenant. 🎨\n\nConnectez-vous pour commencer.'
        send_mail(subject, message, 'no-reply@pixelette.com', [user.email])
        user.role = 'artiste'
        user.save()

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

@receiver(pre_save, sender=Utilisateur) 
def pre_role_change(sender, instance, **kwargs):
    if instance.pk: 
        old_instance = sender.objects.get(pk=instance.pk)
        instance._old_role = old_instance.role  

@receiver(post_save, sender=Utilisateur)
def handle_role_change(sender, instance, created, raw, update_fields, **kwargs):
    if created:
        # Mail bienvenue pour nouveau user
        if instance.role == 'admin':
            subject = 'Bienvenue Admin sur Pixelette !'
            message = f'Bonjour {instance.prenom}, vous avez été créé en tant qu\'Admin. Gérez les users et demandes via /admin-demands. 🎨\n\nConnectez-vous pour commencer.'
        else:  # 'user' ou autre
            subject = 'Bienvenue sur Pixelette !'
            message = f'Bonjour {instance.prenom}, votre compte a été créé. Explorez la galerie et demandez à devenir artiste si vous le souhaitez.\n\nConnectez-vous pour commencer.'
        send_mail(subject, message, 'no-reply@pixelette.com', [instance.email])
        return

    if update_fields and 'role' in update_fields:
        old_role = getattr(instance, '_old_role', 'user')  
        new_role = instance.role
        if old_role != new_role:
            # Mail personnalisé
            if new_role == 'admin':
                subject = f'Rôle Admin Activé ! (de {old_role} à {new_role})'
                message = f'Bonjour {instance.prenom}, votre rôle a été mis à jour en Admin. Vous avez maintenant accès à la gestion complète.\n\nExplorez vos nouveaux pouvoirs !'
            elif new_role == 'artiste':
                subject = f'Félicitations ! Vous êtes maintenant Artiste (de {old_role} à {new_role})'
                message = f'Bonjour {instance.prenom}, votre rôle a été mis à jour en Artiste. Créez vos œuvres et galeries dès maintenant. 🎨\n\nConnectez-vous pour partager votre art.'
            else:  # Retour à 'user'
                subject = f'Rôle Mis à Jour (de {old_role} à {new_role})'
                message = f'Bonjour {instance.prenom}, votre rôle a été mis à jour en User standard.\n\nSi vous voulez devenir artiste, demandez-le via votre profil.'
            
            send_mail(subject, message, 'no-reply@pixelette.com', [instance.email])