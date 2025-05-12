"""ユーザー登録 UseCase 実装。

新規ユーザーを登録するための UseCase を実装します。
"""
import logging  # 追加
from django.db import IntegrityError

from app.core.repositories import UserRepository
from app.core.usecases import (
    EmailAlreadyExistsError,
    InvalidEmailFormatError,
    PasswordMismatchError,
    RegisterUserInputData,
    RegisterUserOutputData,
    RegisterUserUseCase,
    RegistrationError,
    WeakPasswordError,
)
from app.domain.value_objects import Email, Password
from app.models import CustomUser

logger = logging.getLogger(__name__)  # 追加


class RegisterUserInteractor(RegisterUserUseCase):
    """ユーザー登録 UseCase の実装。

    新規ユーザーを登録するための処理を実装します。
    """

    def __init__(self, user_repository: UserRepository):
        """コンストラクタ。

        Args:
            user_repository: ユーザーリポジトリ
        """
        self.user_repository = user_repository

    def execute(self, input_data: RegisterUserInputData) -> RegisterUserOutputData:
        """ユーザー登録処理を実行します。

        Args:
            input_data: ユーザー登録に必要な入力データ

        Returns:
            RegisterUserOutputData: 登録されたユーザー情報

        Raises:
            PasswordMismatchError: パスワードと確認用パスワードが一致しない場合
            WeakPasswordError: パスワードが要件を満たしていない場合
            InvalidEmailFormatError: メールアドレス形式が不正な場合
            EmailAlreadyExistsError: メールアドレスが既に存在する場合
            RegistrationError: その他の登録エラー
        """
        logger.info(f"Starting user registration for email: {input_data.email}")  # 追加

        # 1. パスワード一致チェック
        if input_data.password != input_data.password_confirmation:
            logger.warning("Password mismatch error.")  # 追加
            raise PasswordMismatchError("パスワードが一致しません。")

        # 2. 値オブジェクトでバリデーション
        try:
            # Email値オブジェクトとPassword値オブジェクトでバリデーション
            Email(input_data.email)
            Password(input_data.password)
        except ValueError as e:
            # エラー内容に応じて適切なカスタム例外に変換
            if "パスワード" in str(e):
                logger.error(f"Weak password error: {e}", exc_info=True)  # 追加
                raise WeakPasswordError(str(e)) from e
            if "メール" in str(e):
                logger.error(f"Invalid email format error: {e}", exc_info=True)  # 追加
                raise InvalidEmailFormatError(str(e)) from e
            logger.error(f"Registration error: {e}", exc_info=True)  # 追加
            raise RegistrationError(str(e)) from e  # Generic error

        # 3. メールアドレス重複チェック
        if self.user_repository.find_by_email(input_data.email):
            logger.warning("Email already exists error.")  # 追加
            raise EmailAlreadyExistsError("このメールアドレスは既に使用されています。")

        # 4. ユーザーオブジェクト作成とパスワードハッシュ化
        try:
            user = CustomUser.objects.create_user(
                email=input_data.email,
                password=input_data.password
            )
        except IntegrityError as exc:
            # レースコンディション考慮 (find_by_email後、create_user前に同じメールで登録された場合)
            logger.error("Email already exists error due to race condition.", exc_info=True)  # 追加
            raise EmailAlreadyExistsError("このメールアドレスは既に使用されています。") from exc
        except Exception as e:
            # その他の予期せぬエラー
            logger.error(f"Unexpected error during user creation: {e}", exc_info=True)  # 追加
            raise RegistrationError(f"ユーザー作成中にエラーが発生しました: {str(e)}") from e

        # 5. OutputDataを返す
        logger.info(f"User {user.email} registered successfully with ID: {user.id}")  # 追加
        return RegisterUserOutputData(user_id=user.id, email=user.email)
