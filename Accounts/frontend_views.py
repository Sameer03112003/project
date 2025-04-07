from django.shortcuts import render

def home_view(request):
    return render(request, 'home.html')

def login_view(request):
    return render(request, 'accounts/login.html')

def register_view(request):
    return render(request, 'accounts/register.html')

def account_view(request):
    return render(request, 'accounts/account.html')

def transactions_view(request):
    return render(request, 'accounts/transactions.html')

def transfer_view(request):
    return render(request, 'accounts/transfer.html')

def manager_view(request):
    return render(request, 'accounts/manager.html')
