"""セキュリティ関連のゲートウェイを定義するモジュール。

シークレット管理のための暗号化・復号インターフェースを提供します。
"""
from abc import ABC, abstractmethod


class SecurityGateway(ABC):
    """暗号化と復号のためのインターフェース。

    システム全体で使用するシークレットの一貫した管理を提供します。
    """

    @abstractmethod
    def encrypt(self, plaintext: str) -> bytes:
        """平文を暗号化する。

        Args:
            plaintext: 暗号化する平文文字列

        Returns:
            暗号化されたバイト列
        """

    @abstractmethod
    def decrypt(self, ciphertext: bytes) -> str:
        """暗号文を復号する。

        Args:
            ciphertext: 復号する暗号化バイト列

        Returns:
            復号された平文文字列

        Raises:
            ValueError: 復号に失敗した場合
        """
