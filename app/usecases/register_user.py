"""
ユーザー登録 UseCase 実装。

新規ユーザーを登録するための UseCase を実装します。
"""
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


class RegisterUserInteractor(RegisterUserUseCase):
    """
    ユーザー登録 UseCase の実装。

    新規ユーザーを登録するための処理を実装します。
    """

    def __init__(self, user_repository: UserRepository):
        """
        コンストラクタ。

        Args:
            user_repository: ユーザーリポジトリ
        """
        self.user_repository = user_repository

    def execute(self, input_data: RegisterUserInputData) -> RegisterUserOutputData:
        """
        ユーザー登録処理を実行します。

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
        # 1. パスワード一致チェック
        if input_data.password != input_data.password_confirmation:
            raise PasswordMismatchError("パスワードが一致しません。")

        # 2. 値オブジェクトでバリデーション
        try:
            # Email値オブジェクトとPassword値オブジェクトでバリデーション
            Email(input_data.email)
            Password(input_data.password)
        except ValueError as e:
            # エラー内容に応じて適切なカスタム例外に変換
            if "パスワード" in str(e):
                raise WeakPasswordError(str(e))
            if "メール" in str(e):
                raise InvalidEmailFormatError(str(e))
            raise RegistrationError(str(e))  # Generic error

        # 3. メールアドレス重複チェック
        if self.user_repository.find_by_email(input_data.email):
            raise EmailAlreadyExistsError("このメールアドレスは既に使用されています。")

        # 4. ユーザーオブジェクト作成とパスワードハッシュ化
        try:
            user = CustomUser.objects.create_user(
                email=input_data.email,
                password=input_data.password
            )
        except IntegrityError:
            # レースコンディション考慮 (find_by_email後、create_user前に同じメールで登録された場合)
            raise EmailAlreadyExistsError("このメールアドレスは既に使用されています。")
        except Exception as e:
            # その他の予期せぬエラー
            raise RegistrationError(f"ユーザー作成中にエラーが発生しました: {str(e)}")

        # 5. OutputDataを返す
        return RegisterUserOutputData(user_id=user.id, email=user.email)
