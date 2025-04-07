from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction

CustomUser=get_user_model()   # inherit fields from base user model

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model=CustomUser
        fields=['id','first_name','last_name','username','password','email','phone','profile_photo']
        extra_kwargs={'password':{'write_only':True}}

    def create(self, validated_data):
        user=CustomUser.objects.create_user(**validated_data)
        Account.objects.create(user=user)
        return user


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model=Account
        fields=['id','user','balance']


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model=Transaction
        fields=['id', 'account', 'transaction_type', 'amount', 'description', 'timestamp']
        read_only_fields=['timestamp']

class TransferSerializer(serializers.ModelSerializer):
    to_username=serializers.CharField(write_only=True)

    class Meta:
        model=Transfer
        fields = ['id', 'from_account', 'to_account', 'amount', 'timestamp', 'to_username']
        read_only_fields = ['from_account', 'to_account', 'timestamp']




    def validate(self, data):
        # Convert provided username to an account instance.
        from django.contrib.auth import get_user_model
        CustomUser = get_user_model()
        try:
            to_user = CustomUser.objects.get(username=data['to_username'])
            data['to_account'] = to_user.account
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Recipient username does not exist")
        return data

    def create(self, validated_data):
        validated_data.pop('to_username')
        return super().create(validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")
        if username and password:
            # Authenticate the user using Django's built-in method
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError("Unable to log in with provided credentials.", code="authorization")
        else:
            raise serializers.ValidationError("Must include 'username' and 'password'.", code="authorization")

        data["user"] = user
        return data

    def get_tokens_for_user(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.token = attrs['refresh']
        return attrs

    def save(self):
        try:
            # Blacklist the refresh token
            RefreshToken(self.token).blacklist()
            return True
        except Exception as e:
            raise serializers.ValidationError(str(e))


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed user information (for managers)"""
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'profile_photo', 'is_active', 'is_manager', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user information (for managers)"""
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'email', 'phone', 'is_active', 'is_manager']

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance