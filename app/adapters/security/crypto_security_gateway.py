"""暗号化・復号機能を提供するセキュリティゲートウェイの実装"""
import logging
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.security.gateways import SecurityGateway

logger = logging.getLogger(__name__)

# 定数定義
AES_KEY_SIZE = 32  # AES-256用に32バイト
NONCE_SIZE = 12    # GCMで推奨されるnonceサイズ


class CryptoSecurityGateway(SecurityGateway):
    """AES-GCM暗号化を使用したSecurityGatewayの実装

    この実装では一時的にランダムキーを使用します。
    実際の環境では、TASK-INFRA-KMSの完了後、KMSから鍵を取得するように更新する必要があります。
    """

    def __init__(self, key=None):
        """初期化

        Args:
            key: 暗号化キー（指定がなければランダムに生成）
        """
        # 暗号化キー: 本番環境ではKMSから取得する必要がある
        # 現時点ではランダム生成（テスト用・開発用）
        self.dek = key if key else os.urandom(AES_KEY_SIZE)
        logger.debug("CryptoSecurityGateway initialized")

    def encrypt(self, plaintext: str) -> bytes:
        """平文文字列をAES-GCMで暗号化する

        Args:
            plaintext: 暗号化する平文文字列

        Returns:
            nonce + 暗号文の形式でバイト列を返す

        Raises:
            TypeError: plaintext がNoneの場合
        """
        if plaintext is None:
            raise TypeError("暗号化する平文がNoneです")

        if not plaintext:
            return b''

        # AES-GCMインスタンスを作成
        aesgcm = AESGCM(self.dek)

        # GCMに必要なnonce（Number used ONCE）を生成
        # nonceは暗号文ごとに一意である必要があり、再利用してはいけない
        nonce = os.urandom(NONCE_SIZE)

        # 暗号化実行（認証データ(associated_data)は使用しない）
        ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)

        # nonceと暗号文を結合して返す
        # 復号時にnonceが必要なため、暗号文と一緒に保存する
        return nonce + ciphertext

    def decrypt(self, ciphertext: bytes) -> str:
        """暗号化されたバイト列を復号する

        Args:
            ciphertext: nonce + 暗号文 形式のバイト列

        Returns:
            復号された平文文字列

        Raises:
            ValueError: 復号に失敗した場合（認証エラーや不正なデータなど）
            TypeError: ciphertext がNoneの場合
            ValueError: 不正な形式の暗号文（nonceが短すぎる場合など）
        """
        if ciphertext is None:
            raise TypeError("復号する暗号文がNoneです")

        if not ciphertext:
            return ''

        # 暗号文の長さチェック
        if len(ciphertext) < NONCE_SIZE:
            raise ValueError(f"暗号文が短すぎます。少なくとも{NONCE_SIZE}バイトが必要です")

        try:
            # AES-GCMインスタンスを作成
            aesgcm = AESGCM(self.dek)

            # 先頭バイトをnonceとして抽出
            nonce = ciphertext[:NONCE_SIZE]

            # 残りを暗号文として抽出
            actual_ciphertext = ciphertext[NONCE_SIZE:]

            # 復号実行
            plaintext_bytes = aesgcm.decrypt(nonce, actual_ciphertext, None)

            # バイト列から文字列に変換
            return plaintext_bytes.decode('utf-8')

        except Exception as e:
            # 復号失敗の詳細をログに記録（平文は含めない）
            logger.error(f"Decryption failed: {str(e)}")

            # 統一したエラーメッセージを返す
            # 詳細なエラー情報は攻撃者に有用な情報を与える可能性があるため
            raise ValueError("復号に失敗しました") from e
