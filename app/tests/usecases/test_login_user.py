"""ログインユースケースのテストです。

ユーザーログイン機能の挙動を検証するテストケースを提供します。
"""

from unittest import TestCase
from unittest.mock import Mock, patch

import pytest

from app.core.usecases import AuthenticationError
from app.usecases.login_user import LoginUserInteractor


@pytest.mark.django_db
class TestLoginUserUseCase(TestCase):
    """ログインユースケースのテストクラスです。"""

    def setUp(self):
        """テスト環境のセットアップを行います。"""
        self.user_repository = Mock()
        self.security_gateway = Mock()
        self.use_case = LoginUserInteractor()

    @patch('app.usecases.login_user.authenticate')
    def test_successful_login(self, mock_authenticate):
        """正常なログイン処理のテストです。"""
        # テストデータの準備
        email = "test@example.com"
        password = "password123"

        # モックの設定
        mock_user = Mock()
        mock_user.id = 1
        mock_user.email = email
        mock_authenticate.return_value = mock_user

        # テスト対象のメソッド実行
        from app.usecases.login_user import LoginUserInputData
        input_data = LoginUserInputData(email=email, password=password)
        output_data = self.use_case.execute(input_data)

        # 検証
        self.assertEqual(output_data.user_id, 1)
        self.assertEqual(output_data.email, email)
        mock_authenticate.assert_called_once_with(
            username=email, password=password
        )

    @patch('app.usecases.login_user.authenticate')
    def test_login_with_non_existent_user(self, mock_authenticate):
        """存在しないユーザーでのログイン試行のテストです。"""
        # テストデータの準備
        email = "nonexistent@example.com"
        password = "password123"

        # モックの設定
        mock_authenticate.return_value = None

        # テスト対象のメソッド実行と例外発生の確認
        from app.usecases.login_user import LoginUserInputData
        input_data = LoginUserInputData(email=email, password=password)

        with self.assertRaises(AuthenticationError) as context:
            self.use_case.execute(input_data)

        # 検証
        self.assertIn("メールアドレスまたはパスワードが正しくありません", str(context.exception))
        mock_authenticate.assert_called_once_with(
            username=email, password=password
        )

    @patch('app.usecases.login_user.authenticate')
    def test_login_with_wrong_password(self, mock_authenticate):
        """誤ったパスワードでのログイン試行のテストです。"""
        # テストデータの準備
        email = "test@example.com"
        password = "wrong_password"

        # モックの設定
        mock_authenticate.return_value = None

        # テスト対象のメソッド実行と例外発生の確認
        from app.usecases.login_user import LoginUserInputData
        input_data = LoginUserInputData(email=email, password=password)

        with self.assertRaises(AuthenticationError) as context:
            self.use_case.execute(input_data)

        # 検証
        self.assertIn("メールアドレスまたはパスワードが正しくありません", str(context.exception))
        mock_authenticate.assert_called_once_with(
            username=email, password=password
        )
