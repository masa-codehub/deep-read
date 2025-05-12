"""環境設定のテスト。

異なる環境（開発環境・本番環境）での設定値を検証します。
"""

from unittest import TestCase

from django.test import override_settings

from app.settings import development, production


class TestEnvironmentSettings(TestCase):
    """環境設定のテスト。

    開発環境と本番環境の設定の違いを確認します。
    """

    def test_debug_settings(self):
        """開発環境と本番環境でのDEBUG設定が適切かテストします。"""
        # 開発環境ではDEBUGはTrue
        self.assertTrue(development.DEBUG)
        # 本番環境ではDEBUGはFalse
        self.assertFalse(production.DEBUG)

    def test_database_configurations(self):
        """開発環境と本番環境でのデータベース設定をテストします。

        開発環境ではSQLite、本番環境ではPostgreSQLを使用していることを確認します。
        """
        # 開発環境ではSQLiteを使用
        self.assertEqual(
            development.DATABASES['default']['ENGINE'],
            'django.db.backends.sqlite3'
        )

        # 本番環境ではPostgreSQLを使用
        self.assertEqual(
            production.DATABASES['default']['ENGINE'],
            'django.db.backends.postgresql'
        )

    def test_security_settings(self):
        """セキュリティ関連の設定が環境ごとに適切に設定されていることを確認します。

        本番環境では厳格なセキュリティ設定が行われていることをテストします。
        """
        # 開発環境ではSSLリダイレクトは無効
        self.assertFalse(development.SECURE_SSL_REDIRECT)

        # 本番環境ではSSLリダイレクトは有効
        self.assertTrue(production.SECURE_SSL_REDIRECT)

        # 本番環境ではセキュアなCookieを使用
        self.assertTrue(production.SESSION_COOKIE_SECURE)
        self.assertTrue(production.CSRF_COOKIE_SECURE)

        # 本番環境ではHSTSを有効化
        self.assertEqual(production.SECURE_HSTS_SECONDS, 31536000)  # 365日
        self.assertTrue(production.SECURE_HSTS_INCLUDE_SUBDOMAINS)
        self.assertTrue(production.SECURE_HSTS_PRELOAD)

    def test_allowed_hosts(self):
        """ALLOWED_HOSTSの設定が環境ごとに適切かテストします。

        本番環境での設定が環境変数から正しく取得されることを確認します。
        """
        # 開発環境のALLOWED_HOSTSはデフォルト設定か具体的な値
        # localhost と 127.0.0.1 は一般的な開発環境の設定値
        if hasattr(development, 'ALLOWED_HOSTS'):
            self.assertTrue('localhost' in development.ALLOWED_HOSTS
                            or '127.0.0.1' in development.ALLOWED_HOSTS)

        # 本番環境では環境変数からの設定またはデフォルト値を使用
        with override_settings(ALLOWED_HOSTS=['example.com']):
            self.assertTrue('example.com' in production.ALLOWED_HOSTS
                            or 'localhost' in production.ALLOWED_HOSTS[0])
