"""ユーザー登録UseCaseのテスト

RegisterUserUseCaseの機能をテストします。
"""
import unittest
from unittest.mock import MagicMock, Mock, patch

from django.db import IntegrityError

from app.core.repositories import UserRepository
from app.core.usecases import (
    EmailAlreadyExistsError,
    InvalidEmailFormatError,
    PasswordMismatchError,
    RegisterUserInputData,
    RegisterUserOutputData,
    RegistrationError,
    WeakPasswordError,
)
from app.models.user import CustomUser
from app.usecases.register_user import RegisterUserInteractor


class TestRegisterUserUseCase(unittest.TestCase):
    """ユーザー登録UseCase（RegisterUserInteractor）のテストケース"""

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

    def test_register_user_other_error(self):
        """異常系：その他の予期せぬエラーが発生するケース"""
        # Arrange
        # モックの設定: メールは存在しない
        self.user_repository.find_by_email.return_value = None
        # モックの設定: create_userで一般的な例外発生
        with patch('app.models.user.CustomUser.objects.create_user', side_effect=Exception("一般エラー")):
            input_data = RegisterUserInputData(
                email='test@example.com',
                password='StrongP@ss123',
                password_confirmation='StrongP@ss123'
            )

            # Act & Assert
            with self.assertRaises(RegistrationError) as context:
                self.use_case.execute(input_data)

            # エラーメッセージに期待する文字列が含まれているか確認
            self.assertIn("ユーザー作成中にエラーが発生しました", str(context.exception))

    @patch('app.usecases.register_user.Email')
    def test_register_user_email_specific_error(self, mock_email_class):
        """異常系：メール検証時の具体的なエラーパスをテスト"""
        # Arrange
        # Emailクラスのインスタンス化時にValueErrorを発生させる
        mock_email_class.side_effect = ValueError("メールアドレスの形式が正しくありません")

        input_data = RegisterUserInputData(
            email='bad@format.com',  # この値は mock_email_class.side_effect で上書きされる
            password='StrongP@ss123',
            password_confirmation='StrongP@ss123'
        )

        # Act & Assert
        with self.assertRaises(InvalidEmailFormatError) as context:
            self.use_case.execute(input_data)

        # エラーメッセージの伝播を確認（任意）
        self.assertIn("メールアドレスの形式が正しくありません", str(context.exception))

    @patch('app.usecases.register_user.Email')
    @patch('app.usecases.register_user.Password')
    def test_register_user_password_specific_error(self, mock_password_class, mock_email_class):
        """異常系：パスワード検証時のWeakPasswordErrorパスをテスト"""
        # Arrange
        # Emailインスタンス化は成功させる
        mock_email_class.return_value = MagicMock()

        # Passwordクラスのインスタンス化時にパスワード関連のValueErrorを発生させる
        mock_password_class.side_effect = ValueError("パスワードは8文字以上必要です")

        input_data = RegisterUserInputData(
            email='test@example.com',
            password='weak',
            password_confirmation='weak'
        )

        # Act & Assert
        with self.assertRaises(WeakPasswordError) as context:
            self.use_case.execute(input_data)

        # エラーメッセージの伝播を確認
        self.assertIn("パスワードは8文字以上必要です", str(context.exception))

    @patch('app.usecases.register_user.Email')
    @patch('app.usecases.register_user.Password')
    def test_register_user_generic_validation_error(self, mock_password_class, mock_email_class):
        """異常系：その他の値オブジェクト検証エラーをテスト"""
        # Arrange
        # Emailのインスタンス化は成功させる
        mock_email_class.return_value = MagicMock()

        # Passwordクラスのインスタンス化時に"パスワード"という単語を完全に含まないValueErrorを発生させる
        # "password"という英語も避ける
        mock_password_class.side_effect = ValueError("検証に失敗しました")

        input_data = RegisterUserInputData(
            email='test@example.com',
            password='AnyPassword',
            password_confirmation='AnyPassword'
        )

        # Act & Assert
        with self.assertRaises(RegistrationError) as context:
            self.use_case.execute(input_data)

        # エラーメッセージの内容を確認
        self.assertIn("検証に失敗しました", str(context.exception))
        # WeakPasswordErrorやInvalidEmailFormatErrorではないことを確認（より厳密なテスト）
        self.assertNotIsInstance(context.exception, WeakPasswordError)
        self.assertNotIsInstance(context.exception, InvalidEmailFormatError)
