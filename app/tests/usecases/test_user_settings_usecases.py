"""ユーザー設定ユースケースのテスト

APIキーの保存と取得が正しく動作するかを検証します。
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from app.models.user_settings import UserSettings
from app.core.security.gateways import SecurityGateway
from app.usecases.user_settings import SaveUserApiKeyUseCase, GetUserApiKeyUseCase


User = get_user_model()


class MockSecurityGateway(SecurityGateway):
    """テスト用のSecurityGatewayモック"""

    def encrypt(self, plaintext: str) -> bytes:
        """単純な暗号化の模倣（テスト用）"""
        if plaintext is None:
            raise TypeError("暗号化する平文がNoneです")
        if not plaintext:
            return b''
        return f"ENCRYPTED:{plaintext}".encode('utf-8')

    def decrypt(self, ciphertext: bytes) -> str:
        """単純な復号の模倣（テスト用）"""
        if ciphertext is None:
            raise TypeError("復号する暗号文がNoneです")
        if not ciphertext:
            return ''
        try:
            decoded = ciphertext.decode('utf-8')
            if not decoded.startswith("ENCRYPTED:"):
                raise ValueError("Invalid format")
            return decoded[len("ENCRYPTED:"):]
        except Exception as e:
            raise ValueError("復号に失敗しました") from e


class UserSettingsUseCasesTest(TestCase):
    """ユーザー設定ユースケースのテストケース"""

    def setUp(self):
        """テスト前の準備"""
        # テスト用ユーザーの作成（usernameパラメータを削除）
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123'
        )

        # SecurityGatewayのモックを作成
        self.security_gateway = MockSecurityGateway()

        # ユースケースのインスタンスを作成
        self.save_usecase = SaveUserApiKeyUseCase(self.security_gateway)
        self.get_usecase = GetUserApiKeyUseCase(self.security_gateway)

    def test_save_api_key(self):
        """APIキーの保存が正しく動作することを検証"""
        api_key = "test-api-key-12345"
        api_provider = "test-provider"

        # APIキーを保存
        settings = self.save_usecase.execute(
            user_id=self.user.id,
            api_key=api_key,
            api_provider=api_provider
        )

        # 保存されたデータを検証
        self.assertEqual(settings.api_provider, api_provider)
        self.assertTrue(settings.api_key_encrypted)

        # DBからデータを再取得して検証
        db_settings = UserSettings.objects.get(user_id=self.user.id)
        self.assertEqual(db_settings.api_provider, api_provider)
        self.assertEqual(db_settings.api_key_encrypted,
                         f"ENCRYPTED:{api_key}".encode('utf-8'))

    def test_get_api_key(self):
        """APIキーの取得が正しく動作することを検証"""
        # まずAPIキーを保存
        api_key = "test-api-key-67890"
        self.save_usecase.execute(
            user_id=self.user.id,
            api_key=api_key
        )

        # APIキーを取得
        retrieved_key = self.get_usecase.execute(user_id=self.user.id)

        # 取得されたAPIキーを検証
        self.assertEqual(retrieved_key, api_key)

    def test_get_nonexistent_api_key(self):
        """設定が存在しない場合にNoneが返されることを検証"""
        # 別のユーザーIDを使用
        nonexistent_user_id = self.user.id + 1

        # 存在しないユーザーのAPIキーを取得しようとする
        retrieved_key = self.get_usecase.execute(user_id=nonexistent_user_id)

        # Noneが返されることを検証
        self.assertIsNone(retrieved_key)

    def test_save_and_update_api_key(self):
        """APIキーの更新が正しく動作することを検証"""
        # 1回目の保存
        initial_key = "initial-api-key"
        self.save_usecase.execute(
            user_id=self.user.id,
            api_key=initial_key,
            api_provider="provider1"
        )

        # 2回目の保存（更新）
        updated_key = "updated-api-key"
        self.save_usecase.execute(
            user_id=self.user.id,
            api_key=updated_key,
            api_provider="provider2"
        )

        # 更新後のデータを検証
        settings = UserSettings.objects.get(user_id=self.user.id)
        self.assertEqual(settings.api_provider, "provider2")
        self.assertEqual(
            self.security_gateway.decrypt(settings.api_key_encrypted),
            updated_key
        )

    def test_empty_api_key_handling(self):
        """空のAPIキーが適切に扱われることを検証"""
        # 空のAPIキーを保存
        settings = self.save_usecase.execute(
            user_id=self.user.id,
            api_key="",
            api_provider="empty-provider"
        )

        # 空のAPIキーは空のバイト列として保存される
        self.assertEqual(settings.api_key_encrypted, b'')

        # APIキーを取得
        retrieved_key = self.get_usecase.execute(user_id=self.user.id)

        # Noneが返されることを検証（空文字列はNoneとして扱われる）
        self.assertIsNone(retrieved_key)
