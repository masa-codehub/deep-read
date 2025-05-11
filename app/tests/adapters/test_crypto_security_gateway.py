"""CryptoSecurityGatewayのテスト

暗号化と復号が正しく動作するかを検証します。
"""
from django.test import TestCase
from app.adapters.security.crypto_security_gateway import CryptoSecurityGateway


class CryptoSecurityGatewayTest(TestCase):
    """CryptoSecurityGatewayのテストケース"""

    def setUp(self):
        """テスト前の準備"""
        # 固定キーを使用してテスト結果を予測可能にする
        # 本番環境では固定キーを使用してはいけません
        self.test_key = b'0' * 32  # 32バイトの固定キー（テスト用）
        self.gateway = CryptoSecurityGateway(key=self.test_key)

    def test_encrypt_decrypt_success(self):
        """暗号化した文字列が正しく復号できることを検証"""
        # テスト用の平文
        plaintext = "this is a secret api key"

        # 暗号化
        encrypted = self.gateway.encrypt(plaintext)

        # 暗号化されたデータは平文と異なるはず
        self.assertNotEqual(encrypted, plaintext.encode('utf-8'))

        # 暗号化されたデータは空でないはず
        self.assertTrue(encrypted)

        # 復号
        decrypted = self.gateway.decrypt(encrypted)

        # 復号した結果は元の平文と同じはず
        self.assertEqual(decrypted, plaintext)

    def test_different_nonce_produces_different_ciphertext(self):
        """同じ平文でも暗号化するたびに異なる暗号文が生成されることを検証"""
        plaintext = "same plain text"

        # 同じ平文を2回暗号化
        encrypted1 = self.gateway.encrypt(plaintext)
        encrypted2 = self.gateway.encrypt(plaintext)

        # 2つの暗号文は異なるはず（nonceが異なるため）
        self.assertNotEqual(encrypted1, encrypted2)

        # しかし、両方とも正しく復号できるはず
        self.assertEqual(self.gateway.decrypt(encrypted1), plaintext)
        self.assertEqual(self.gateway.decrypt(encrypted2), plaintext)

    def test_empty_values(self):
        """空の値を暗号化・復号した場合の動作を検証"""
        # 空文字列
        self.assertEqual(self.gateway.encrypt(""), b'')
        self.assertEqual(self.gateway.decrypt(b''), '')

        # None値（実装では例外発生するかもしれないので、その場合はテスト修正が必要）
        with self.assertRaises(TypeError):
            self.gateway.encrypt(None)

        with self.assertRaises(TypeError):
            self.gateway.decrypt(None)

    def test_tampered_data_fails_decryption(self):
        """改ざんされたデータを復号しようとすると例外が発生することを検証"""
        plaintext = "secret data"
        encrypted = self.gateway.encrypt(plaintext)

        # 暗号文の一部を改ざん（最後のバイトを変更）
        tampered = encrypted[:-1] + bytes([encrypted[-1] ^ 1])

        # 改ざんされたデータの復号は失敗するはず
        with self.assertRaises(ValueError):
            self.gateway.decrypt(tampered)

    def test_invalid_format_fails_decryption(self):
        """不正な形式のデータを復号しようとすると例外が発生することを検証"""
        # nonceが不足している短いデータ
        with self.assertRaises(ValueError):
            self.gateway.decrypt(b'too short')
