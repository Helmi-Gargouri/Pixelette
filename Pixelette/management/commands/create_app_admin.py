from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Create or update an application admin Utilisateur (role=admin)'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True, help='Email of the admin')
        parser.add_argument('--password', required=True, help='Password for the admin')
        parser.add_argument('--prenom', default='Admin', help='Prenom')
        parser.add_argument('--nom', default='User', help='Nom')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        prenom = options['prenom']
        nom = options['nom']

        # Import inside handle to ensure Django is setup
        from Pixelette.models import Utilisateur
        from django.contrib.auth.hashers import make_password

        try:
            user = Utilisateur.objects.filter(email=email).first()
            if user:
                user.prenom = prenom
                user.nom = nom
                user.password = make_password(password)
                user.role = 'admin'
                user.is_two_factor_enabled = False
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Updated existing Utilisateur id={user.id}, email={email} as app admin."))
            else:
                user = Utilisateur.objects.create(
                    prenom=prenom,
                    nom=nom,
                    email=email,
                    password=make_password(password),
                    role='admin',
                    is_two_factor_enabled=False,
                )
                self.stdout.write(self.style.SUCCESS(f"Created Utilisateur id={user.id}, email={email} as app admin."))

        except Exception as e:
            raise CommandError(f"Error creating/updating app admin: {e}")
