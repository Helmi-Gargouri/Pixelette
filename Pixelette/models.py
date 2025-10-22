from django.db import models
import pyotp
import uuid
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail 

class Utilisateur(models.Model): 
    nom = models.CharField(max_length=100, verbose_name="Nom")
    prenom = models.CharField(max_length=100, verbose_name="Prénom")
    email = models.EmailField(unique=True, verbose_name="Email")
    telephone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    image = models.ImageField(upload_to="profiles/", blank=True, null=True, verbose_name="Image de profil")
    date_inscription = models.DateTimeField(auto_now_add=True, verbose_name="Date d'inscription")
    password = models.CharField(max_length=128, verbose_name="Mot de passe")
    is_two_factor_enabled = models.BooleanField(default=True)
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
    theme = models.CharField(max_length=100, verbose_name="Thème", blank=True, null=True)
    proprietaire = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name="galeries", verbose_name="Propriétaire")
    privee = models.BooleanField(default=False, verbose_name="Privée")
    oeuvres = models.ManyToManyField(Oeuvre, related_name="galeries_associees", blank=True, verbose_name="Oeuvres")
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")

    def __str__(self):
        return self.nom

class GalerieInvitation(models.Model):
    galerie = models.ForeignKey(Galerie, on_delete=models.CASCADE, related_name='invitations', verbose_name="Galerie")
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='galerie_invitations', verbose_name="Utilisateur invité")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, verbose_name="Token d'invitation")
    date_envoi = models.DateTimeField(auto_now_add=True, verbose_name="Date d'envoi")
    date_expiration = models.DateTimeField(verbose_name="Date d'expiration")
    acceptee = models.BooleanField(default=False, verbose_name="Acceptée")
    date_acceptation = models.DateTimeField(null=True, blank=True, verbose_name="Date d'acceptation")
    
    class Meta:
        unique_together = ['galerie', 'utilisateur']
        verbose_name = "Invitation à une galerie"
        verbose_name_plural = "Invitations aux galeries"
    
    def save(self, *args, **kwargs):
        if not self.date_expiration:
            # L'invitation expire dans 30 jours
            self.date_expiration = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Vérifie si l'invitation est toujours valide"""
        return not self.acceptee and timezone.now() < self.date_expiration
    
    def __str__(self):
        return f"Invitation pour {self.utilisateur.email} - Galerie: {self.galerie.nom}"

class Interaction(models.Model):
    TYPE_CHOICES = [
        ("like", "Like"),
        ("commentaire", "Commentaire"),
        ("partage", "Partage"),
    ]
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name="Type d'interaction")
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name="interactions", verbose_name="Utilisateur")
    oeuvre = models.ForeignKey(Oeuvre, on_delete=models.CASCADE, related_name="interactions", verbose_name="Œuvre")
    contenu = models.TextField(blank=True, verbose_name="Contenu du commentaire")
    
    # Champ pour les réponses aux commentaires
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='reponses',
        verbose_name="Commentaire parent"
    )
    
    # Champs spécifiques au partage
    plateforme_partage = models.CharField(
        max_length=50, 
        blank=True, 
        choices=[
            ('facebook', 'Facebook'),
            ('twitter', 'Twitter'),
            ('instagram', 'Instagram'),
            ('email', 'Email'),
            ('link', 'Lien direct'),
        ],
        verbose_name="Plateforme de partage"
    )
    
    date = models.DateTimeField(auto_now_add=True, verbose_name="Date")
    
    # Champs de modération IA
    MODERATION_STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
        ('flagged', 'Signalé pour révision'),
    ]
    
    moderation_status = models.CharField(
        max_length=20,
        choices=MODERATION_STATUS_CHOICES,
        default='pending',
        verbose_name="Statut de modération"
    )
    
    moderation_score = models.FloatField(
        default=0.0,
        verbose_name="Score de problème (0-1)",
        help_text="Score calculé par l'IA pour évaluer le niveau de problème du contenu"
    )
    
    moderation_details = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Détails de modération",
        help_text="Détails techniques de l'analyse IA (bad words, toxicité, etc.)"
    )
    
    moderation_reasons = models.TextField(
        blank=True,
        verbose_name="Raisons de modération",
        help_text="Raisons détaillées pour le signalement ou rejet"
    )
    
    filtered_content = models.TextField(
        blank=True,
        verbose_name="Contenu filtré",
        help_text="Version du contenu avec les mots inappropriés censurés"
    )
    
    reviewed_by = models.ForeignKey(
        Utilisateur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderated_interactions',
        verbose_name="Révisé par",
        help_text="Admin qui a révisé manuellement cette interaction"
    )
    
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de révision"
    )
    
    class Meta:
        # Seuls les likes doivent être uniques par utilisateur/œuvre
        # Les commentaires et partages peuvent être multiples
        constraints = [
            models.UniqueConstraint(
                fields=['utilisateur', 'oeuvre'],
                condition=models.Q(type='like'),
                name='unique_like_per_user_oeuvre'
            )
        ]
        verbose_name = "Interaction"
        verbose_name_plural = "Interactions"
        ordering = ['-date']
    
    def is_visible(self):
        """Détermine si l'interaction doit être visible publiquement"""
        return self.moderation_status in ['approved', 'pending'] and self.moderation_score < 0.8
    
    def get_display_content(self):
        """Retourne le contenu à afficher (filtré si nécessaire)"""
        if self.filtered_content:
            return self.filtered_content
        return self.contenu
    
    def __str__(self):
        return f"{self.type} par {self.utilisateur} sur {self.oeuvre} [{self.moderation_status}]"

class Statistique(models.Model):
    oeuvre = models.ForeignKey(Oeuvre, on_delete=models.CASCADE, verbose_name="Œuvre")
    vues = models.PositiveIntegerField(default=0, verbose_name="Nombre de vues")
    likes = models.PositiveIntegerField(default=0, verbose_name="Nombre de likes")
    date = models.DateField(auto_now_add=True, verbose_name="Date")

    def __str__(self):
        return f"Statistiques pour {self.oeuvre} le {self.date}"
    
class Suivi(models.Model):
    """Modèle pour gérer les suivis entre utilisateurs et artistes"""
    utilisateur = models.ForeignKey(
        Utilisateur, 
        on_delete=models.CASCADE, 
        related_name='suivis',
        verbose_name="Utilisateur qui suit"
    )
    artiste = models.ForeignKey(
        Utilisateur, 
        on_delete=models.CASCADE, 
        related_name='abonnes',
        verbose_name="Artiste suivi",
        limit_choices_to={'role': 'artiste'}
    )
    date_suivi = models.DateTimeField(auto_now_add=True, verbose_name="Date de suivi")
    
    class Meta:
        unique_together = ['utilisateur', 'artiste']
        verbose_name = "Suivi"
        verbose_name_plural = "Suivis"
        ordering = ['-date_suivi']
    
    def __str__(self):
        return f"{self.utilisateur.prenom} suit {self.artiste.prenom}"

    def save(self, *args, **kwargs):
        # Empêcher qu'un utilisateur se suive lui-même
        if self.utilisateur == self.artiste:
            raise ValueError("Un utilisateur ne peut pas se suivre lui-même")
        
        # Vérifier que l'artiste a bien le rôle 'artiste'
        if self.artiste.role != 'artiste':
            raise ValueError("Vous ne pouvez suivre que des artistes")
        
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Envoyer un email à l'artiste si c'est un nouveau suivi
        if is_new:
            self.send_notification_email()
    
    def send_notification_email(self):
        """Envoie un email à l'artiste pour l'informer du nouveau follower"""
        subject = f'🎨 {self.utilisateur.prenom} {self.utilisateur.nom} a commencé à vous suivre !'
        message = f"""Bonjour {self.artiste.prenom},

Bonne nouvelle ! {self.utilisateur.prenom} {self.utilisateur.nom} a commencé à suivre votre travail sur Pixelette.

Profil du follower :
- Nom : {self.utilisateur.prenom} {self.utilisateur.nom}
- Email : {self.utilisateur.email}
- Membre depuis : {self.utilisateur.date_inscription.strftime('%d/%m/%Y')}

Continuez à créer et partager vos magnifiques œuvres pour inspirer votre communauté grandissante ! 🎨✨

Connectez-vous pour voir tous vos abonnés : http://localhost:5173/profil

Cordialement,
L'équipe Pixelette
        """
        
        try:
            send_mail(
                subject,
                message,
                'noreply.pixelette@gmail.com',
                [self.artiste.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"❌ Erreur envoi email suivi: {str(e)}")

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