"""
ログインユースケースの実装。

登録済みユーザーの認証を行うための処理を実装します。
"""
from django.contrib.auth import authenticate

from app.core.usecases import (
    AuthenticationError,
    InvalidEmailFormatError,
    LoginUserInputData,
    LoginUserOutputData,
    LoginUserUseCase,
)
from app.domain.value_objects import Email


class LoginUserInteractor(LoginUserUseCase):
    """
    ログインユースケース実装クラス。

    ユーザーのメールアドレスとパスワードを受け取り、認証を行います。
    認証にはDjangoの標準認証システム（authenticate関数）を使用します。
    """

    def execute(self, input_data: LoginUserInputData) -> LoginUserOutputData:
        """
        ユーザーログイン処理を実行します。

        Args:
            input_data: ユーザーログインに必要な入力データ（メールアドレス、パスワード）

        Returns:
            LoginUserOutputData: 認証されたユーザー情報

        Raises:
            InvalidEmailFormatError: メールアドレス形式が不正な場合
            AuthenticationError: 認証に失敗した場合（ユーザーが存在しない、パスワードが不正、アカウントが無効）
        """
        # メールアドレス形式のバリデーション
        try:
            # バリデーションのみ行い、変数は使用しない
            Email(input_data.email)
        except ValueError:
            raise InvalidEmailFormatError(
                f"無効なメールアドレス形式です: {input_data.email}")

        # Djangoの標準認証システムを使用して認証
        # authenticateはユーザーが存在しない場合、パスワードが不正な場合、
        # または非アクティブユーザーの場合にNoneを返す
        user = authenticate(username=input_data.email,
                            password=input_data.password)

        # 認証結果の確認
        if user is None:
            # ユーザーが存在しないか、パスワードが不正か、アカウントが非アクティブ
            raise AuthenticationError("メールアドレスまたはパスワードが正しくありません")

        # 認証成功、出力データを返す
        return LoginUserOutputData(
            user_id=user.id,
            email=user.email
        )
