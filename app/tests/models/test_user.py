"""
ユーザーモデルのテスト。

User モデルの機能をテストするためのテストケースを含みます。
"""

from unittest import TestCase

import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestUserModel(TestCase):
    """
    ユーザーモデルのテスト。

    User モデルの機能をテストします。
    """

    def test_create_user(self):
        """基本的なユーザー作成機能をテストします。"""
        user = User.objects.create_user(email="test@example.com", password="password123")
        self.assertEqual(user.email, "test@example.com")

    def test_create_superuser(self):
        """スーパーユーザー作成機能をテストします。"""
        admin = User.objects.create_superuser(email="admin@example.com", password="admin123")
        self.assertTrue(admin.is_staff)

    def test_user_str(self):
        """ユーザーの文字列表現をテストします。"""
        user = User.objects.create_user(email="test@example.com", password="password123")
        self.assertEqual(str(user), "test@example.com")

    def test_email_normalized(self):
        """メールアドレスが正規化されることを確認します。"""
        user = User.objects.create_user(email="TEST@Example.com", password="password123")
        self.assertEqual(user.email, "TEST@example.com")

    def test_email_required(self):
        """メールアドレスが必須であることを確認します。"""
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="password123")

    def test_is_active_default(self):
        """デフォルトでアクティブであることを確認します。"""
        user = User.objects.create_user(email="test@example.com", password="password123")
        self.assertTrue(user.is_active)
