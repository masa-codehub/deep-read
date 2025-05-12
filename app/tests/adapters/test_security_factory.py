"""セキュリティゲートウェイファクトリーのテスト

ファクトリーが正しいSecurityGatewayの実装を返すかを検証します。
"""
import os
from unittest import mock
from django.test import TestCase
from app.adapters.security.factory import create_security_gateway, get_security_gateway
from app.adapters.security.crypto_security_gateway import CryptoSecurityGateway
from app.core.security.gateways import SecurityGateway


class SecurityGatewayFactoryTest(TestCase):
    """SecurityGatewayファクトリーのテストケース"""

    def test_create_security_gateway_returns_crypto_gateway_by_default(self):
        """デフォルトではCryptoSecurityGatewayが返されることを検証"""
        # 環境変数をクリアした状態でテスト
        with mock.patch.dict(os.environ, {}, clear=True):
            gateway = create_security_gateway()
            self.assertIsInstance(gateway, CryptoSecurityGateway)

    def test_get_security_gateway_returns_singleton(self):
        """get_security_gatewayが同じインスタンスを返すことを検証"""
        # 2回呼び出す
        gateway1 = get_security_gateway()
        gateway2 = get_security_gateway()

        # 同じインスタンスであることを検証
        self.assertIs(gateway1, gateway2)

        # インスタンスの型も確認
        self.assertIsInstance(gateway1, SecurityGateway)

    def test_create_security_gateway_with_kms_enabled(self):
        """KMSが有効な設定の場合の動作を検証（現時点では警告ログの確認）"""
        # KMS有効の環境変数を設定
        with mock.patch.dict(os.environ, {'USE_KMS': 'true'}, clear=True):
            # ログ警告が出ることを検証
            with self.assertLogs(level='WARNING') as cm:
                gateway = create_security_gateway()

                # 警告ログが出ていることを検証
                self.assertTrue(any(
                    'KMS integration is enabled but not implemented yet' in msg for msg in cm.output))

                # KMS連携がまだ実装されていないため、CryptoSecurityGatewayが返されることを検証
                self.assertIsInstance(gateway, CryptoSecurityGateway)
