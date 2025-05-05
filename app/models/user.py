"""
カスタムユーザーモデル

メールアドレスをユーザー名として使用するカスタムユーザーモデルを定義します。
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """
    カスタムユーザーモデルのマネージャ

    メールアドレスをユーザー名として使用するカスタムユーザーモデルのためのマネージャを定義します。
    """

    def create_user(self, email, password=None, **extra_fields):
        """
        通常ユーザーを作成します。

        Args:
            email: ユーザーのメールアドレス
            password: ユーザーのパスワード（ハッシュ化前）
            **extra_fields: その他のフィールド

        Returns:
            作成されたユーザーオブジェクト

        Raises:
            ValueError: メールアドレスが指定されていない場合
        """
        if not email:
            raise ValueError('メールアドレスは必須です')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # パスワードをハッシュ化
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        スーパーユーザー（管理者）を作成します。

        Args:
            email: ユーザーのメールアドレス
            password: ユーザーのパスワード（ハッシュ化前）
            **extra_fields: その他のフィールド

        Returns:
            作成されたスーパーユーザーオブジェクト
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('スーパーユーザーはis_staff=Trueでなければなりません')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('スーパーユーザーはis_superuser=Trueでなければなりません')

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    カスタムユーザーモデル

    メールアドレスをユーザー名として使用するカスタムユーザーモデルを定義します。
    """
    email = models.EmailField(
        verbose_name='メールアドレス',
        max_length=255,
        unique=True,
    )
    first_name = models.CharField(verbose_name='名', max_length=30, blank=True)
    last_name = models.CharField(verbose_name='姓', max_length=150, blank=True)
    is_active = models.BooleanField(verbose_name='有効', default=True)
    is_staff = models.BooleanField(verbose_name='スタッフ', default=False)
    date_joined = models.DateTimeField(
        verbose_name='登録日', default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'  # メールアドレスをユーザー名として使用
    REQUIRED_FIELDS = []  # スーパーユーザー作成時にemailは既に必須

    class Meta:
        verbose_name = 'ユーザー'
        verbose_name_plural = 'ユーザー'
        app_label = 'app'  # アプリケーションラベルを明示的に指定

    def __str__(self):
        return self.email

    def get_full_name(self):
        """
        ユーザーのフルネームを取得します。

        Returns:
            姓名をスペースで連結した文字列、姓名が設定されていない場合はメールアドレス
        """
        if self.first_name or self.last_name:
            return f'{self.last_name} {self.first_name}'.strip()
        return self.email

    def get_short_name(self):
        """
        ユーザーの短い名前を取得します。

        Returns:
            名、設定されていない場合はメールアドレス
        """
        if self.first_name:
            return self.first_name
        return self.email
