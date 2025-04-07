from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

CustomUser = get_user_model()

class Command(BaseCommand):
    help = 'Creates a manager user or promotes an existing user to manager'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username of the user to promote to manager')
        parser.add_argument('--password', type=str, help='Password for new user (if creating)')
        parser.add_argument('--email', type=str, help='Email for new user (if creating)')

    def handle(self, *args, **options):
        username = options['username']
        password = options.get('password')
        email = options.get('email')

        try:
            user = CustomUser.objects.get(username=username)
            if user.is_manager:
                self.stdout.write(self.style.WARNING(f'User {username} is already a manager'))
            else:
                user.is_manager = True
                user.save()
                self.stdout.write(self.style.SUCCESS(f'User {username} promoted to manager successfully'))
        except CustomUser.DoesNotExist:
            if not password:
                self.stdout.write(self.style.ERROR(f'User {username} does not exist. To create a new user, provide a password'))
                return
            
            user = CustomUser.objects.create_user(
                username=username,
                email=email or f'{username}@example.com',
                password=password,
                is_manager=True
            )
            self.stdout.write(self.style.SUCCESS(f'Manager {username} created successfully'))
