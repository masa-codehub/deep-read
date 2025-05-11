"""URLルーティング設定のテスト

URLパターンが正しく設定されているかを確認するテスト
"""
from django.test import TestCase
from django.urls import resolve, reverse


class TestUrls(TestCase):
    """URLルーティング設定のテストケース"""

    def test_admin_url(self):
        """管理者URLが正しくresolveされることをテスト"""
        url = reverse('admin:index')
        self.assertEqual(url, '/admin/')

        resolver = resolve('/admin/')
        self.assertEqual(resolver.app_name, 'admin')
        self.assertEqual(resolver.url_name, 'index')

    def test_admin_login_url(self):
        """管理者ログインURLが正しくresolveされることをテスト"""
        url = reverse('admin:login')
        self.assertEqual(url, '/admin/login/')

        resolver = resolve('/admin/login/')
        self.assertEqual(resolver.app_name, 'admin')
        self.assertEqual(resolver.url_name, 'login')
