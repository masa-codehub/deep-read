"""UserRepositoryのPostgreSQL実装に対する結合テスト

UserRepositoryインターフェースのPostgreSQL実装が正しく動作するかを検証します。
"""
import pytest
from django.test import TestCase
from app.adapters.db.user_repository import PostgresUserRepository
from app.models import CustomUser


@pytest.mark.django_db
class PostgresUserRepositoryTest(TestCase):
    """PostgresUserRepositoryの結合テスト"""

    def setUp(self):
        """各テスト実行前の準備"""
        self.repository = PostgresUserRepository()
        self.test_email = 'test@example.com'
        self.test_password = 'secure_password123'

    def test_save_new_user(self):
        """新規ユーザーを保存する機能のテスト"""
        # 新規ユーザーオブジェクトを作成
        user = CustomUser(
            email=self.test_email,
            is_active=True
        )
        user.set_password(self.test_password)  # パスワードをハッシュ化

        # リポジトリを使ってユーザーを保存
        saved_user = self.repository.save(user)

        # 保存されたユーザーがIDを持ち、データベースに保存されていることを確認
        self.assertIsNotNone(saved_user.id)

        # IDを使ってユーザーを検索できることを確認
        found_user = self.repository.find_by_id(saved_user.id)
        self.assertIsNotNone(found_user)
        self.assertEqual(found_user.email, self.test_email)

        # パスワードが平文ではなくハッシュ化されていることを確認
        self.assertNotEqual(found_user.password, self.test_password)
        # パスワードが検証可能であることを確認
        self.assertTrue(found_user.check_password(self.test_password))

    def test_save_existing_user(self):
        """既存ユーザーの更新機能のテスト"""
        # まず新規ユーザーを作成して保存
        user = CustomUser(
            email=self.test_email,
            first_name='',
            last_name=''
        )
        user.set_password(self.test_password)
        saved_user = self.repository.save(user)

        # ユーザー情報を更新
        new_first_name = '太郎'
        new_last_name = '山田'
        saved_user.first_name = new_first_name
        saved_user.last_name = new_last_name

        # 更新情報を保存
        updated_user = self.repository.save(saved_user)

        # 更新されたことを確認
        self.assertEqual(updated_user.id, saved_user.id)  # 同じユーザー
        self.assertEqual(updated_user.first_name, new_first_name)
        self.assertEqual(updated_user.last_name, new_last_name)

        # データベースに反映されていることを確認
        reloaded_user = self.repository.find_by_id(saved_user.id)
        self.assertEqual(reloaded_user.first_name, new_first_name)
        self.assertEqual(reloaded_user.last_name, new_last_name)

    def test_find_by_id_found(self):
        """IDからユーザーを検索できることのテスト"""
        # ユーザーを作成・保存
        user = CustomUser(email=self.test_email)
        user.set_password(self.test_password)
        saved_user = self.repository.save(user)

        # IDで検索
        found_user = self.repository.find_by_id(saved_user.id)

        # 結果を検証
        self.assertIsNotNone(found_user)
        self.assertEqual(found_user.id, saved_user.id)
        self.assertEqual(found_user.email, self.test_email)

    def test_find_by_id_not_found(self):
        """存在しないIDでの検索が適切に扱われることのテスト"""
        # 存在しないID（非常に大きな値）で検索
        non_existent_user = self.repository.find_by_id(999999)

        # Noneが返されることを確認
        self.assertIsNone(non_existent_user)

    def test_find_by_email_found(self):
        """メールアドレスからユーザーを検索できることのテスト"""
        # ユーザーを作成・保存
        user = CustomUser(email=self.test_email)
        user.set_password(self.test_password)
        self.repository.save(user)

        # メールアドレスで検索
        found_user = self.repository.find_by_email(self.test_email)

        # 結果を検証
        self.assertIsNotNone(found_user)
        self.assertEqual(found_user.email, self.test_email)

    def test_find_by_email_not_found(self):
        """存在しないメールアドレスでの検索が適切に扱われることのテスト"""
        # 存在しないメールアドレスで検索
        non_existent_user = self.repository.find_by_email(
            'nonexistent@example.com')

        # Noneが返されることを確認
        self.assertIsNone(non_existent_user)

    def test_find_by_email_case_insensitive(self):
        """メールアドレス検索が大文字小文字を区別しないことのテスト"""
        # 小文字のメールアドレスでユーザーを作成・保存
        user = CustomUser(email=self.test_email.lower())
        user.set_password(self.test_password)
        self.repository.save(user)

        # 大文字のメールアドレスで検索
        found_user = self.repository.find_by_email(self.test_email.upper())

        # 大文字小文字に関わらず検索できることを確認
        self.assertIsNotNone(found_user)
        self.assertEqual(found_user.email.lower(), self.test_email.lower())
