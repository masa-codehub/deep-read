"""
ユーザー登録UseCaseのテスト

RegisterUserUseCaseの機能をテストします。
"""
import unittest
from unittest.mock import Mock, patch

from django.db import IntegrityError
from django.core.exceptions import ValidationError

from app.core.usecases import (
    RegisterUserInputData, RegisterUserOutputData,
    EmailAlreadyExistsError, PasswordMismatchError,
    WeakPasswordError, InvalidEmailFormatError
)
from app.core.repositories import UserRepository
from app.models.user import CustomUser
from app.usecases.register_user import RegisterUserInteractor


class TestRegisterUserUseCase(unittest.TestCase):
    """
    ユーザー登録UseCase（RegisterUserInteractor）のテストケース
    """

    def setUp(self):
        """テストの前準備"""
        # UserRepositoryのモック作成
        self.user_repository = Mock(spec=UserRepository)
        # テスト対象のUseCaseインスタンス作成
        self.use_case = RegisterUserInteractor(self.user_repository)

    def test_register_user_success(self):
        """正常系：ユーザー登録が成功するケース"""
        # Arrange
        # モックの設定: メールは存在しない
        self.user_repository.find_by_email.return_value = None
        # モックの設定: カスタムユーザー作成用
        mock_user = Mock(spec=CustomUser)
        mock_user.id = 1
        mock_user.email = 'test@example.com'
        # Djangoのcreate_userのモック設定
        with patch('app.models.user.CustomUser.objects.create_user', return_value=mock_user) as create_user_mock:
            # 入力データ
            input_data = RegisterUserInputData(
                email='test@example.com',
                password='StrongP@ss123',
                password_confirmation='StrongP@ss123'
            )

            # Act
            output_data = self.use_case.execute(input_data)

            # Assert
            # create_userが正しい引数で呼び出されたことを検証
            create_user_mock.assert_called_once_with(
                email='test@example.com',
                password='StrongP@ss123'
            )

        # find_by_emailが正しく呼ばれたか
        self.user_repository.find_by_email.assert_called_once_with(
            'test@example.com')
        # 出力データが期待通りか
        self.assertIsInstance(output_data, RegisterUserOutputData)
        self.assertEqual(output_data.user_id, 1)
        self.assertEqual(output_data.email, 'test@example.com')

    def test_register_user_password_mismatch(self):
        """異常系：パスワードと確認用パスワードが一致しないケース"""
        # Arrange
        input_data = RegisterUserInputData(
            email='test@example.com',
            password='StrongP@ss123',
            password_confirmation='DifferentP@ss456'
        )

        # Act & Assert
        with self.assertRaises(PasswordMismatchError):
            self.use_case.execute(input_data)

        # find_by_emailが呼ばれていないことを確認
        self.user_repository.find_by_email.assert_not_called()

    def test_register_user_email_exists(self):
        """異常系：メールアドレスが既に存在するケース"""
        # Arrange
        # モックの設定: メールアドレスは既に存在する
        mock_user = Mock(spec=CustomUser)
        self.user_repository.find_by_email.return_value = mock_user

        input_data = RegisterUserInputData(
            email='existing@example.com',
            password='StrongP@ss123',
            password_confirmation='StrongP@ss123'
        )

        # Act & Assert
        with self.assertRaises(EmailAlreadyExistsError):
            self.use_case.execute(input_data)

        # find_by_emailが正しく呼ばれたか
        self.user_repository.find_by_email.assert_called_once_with(
            'existing@example.com')

    def test_register_user_weak_password(self):
        """異常系：パスワードが要件を満たさないケース"""
        # Arrange
        input_data = RegisterUserInputData(
            email='test@example.com',
            password='weak',  # 弱いパスワード
            password_confirmation='weak'
        )

        # Act & Assert
        with self.assertRaises(WeakPasswordError):
            self.use_case.execute(input_data)

    def test_register_user_invalid_email(self):
        """異常系：メールアドレス形式が不正なケース"""
        # Arrange
        input_data = RegisterUserInputData(
            email='invalid-email',  # 不正なメールアドレス
            password='StrongP@ss123',
            password_confirmation='StrongP@ss123'
        )

        # Act & Assert
        with self.assertRaises(InvalidEmailFormatError):
            self.use_case.execute(input_data)

    def test_register_user_database_error(self):
        """異常系：データベースエラーが発生するケース"""
        # Arrange
        # モックの設定: メールは存在しない
        self.user_repository.find_by_email.return_value = None
        # モックの設定: create_userでIntegrityError発生
        with patch('app.models.user.CustomUser.objects.create_user', side_effect=IntegrityError):
            input_data = RegisterUserInputData(
                email='test@example.com',
                password='StrongP@ss123',
                password_confirmation='StrongP@ss123'
            )

            # Act & Assert
            with self.assertRaises(EmailAlreadyExistsError):
                self.use_case.execute(input_data)
