"""
ユーザー設定に関するユースケース

ユーザーのAPIキー等の設定情報を安全に管理するためのユースケースを提供します。
シークレット情報は暗号化して保存され、必要時のみ復号されます。
"""
from typing import Optional
from django.contrib.auth import get_user_model
from app.models.user_settings import UserSettings
from app.core.security.gateways import SecurityGateway


User = get_user_model()


class SaveUserApiKeyUseCase:
    """
    ユーザーのAPIキーを安全に保存するユースケース

    平文のAPIキーを受け取り、暗号化してデータベースに保存します。
    """

    def __init__(self, security_gateway: SecurityGateway):
        """
        初期化

        Args:
            security_gateway: 暗号化・復号を行うセキュリティゲートウェイ
        """
        self.security_gateway = security_gateway

    def execute(self, user_id: int, api_key: str, api_provider: str = None) -> UserSettings:
        """
        APIキーを暗号化して保存する

        Args:
            user_id: ユーザーID
            api_key: 平文のAPIキー
            api_provider: APIプロバイダー名（任意）

        Returns:
            保存されたUserSettingsオブジェクト
        """
        # ユーザーを取得
        user = User.objects.get(id=user_id)

        # UserSettingsオブジェクトを取得または作成
        settings, created = UserSettings.objects.get_or_create(user=user)

        # APIキーが提供されている場合のみ暗号化して保存
        if api_key is not None:  # Noneチェックを明示的に行う
            # 空文字列の場合も暗号化して保存（空のバイト列になる）
            encrypted_api_key = self.security_gateway.encrypt(api_key)
            settings.api_key_encrypted = encrypted_api_key

        # APIプロバイダー情報を保存
        if api_provider:
            settings.api_provider = api_provider

        # 保存
        settings.save()

        return settings


class GetUserApiKeyUseCase:
    """
    ユーザーのAPIキーを取得するユースケース

    暗号化されたAPIキーをデータベースから取得し、復号して返します。
    """

    def __init__(self, security_gateway: SecurityGateway):
        """
        初期化

        Args:
            security_gateway: 暗号化・復号を行うセキュリティゲートウェイ
        """
        self.security_gateway = security_gateway

    def execute(self, user_id: int) -> Optional[str]:
        """
        ユーザーのAPIキーを復号して取得する

        Args:
            user_id: ユーザーID

        Returns:
            平文のAPIキー（設定されていない場合はNone）
        """
        try:
            # ユーザーの設定を取得
            settings = UserSettings.objects.get(user_id=user_id)

            # APIキーが設定されていない場合はNoneを返す
            if settings.api_key_encrypted is None or len(settings.api_key_encrypted) == 0:
                return None

            # 暗号化されたAPIキーを復号
            decrypted = self.security_gateway.decrypt(
                settings.api_key_encrypted)

            # 空文字列の場合はNoneを返す（APIキーが未設定と同等とみなす）
            return None if decrypted == '' else decrypted

        except UserSettings.DoesNotExist:
            # 設定が存在しない場合はNoneを返す
            return None
        except ValueError:
            # 復号に失敗した場合のエラーハンドリング
            # ログには既にエラーが記録されているため、ここではNoneを返すだけ
            return None
