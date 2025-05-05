"""
ユーザー設定モデル

ユーザーごとの設定情報やAPIキーなどのシークレット情報を管理します。
APIキーは暗号化してデータベースに保存されます。
"""
from django.db import models
from django.conf import settings
from app.core.db.fields import EncryptedField


class UserSettings(models.Model):
    """
    ユーザー設定モデル

    ユーザーごとのAPIキーなどの設定情報を管理します。
    シークレットはEncryptedFieldを使用して暗号化して保存されます。
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='settings',
        verbose_name='ユーザー'
    )

    # APIキー（暗号化して保存）
    api_key_encrypted = EncryptedField(
        verbose_name='暗号化済みAPIキー'
    )

    # API種別（どのAPIのキーかを識別するための情報）
    api_provider = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name='APIプロバイダー'
    )

    # 作成日時・更新日時
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='作成日時')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新日時')

    class Meta:
        verbose_name = 'ユーザー設定'
        verbose_name_plural = 'ユーザー設定'

    def __str__(self):
        return f"{self.user}の設定"
