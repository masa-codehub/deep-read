"""ユースケースの基底クラス定義モジュール。

このモジュールでは、アプリケーションのユースケースを実装するための基本クラスを提供します。
クリーンアーキテクチャに基づいたユースケースパターンを実装しています。
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Generic, TypeVar

InputType = TypeVar('InputType')
OutputType = TypeVar('OutputType')


@dataclass
class ResponseModel:
    """レスポンスモデルの基底クラス。"""
    success: bool
    message: str = ""


class UseCase(Generic[InputType, OutputType], ABC):
    """ユースケースの基底抽象クラス。"""

    @abstractmethod
    def execute(self, input_data: InputType) -> OutputType:
        """ユースケースを実行する。

        Args:
            input_data: ユースケースの入力データ

        Returns:
            OutputType: ユースケースの出力データ
        """


class ReadUseCase(UseCase[InputType, OutputType], ABC):
    """読み取り操作を行うユースケースの基底クラス。"""

    @abstractmethod
    def execute(self, input_data: InputType) -> OutputType:
        """読み取りユースケースを実行する。

        Args:
            input_data: 読み取り操作の入力データ

        Returns:
            OutputType: 読み取り操作の結果
        """


class WriteUseCase(UseCase[InputType, OutputType], ABC):
    """書き込み操作を行うユースケースの基底クラス。"""

    @abstractmethod
    def execute(self, input_data: InputType) -> OutputType:
        """書き込みユースケースを実行する。

        Args:
            input_data: 書き込み操作の入力データ

        Returns:
            OutputType: 書き込み操作の結果
        """


class ReadWriteUseCase(UseCase[InputType, OutputType], ABC):
    """読み書き両方の操作を行うユースケースの基底クラス。"""

    @abstractmethod
    def execute(self, input_data: InputType) -> OutputType:
        """読み書きユースケースを実行する。

        Args:
            input_data: 読み書き操作の入力データ

        Returns:
            OutputType: 読み書き操作の結果
        """


@dataclass
class SuccessResponse(ResponseModel):
    """成功レスポンス。"""
    success: bool = True


@dataclass
class ErrorResponse(ResponseModel):
    """エラーレスポンス。"""
    success: bool = False


@dataclass
class NotFoundResponse(ErrorResponse):
    """リソースが見つからない場合のレスポンス。"""
    message: str = "リソースが見つかりませんでした。"


@dataclass
class ValidationErrorResponse(ErrorResponse):
    """バリデーションエラーのレスポンス。"""
    message: str = "入力値が不正です。"


@dataclass
class AuthenticationErrorResponse(ErrorResponse):
    """認証エラーのレスポンス。"""
    message: str = "認証に失敗しました。"


@dataclass
class AuthorizationErrorResponse(ErrorResponse):
    """権限エラーのレスポンス。"""
    message: str = "操作を行う権限がありません。"


# --- ユーザー登録関連 ---
@dataclass(frozen=True)
class RegisterUserInputData:
    """ユーザー登録入力データ"""
    email: str
    password: str
    password_confirmation: str


@dataclass(frozen=True)
class RegisterUserOutputData:
    """ユーザー登録出力データ"""
    user_id: int
    email: str


class RegisterUserUseCase(ABC):
    """ユーザー登録ユースケース

    新規ユーザーを登録するための処理を定義します。
    """

    @abstractmethod
    def execute(self, input_data: RegisterUserInputData) -> RegisterUserOutputData:
        """ユーザー登録処理を実行します。

        Args:
            input_data: ユーザー登録に必要な入力データ

        Returns:
            RegisterUserOutputData: 登録されたユーザー情報

        Raises:
            RegistrationError: 登録処理で発生したエラー
        """


# --- ログイン関連 ---
@dataclass(frozen=True)
class LoginUserInputData:
    """ユーザーログイン入力データ"""
    email: str
    password: str


@dataclass(frozen=True)
class LoginUserOutputData:
    """ユーザーログイン出力データ"""
    user_id: int
    email: str


class LoginUserUseCase(ABC):
    """ユーザーログインユースケース

    登録済みユーザーの認証を行うための処理を定義します。
    """

    @abstractmethod
    def execute(self, input_data: LoginUserInputData) -> LoginUserOutputData:
        """ユーザーログイン処理を実行します。

        Args:
            input_data: ユーザーログインに必要な入力データ

        Returns:
            LoginUserOutputData: 認証されたユーザー情報

        Raises:
            AuthenticationError: 認証処理で発生したエラー
        """


# --- カスタム例外 ---
class RegistrationError(Exception):
    """ユーザー登録処理中のエラーの基底クラス"""


class EmailAlreadyExistsError(RegistrationError):
    """メールアドレスが既に存在する場合のエラー"""


class PasswordMismatchError(RegistrationError):
    """パスワードと確認用パスワードが一致しない場合のエラー"""


class WeakPasswordError(RegistrationError):
    """パスワードが要件を満たしていない場合のエラー"""


class InvalidEmailFormatError(RegistrationError):
    """メールアドレス形式が不正な場合のエラー"""


class AuthenticationError(Exception):
    """認証失敗時のエラー"""
