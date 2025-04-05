from django.shortcuts import render
from rest_framework import generics ,permissions
from django.contrib.auth import get_user_model
from .models import *
from .serializers import *
from .filters import TransactionFilters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# Create your views here.
CustomUser = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset=CustomUser.objects.all()
    serializer_class=UserSerializer


class LoginView(APIView):
    permission_classes = []  

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        tokens = serializer.get_tokens_for_user(user)
        return Response(tokens, status=status.HTTP_200_OK)


class AccountDetailView(generics.RetrieveAPIView):
    serializer_class=AccountSerializer
    permission_classes=[permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.account
    
class TransactionCreateView(generics.CreateAPIView):
    serializer_class=TransactionSerializer
    permission_classes=[permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(account=self.request.user.account)

class TransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = TransactionFilters

    def get_queryset(self):
        return self.request.user.account.transactions.all()
    


class TransferView(generics.CreateAPIView):
    serializer_class = TransferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(from_account=self.request.user.account)