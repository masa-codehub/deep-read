"""セキュリティ設定テスト

このモジュールは、Django設定のセキュリティ関連設定が
正しく適用されているかを検証するためのテストケースを提供します。
"""

from django.test import TestCase, Client, override_settings
from django.urls import reverse
from django.middleware.csrf import get_token


class SecurityHeadersTest(TestCase):
    """セキュリティヘッダーが正しくレスポンスに含まれていることをテストします。"""

    def setUp(self):
        """テスト環境のセットアップ"""
        self.client = Client()
        # ルートURLを使用するが、実際のURLが異なる場合は適宜変更
        self.test_url = '/'

    def test_security_headers_production_settings(self):
        """本番環境設定でのセキュリティヘッダーをテストします。"""
        # 本番設定を強制適用するデコレータ
        # CONTENT_SECURITY_POLICY.REPORT_ONLYをFalseに設定（本番設定と同じ）
        @override_settings(
            DEBUG=False,
            CONTENT_SECURITY_POLICY={'REPORT_ONLY': False},
            SECURE_HSTS_SECONDS=31536000,
            SECURE_HSTS_INCLUDE_SUBDOMAINS=True,
            SECURE_HSTS_PRELOAD=True,
            SECURE_SSL_REDIRECT=True,
            SESSION_COOKIE_SECURE=True,
            CSRF_COOKIE_SECURE=True,
            SECURE_REFERRER_POLICY='strict-origin-when-cross-origin'
        )
        def check_prod_headers():
            response = self.client.get(self.test_url, secure=True)

            # X-Frame-Options ヘッダーが存在するか確認
            self.assertIn('X-Frame-Options', response.headers)
            self.assertEqual(response.headers['X-Frame-Options'], 'DENY')

            # Content-Security-Policy ヘッダーが存在するか確認（django-csp 4.0では常にContent-Security-Policyが使用される）
            self.assertIn('Content-Security-Policy', response.headers)

            # Referrer-Policy ヘッダーが存在するか確認
            self.assertIn('Referrer-Policy', response.headers)
            self.assertEqual(
                response.headers['Referrer-Policy'], 'strict-origin-when-cross-origin')

            # HSTS ヘッダーが存在するか確認
            self.assertIn('Strict-Transport-Security', response.headers)
            self.assertIn('max-age=31536000',
                          response.headers['Strict-Transport-Security'])
            self.assertIn('includeSubDomains',
                          response.headers['Strict-Transport-Security'])
            self.assertIn(
                'preload', response.headers['Strict-Transport-Security'])

        check_prod_headers()

    def test_security_headers_development_settings(self):
        """開発環境設定でのセキュリティヘッダーをテストします。"""
        # 開発設定を強制適用するデコレータ
        # CONTENT_SECURITY_POLICY.REPORT_ONLYをTrueに設定（開発設定と同じ）
        @override_settings(
            DEBUG=True,
            CONTENT_SECURITY_POLICY={'REPORT_ONLY': True},
        )
        def check_dev_headers():
            response = self.client.get(self.test_url)

            # X-Frame-Options ヘッダーが存在するか確認（開発環境でも設定されるべき）
            self.assertIn('X-Frame-Options', response.headers)

            # Content-Security-Policy ヘッダーが存在するか確認（django-csp 4.0では常にContent-Security-Policyが使用される）
            # REPORT_ONLYがTrueでも、古い命名規則とは異なりContent-Security-Policyヘッダーが使用される
            self.assertIn('Content-Security-Policy', response.headers)

        check_dev_headers()


class CSRFProtectionTest(TestCase):
    """CSRFトークン保護機能が正しく動作するかテストします。"""

    def setUp(self):
        """テスト環境のセットアップ"""
        self.client = Client(enforce_csrf_checks=True)
        # 管理画面のログインURLをテスト対象として使用
        self.login_url = reverse('admin:login')

    def test_csrf_token_included(self):
        """CSRFトークンがGETレスポンスに含まれていることを確認します。"""
        response = self.client.get(self.login_url)
        self.assertEqual(response.status_code, 200)

        # レスポンスHTMLにcsrfmiddlewaretokenが含まれていることを確認
        self.assertContains(response, 'csrfmiddlewaretoken')

    def test_csrf_protection_enforced(self):
        """CSRFトークンなしでPOSTすると403エラーになることを確認します。"""
        # CSRFトークンなしでPOSTリクエスト
        response = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'testpassword123'
        })

        # CSRFトークンがないので403エラーになるはず
        self.assertEqual(response.status_code, 403)

    def test_csrf_protection_pass(self):
        """正しいCSRFトークンでPOSTすると成功することを確認します。

        ※実際のログインは失敗するが、CSRF検証は通過することを確認
        """
        # まずGETリクエストでCSRFトークンを取得
        client = Client()
        response = client.get(self.login_url)
        csrf_token = get_token(response.wsgi_request)

        # 取得したCSRFトークンを使用してPOSTリクエスト
        response = client.post(self.login_url, {
            'username': 'testuser',
            'password': 'testpassword123',
            'csrfmiddlewaretoken': csrf_token
        })

        # CSRFエラー（403）にはならないことを確認
        # ※認証情報は無効なのでログインは失敗するが、CSRFトークン検証は通過するはず
        self.assertNotEqual(response.status_code, 403)


class ContentSecurityPolicyTest(TestCase):
    """Content Security Policy（CSP）が正しく設定されているかテストします。"""

    def setUp(self):
        """テスト環境のセットアップ"""
        self.client = Client()
        self.test_url = '/'

    def test_csp_directives_production(self):
        """本番環境のCSPディレクティブが正しく設定されているかテストします。"""
        @override_settings(
            DEBUG=False,
            CONTENT_SECURITY_POLICY={
                'DIRECTIVES': {
                    'default-src': ("'none'",),
                    'script-src': ("'self'",),
                    'style-src': ("'self'",),
                    'img-src': ("'self'", "data:"),
                },
                'REPORT_ONLY': False,
                'REPLACE': True,
            }
        )
        def check_csp_production():
            response = self.client.get(self.test_url, secure=True)

            # CSPヘッダーが存在することを確認
            self.assertIn('Content-Security-Policy', response.headers)
            csp_header = response.headers['Content-Security-Policy']

            # 重要なCSPディレクティブが含まれていることを確認
            self.assertIn("default-src 'none'", csp_header)
            self.assertIn("script-src 'self'", csp_header)
            self.assertIn("style-src 'self'", csp_header)
            self.assertIn("img-src 'self' data:", csp_header)

        check_csp_production()

    def test_csp_directives_development(self):
        """開発環境のCSPディレクティブが正しく設定されているかテストします。"""
        @override_settings(
            DEBUG=True,
            CONTENT_SECURITY_POLICY={
                'DIRECTIVES': {
                    'default-src': ("'none'",),
                    'script-src': ("'self'", "'unsafe-inline'", "'unsafe-eval'"),
                    'style-src': ("'self'", "'unsafe-inline'"),
                    'connect-src': ("'self'", "http://localhost:*", "ws://localhost:*"),
                },
                'REPORT_ONLY': True,
                'REPLACE': True,
            }
        )
        def check_csp_development():
            response = self.client.get(self.test_url)

            # django-csp 4.0では、REPORT_ONLYがTrueでもヘッダー名はContent-Security-Policyとなる
            self.assertIn('Content-Security-Policy', response.headers)
            csp_header = response.headers['Content-Security-Policy']

            # 開発環境特有の緩和された設定が含まれていることを確認
            self.assertIn("script-src", csp_header)
            # 開発環境では'unsafe-inline'と'unsafe-eval'が許可されているはず
            self.assertTrue(
                "'unsafe-inline'" in csp_header or "'unsafe-eval'" in csp_header)
            # 開発環境では特定のlocalhost接続が許可されているはず
            self.assertIn("connect-src", csp_header)
            self.assertTrue(
                "http://localhost" in csp_header or "ws://localhost" in csp_header)

        check_csp_development()
