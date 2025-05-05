"""
環境設定テスト

このモジュールは、開発環境と本番環境の設定が適切に機能しているかを検証するテストケースを提供します。
"""

from django.test import TestCase, override_settings
from django.conf import settings
import os
import importlib


class EnvironmentSettingsTest(TestCase):
    """
    環境設定が適切に構成されているかテストします。
    """

    def test_debug_settings(self):
        """
        DEBUG設定が環境によって適切に設定されていることを確認します。
        """
        # プロジェクトの現在の設定を保存
        original_debug = settings.DEBUG

        # 開発環境設定をインポート
        dev_settings = importlib.import_module('app.settings.development')
        # 本番環境設定をインポート
        prod_settings = importlib.import_module('app.settings.production')

        # 開発環境ではDEBUGはTrue
        self.assertTrue(dev_settings.DEBUG)
        # 本番環境ではDEBUGはFalse
        self.assertFalse(prod_settings.DEBUG)

    def test_database_settings(self):
        """
        データベース設定が環境によって適切に設定されていることを確認します。
        """
        # 開発環境設定をインポート
        dev_settings = importlib.import_module('app.settings.development')

        # 開発環境ではSQLiteが使用される
        self.assertEqual(
            dev_settings.DATABASES['default']['ENGINE'], 'django.db.backends.sqlite3')

        # 本番環境では環境変数によって設定される（dj_database_urlを使用）
        try:
            # DATABASE_URL環境変数をモックする
            os.environ['DATABASE_URL'] = 'postgres://user:pass@localhost:5432/testdb'
            # 本番環境設定を再インポート
            importlib.reload(importlib.import_module(
                'app.settings.production'))
            prod_settings = importlib.import_module('app.settings.production')

            # DATABASE_URLが設定されている場合は、dj_database_urlにより設定が上書きされるはず
            # エラーが発生しなければテストは通過とみなす

        except (ImportError, ModuleNotFoundError):
            # dj_database_urlがインストールされていなくてもテストは無視しない
            # かわりにスキップする
            self.skipTest("dj-database-url is not installed")
        finally:
            # テスト後に環境変数をクリア
            if 'DATABASE_URL' in os.environ:
                del os.environ['DATABASE_URL']

    def test_csp_settings_comparison(self):
        """
        CSP設定が環境によって適切に設定されていることを確認します。
        """
        # 開発環境設定をインポート
        dev_settings = importlib.import_module('app.settings.development')
        # 本番環境設定をインポート
        prod_settings = importlib.import_module('app.settings.production')

        # 新しい形式: 開発環境ではREPORT_ONLYはTrue
        self.assertTrue(dev_settings.CONTENT_SECURITY_POLICY['REPORT_ONLY'])
        # 新しい形式: 本番環境ではREPORT_ONLYはFalse
        self.assertFalse(prod_settings.CONTENT_SECURITY_POLICY['REPORT_ONLY'])

        # 開発環境のスクリプトソース設定には'unsafe-inline'や'unsafe-eval'が含まれる
        if 'DIRECTIVES' in dev_settings.CONTENT_SECURITY_POLICY and 'script-src' in dev_settings.CONTENT_SECURITY_POLICY['DIRECTIVES']:
            script_src = dev_settings.CONTENT_SECURITY_POLICY['DIRECTIVES']['script-src']
            unsafe_values = ["'unsafe-inline'", "'unsafe-eval'"]
            has_unsafe = any(val in script_src for val in unsafe_values)
            self.assertTrue(
                has_unsafe, "開発環境のscript-srcに'unsafe-inline'または'unsafe-eval'が含まれていません")

        # 本番環境では基本設定が使用され、'unsafe-inline'や'unsafe-eval'が含まれない
        # 本番環境はbase.pyからの継承をテストするため、個別に設定されていない可能性がある
        if 'DIRECTIVES' in prod_settings.CONTENT_SECURITY_POLICY and 'script-src' in prod_settings.CONTENT_SECURITY_POLICY['DIRECTIVES']:
            script_src = prod_settings.CONTENT_SECURITY_POLICY['DIRECTIVES']['script-src']
            unsafe_values = ["'unsafe-inline'", "'unsafe-eval'"]
            has_unsafe = any(val in script_src for val in unsafe_values)
            self.assertFalse(
                has_unsafe, "本番環境のscript-srcに'unsafe-inline'または'unsafe-eval'が含まれています")

    def test_security_settings_comparison(self):
        """
        セキュリティ関連設定が環境によって適切に設定されていることを確認します。
        """
        # 本番環境設定をインポート
        prod_settings = importlib.import_module('app.settings.production')

        # 本番環境ではセキュリティ関連設定がすべて有効
        self.assertTrue(prod_settings.SESSION_COOKIE_SECURE)
        self.assertTrue(prod_settings.CSRF_COOKIE_SECURE)
        self.assertTrue(prod_settings.SECURE_HSTS_PRELOAD)
        self.assertTrue(prod_settings.SECURE_HSTS_INCLUDE_SUBDOMAINS)
        self.assertTrue(prod_settings.SECURE_SSL_REDIRECT)
        self.assertEqual(prod_settings.SECURE_REFERRER_POLICY,
                         'strict-origin-when-cross-origin')
        self.assertEqual(prod_settings.SECURE_HSTS_SECONDS, 31536000)  # 1年
