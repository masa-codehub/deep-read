"""
ログインユースケースのテスト
"""
import unittest
from unittest.mock import patch, MagicMock

from app.core.usecases import (
    LoginUserUseCase, LoginUserInputData, LoginUserOutputData,
    AuthenticationError, InvalidEmailFormatError
)
from app.domain.value_objects import Email
from app.usecases.login_user import LoginUserInteractor


class TestLoginUserUseCase(unittest.TestCase):
    """ログインユースケースのテスト"""

    def setUp(self):
        """テスト前の準備を行います"""
        self.usecase = LoginUserInteractor()

    @patch('app.usecases.login_user.authenticate')
    def test_login_success(self, mock_authenticate):
        """正常系: 正しい認証情報でログインできること"""
        # モックの設定
        mock_user = MagicMock()
        mock_user.id = 1
        mock_user.email = "user@example.com"
        mock_authenticate.return_value = mock_user

        # 実行
        input_data = LoginUserInputData(
            email="user@example.com",
            password="password123"
        )
        output_data = self.usecase.execute(input_data)

        # 検証
        mock_authenticate.assert_called_once_with(
            username="user@example.com",
            password="password123"
        )
        self.assertEqual(output_data.user_id, 1)
        self.assertEqual(output_data.email, "user@example.com")

    @patch('app.usecases.login_user.authenticate')
    def test_login_failure_user_not_found(self, mock_authenticate):
        """異常系: ユーザーが存在しない場合にAuthenticationErrorが発生すること"""
        # モックの設定
        mock_authenticate.return_value = None

        # 実行と検証
        input_data = LoginUserInputData(
            email="nonexistent@example.com",
            password="password123"
        )
        with self.assertRaises(AuthenticationError):
            self.usecase.execute(input_data)

        mock_authenticate.assert_called_once_with(
            username="nonexistent@example.com",
            password="password123"
        )

    @patch('app.usecases.login_user.authenticate')
    def test_login_failure_wrong_password(self, mock_authenticate):
        """異常系: パスワードが間違っている場合にAuthenticationErrorが発生すること"""
        # モックの設定
        mock_authenticate.return_value = None

        # 実行と検証
        input_data = LoginUserInputData(
            email="user@example.com",
            password="wrong_password"
        )
        with self.assertRaises(AuthenticationError):
            self.usecase.execute(input_data)

        mock_authenticate.assert_called_once_with(
            username="user@example.com",
            password="wrong_password"
        )

    @patch('app.usecases.login_user.authenticate')
    def test_login_failure_inactive_user(self, mock_authenticate):
        """異常系: アカウントが無効な場合にAuthenticationErrorが発生すること"""
        # モックの設定
        # Django authenticateは非アクティブユーザーに対してNoneを返す
        mock_authenticate.return_value = None

        # 実行と検証
        input_data = LoginUserInputData(
            email="inactive@example.com",
            password="password123"
        )
        with self.assertRaises(AuthenticationError):
            self.usecase.execute(input_data)

        mock_authenticate.assert_called_once_with(
            username="inactive@example.com",
            password="password123"
        )

    @patch('app.usecases.login_user.Email')
    def test_login_invalid_email_format(self, mock_email_class):
        """異常系: 不正なメール形式の場合にInvalidEmailFormatErrorが発生すること"""
        # モックの設定
        mock_email_class.side_effect = ValueError("無効なメールアドレス形式です")

        # 実行と検証
        input_data = LoginUserInputData(
            email="invalid-email",
            password="password123"
        )
        with self.assertRaises(InvalidEmailFormatError):
            self.usecase.execute(input_data)
