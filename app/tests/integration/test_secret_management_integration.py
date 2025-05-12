"""シークレット管理機能の結合テスト。

暗号化・復号機能、ユーザー設定モデル、ユースケースが連携して
正しく動作するかを検証します。
"""
from django.contrib.auth import get_user_model
from django.test import TestCase

from app.adapters.security.factory import get_security_gateway
from app.models.user_settings import UserSettings
from app.usecases.user_settings import GetUserApiKeyUseCase, SaveUserApiKeyUseCase

User = get_user_model()


class SecretManagementIntegrationTest(TestCase):
    """シークレット管理機能の結合テスト。"""

    def setUp(self):
        """テスト前の準備"""
        # テスト用ユーザーの作成 (usernameパラメータを削除)
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123'
        )

        # 実際のSecurityGatewayインスタンスを取得
        self.security_gateway = get_security_gateway()

        # ユースケースのインスタンスを作成
        self.save_usecase = SaveUserApiKeyUseCase(self.security_gateway)
        self.get_usecase = GetUserApiKeyUseCase(self.security_gateway)

    def test_end_to_end_api_key_storage(self):
        """APIキーの保存と取得の一連の流れを検証"""
        # テスト用のAPIキー
        api_key = "sk-test-key-integration-12345"
        api_provider = "openai"

        # 1. APIキーを保存
        settings = self.save_usecase.execute(
            user_id=self.user.id,
            api_key=api_key,
            api_provider=api_provider
        )

        # データベースに保存されていることを確認
        self.assertIsNotNone(settings.api_key_encrypted)
        self.assertTrue(len(settings.api_key_encrypted) > 0)
        self.assertEqual(settings.api_provider, api_provider)

        # 暗号化されたデータが元の平文と異なることを確認
        self.assertNotEqual(settings.api_key_encrypted,
                            api_key.encode('utf-8'))

        # 2. APIキーを取得
        retrieved_key = self.get_usecase.execute(user_id=self.user.id)

        # 取得したAPIキーが元のAPIキーと一致することを確認
        self.assertEqual(retrieved_key, api_key)

    def test_cross_user_api_key_isolation(self):
        """異なるユーザー間でAPIキーが分離されていることを検証"""
        # 2人のユーザーを追加作成 (usernameパラメータを削除)
        user1 = User.objects.create_user(
            email='user1@example.com', password='pass1')
        user2 = User.objects.create_user(
            email='user2@example.com', password='pass2')

        # それぞれのユーザーに異なるAPIキーを保存
        api_key1 = "sk-user1-api-key"
        api_key2 = "sk-user2-api-key"

        self.save_usecase.execute(user_id=user1.id, api_key=api_key1)
        self.save_usecase.execute(user_id=user2.id, api_key=api_key2)

        # ユーザー1のAPIキーを取得して確認
        retrieved_key1 = self.get_usecase.execute(user_id=user1.id)
        self.assertEqual(retrieved_key1, api_key1)

        # ユーザー2のAPIキーを取得して確認
        retrieved_key2 = self.get_usecase.execute(user_id=user2.id)
        self.assertEqual(retrieved_key2, api_key2)

        # 異なるユーザーのAPIキーが混ざらないことを確認
        self.assertNotEqual(retrieved_key1, retrieved_key2)

    def test_api_key_update(self):
        """APIキーの更新が正しく動作することを結合テストで検証"""
        # 初期APIキーを設定
        initial_key = "sk-initial-key"
        self.save_usecase.execute(user_id=self.user.id, api_key=initial_key)

        # 値が正しく保存されていることを確認
        initial_retrieved = self.get_usecase.execute(user_id=self.user.id)
        self.assertEqual(initial_retrieved, initial_key)

        # APIキーを更新
        updated_key = "sk-updated-key"
        self.save_usecase.execute(user_id=self.user.id, api_key=updated_key)

        # 更新後の値が正しく取得できることを確認
        updated_retrieved = self.get_usecase.execute(user_id=self.user.id)
        self.assertEqual(updated_retrieved, updated_key)

    def test_direct_model_access_security(self):
        """モデルに直接アクセスしても暗号化されたデータのみが見えることを検証"""
        # APIキーを保存
        secret_key = "this-is-a-very-secret-key"
        self.save_usecase.execute(user_id=self.user.id, api_key=secret_key)

        # データベースから直接UserSettingsオブジェクトを取得
        db_settings = UserSettings.objects.get(user_id=self.user.id)

        # 暗号化されたデータが存在することを確認
        self.assertIsNotNone(db_settings.api_key_encrypted)

        # 暗号化されたデータは平文のAPIキーと一致しないことを確認
        self.assertNotEqual(db_settings.api_key_encrypted,
                            secret_key.encode('utf-8'))

        # 平文のAPIキーがモデルに直接保存されていないことを確認
        self.assertFalse(hasattr(db_settings, 'api_key'))

        # 暗号化されたデータから平文のAPIキーを復号できることを確認
        decrypted = self.security_gateway.decrypt(
            db_settings.api_key_encrypted)
        self.assertEqual(decrypted, secret_key)
