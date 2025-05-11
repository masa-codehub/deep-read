"""セキュリティゲートウェイのファクトリー

設定に基づいて適切なSecurityGatewayの実装を提供します。
"""
import logging
import os
from typing import Optional

from app.adapters.security.crypto_security_gateway import CryptoSecurityGateway
from app.core.security.gateways import SecurityGateway

logger = logging.getLogger(__name__)


class SecurityGatewayFactory:
    """SecurityGatewayのファクトリークラス

    シングルトンパターンでSecurityGatewayインスタンスを提供します。
    """

    # シングルトンインスタンスを保持するためのクラス変数
    _instance: Optional[SecurityGateway] = None

    @classmethod
    def create_security_gateway(cls) -> SecurityGateway:
        """SecurityGatewayのインスタンスを作成する

        現在は単純なCryptoSecurityGatewayを返しますが、
        将来的にはKMS統合した実装に切り替えることができます。

        Returns:
            SecurityGateway: セキュリティゲートウェイのインスタンス
        """
        # 環境変数からKMSの設定を読み込む（TASK-INFRA-KMSで設定予定）
        kms_enabled = os.environ.get('USE_KMS', 'False').lower() == 'true'

        if kms_enabled:
            # TODO: KMS統合したSecurityGatewayの実装を返す (TASK-INFRA-KMS後に実装)
            # from app.adapters.security.kms_security_gateway import KmsSecurityGateway
            # return KmsSecurityGateway()
            logger.warning(
                "KMS integration is enabled but not implemented yet, falling back to CryptoSecurityGateway")

        # 現時点では常にCryptoSecurityGatewayを返す
        return CryptoSecurityGateway()

    @classmethod
    def get_security_gateway(cls) -> SecurityGateway:
        """SecurityGatewayのシングルトンインスタンスを取得する

        アプリケーション内で単一のSecurityGatewayインスタンスを共有するため、
        シングルトンパターンを使用します。

        Returns:
            SecurityGateway: セキュリティゲートウェイのシングルトンインスタンス
        """
        if cls._instance is None:
            cls._instance = cls.create_security_gateway()
        return cls._instance

    @classmethod
    def reset_security_gateway(cls) -> None:
        """SecurityGatewayのシングルトンインスタンスをリセットする

        テストなどで初期化が必要な場合に使用します。

        Returns:
            None
        """
        cls._instance = None


# 後方互換性のための関数群
def create_security_gateway() -> SecurityGateway:
    """SecurityGatewayのインスタンスを作成する (後方互換性のための関数)

    Returns:
        SecurityGateway: セキュリティゲートウェイのインスタンス
    """
    return SecurityGatewayFactory.create_security_gateway()


def get_security_gateway() -> SecurityGateway:
    """SecurityGatewayのシングルトンインスタンスを取得する (後方互換性のための関数)

    Returns:
        SecurityGateway: セキュリティゲートウェイのシングルトンインスタンス
    """
    return SecurityGatewayFactory.get_security_gateway()


def reset_security_gateway() -> None:
    """SecurityGatewayのシングルトンインスタンスをリセットする (後方互換性のための関数)

    Returns:
        None
    """
    SecurityGatewayFactory.reset_security_gateway()
