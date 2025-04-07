from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class CustomUser(AbstractUser):
    phone=models.CharField(max_length=15)
    profile_photo=models.ImageField(upload_to='profile_photos/',blank=True,null=True)
    is_manager=models.BooleanField(default=False, help_text='Designates whether the user can manage other users')

    def __str__(self):
        return self.username

class Account(models.Model):
    user=models.OneToOneField(CustomUser,on_delete=models.CASCADE)
    balance=models.DecimalField(max_digits=12,decimal_places=2,default=0)


    def __str__(self):
        return f"{self.user.username}'s account"

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('deposit', 'Deposit'),
        ('withdraw', 'Withdraw'),
        ('transfer_in', 'Transfer In'),
        ('transfer_out', 'Transfer Out')
    )

    account=models.ForeignKey(Account,on_delete=models.CASCADE,related_name='transactions')
    Transaction_type=models.CharField(max_length=20,choices=TRANSACTION_TYPES)
    amount=models.DecimalField(max_digits=10,decimal_places=2)
    description=models.CharField(max_length=255,blank=True,null=True)
    timestamp=models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"{self.transaction_type} - {self.amount}"


# Transfer model to manage user-to-user transfers.
class Transfer(models.Model):
    from_account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='sent_transfers')
    to_account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='received_transfers')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.from_account.balance < self.amount:
            raise ValueError("Insufficient balance for transfer")
        # Update account balances.
        self.from_account.balance -= self.amount
        self.to_account.balance += self.amount
        self.from_account.save()
        self.to_account.save()
        super().save(*args, **kwargs)

        # Log transfer details as transactions.
        Transaction.objects.create(
            account=self.from_account,
            transaction_type='transfer_out',
            amount=self.amount,
            description=f"Transfer to {self.to_account.user.username}"
        )
        Transaction.objects.create(
            account=self.to_account,
            transaction_type='transfer_in',
            amount=self.amount,
            description=f"Transfer from {self.from_account.user.username}"
        )