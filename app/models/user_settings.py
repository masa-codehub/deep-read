"""ユーザー設定モデル

ユーザーごとの設定情報やAPIキーなどのシークレット情報を管理します。
APIキーは暗号化してデータベースに保存されます。
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from app.core.db.fields import EncryptedField


class UserSettings(models.Model):
    """ユーザー設定モデル

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

    # ファイル関連設定
    max_file_size_mb = models.PositiveIntegerField(
        default=100,
        validators=[MinValueValidator(1)],
        verbose_name='最大ファイルサイズ(MB)'
    )

    max_pages = models.PositiveIntegerField(
        default=100,
        validators=[MinValueValidator(1)],
        verbose_name='最大ページ数'
    )

    max_cross_search_docs = models.PositiveIntegerField(
        default=5,
        validators=[MinValueValidator(1)],
        verbose_name='横断検索最大文書数'
    )

    # バッチ処理設定
    BATCH_FREQUENCY_CHOICES = [
        ('daily', '毎日'),
        ('weekly', '毎週'),
        ('monthly', '毎月'),
        ('none', 'なし'),
    ]
    batch_frequency = models.CharField(
        max_length=10,
        choices=BATCH_FREQUENCY_CHOICES,
        default='daily',
        verbose_name='バッチ処理頻度'
    )

    # 通知設定
    email_notifications = models.BooleanField(
        default=True,
        verbose_name='メール通知'
    )

    # UI設定
    default_view = models.CharField(
        max_length=20,
        default='list',
        choices=[('list', 'リスト表示'), ('grid', 'グリッド表示')],
        verbose_name='デフォルト表示形式'
    )

    # 作成日時・更新日時
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='作成日時')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新日時')

    class Meta:
        """モデルのメタ情報を定義するクラス"""
        verbose_name = 'ユーザー設定'
        verbose_name_plural = 'ユーザー設定'

    def __str__(self):
        """オブジェクトの文字列表現を返す"""
        return f"{self.user}の設定"
