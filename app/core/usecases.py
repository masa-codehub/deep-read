"""
UseCase インターフェース定義

クリーンアーキテクチャのUseCase層のインターフェースを定義します。
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, List


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
    """
    ユーザー登録ユースケース

    新規ユーザーを登録するための処理を定義します。
    """

    @abstractmethod
    def execute(self, input_data: RegisterUserInputData) -> RegisterUserOutputData:
        """
        ユーザー登録処理を実行します。

        Args:
            input_data: ユーザー登録に必要な入力データ

        Returns:
            RegisterUserOutputData: 登録されたユーザー情報

        Raises:
            RegistrationError: 登録処理で発生したエラー
        """
        pass


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
    """
    ユーザーログインユースケース

    登録済みユーザーの認証を行うための処理を定義します。
    """

    @abstractmethod
    def execute(self, input_data: LoginUserInputData) -> LoginUserOutputData:
        """
        ユーザーログイン処理を実行します。

        Args:
            input_data: ユーザーログインに必要な入力データ

        Returns:
            LoginUserOutputData: 認証されたユーザー情報

        Raises:
            AuthenticationError: 認証処理で発生したエラー
        """
        pass


# --- カスタム例外 ---
class RegistrationError(Exception):
    """ユーザー登録処理中のエラーの基底クラス"""
    pass


class EmailAlreadyExistsError(RegistrationError):
    """メールアドレスが既に存在する場合のエラー"""
    pass


class PasswordMismatchError(RegistrationError):
    """パスワードと確認用パスワードが一致しない場合のエラー"""
    pass


class WeakPasswordError(RegistrationError):
    """パスワードが要件を満たしていない場合のエラー"""
    pass


class InvalidEmailFormatError(RegistrationError):
    """メールアドレス形式が不正な場合のエラー"""
    pass


class AuthenticationError(Exception):
    """認証失敗時のエラー"""
    pass
