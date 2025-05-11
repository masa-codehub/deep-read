"""ドメイン値オブジェクトを定義するモジュールです。

このモジュールはアプリケーションのドメインロジックで使用される値オブジェクトを定義します。
値オブジェクトはデータの整合性と不変性を確保するために使用されます。
"""

import re
from dataclasses import dataclass
from typing import Optional

from django.contrib.auth.password_validation import (
    validate_password as django_validate_password,
)
from django.core.exceptions import ValidationError


class Email:
    """メールアドレス値オブジェクトです。

    ユーザーのメールアドレスを表現し、形式の検証を行います。
    """

    def __init__(self, value: str):
        """メールアドレスを初期化します。

        Args:
            value: メールアドレス文字列

        Raises:
            ValueError: 無効なメールアドレス形式の場合
        """
        self._validate(value)
        self._value = value.lower()

    def _validate(self, value: str) -> None:
        """メールアドレスの形式を検証します。

        Args:
            value: 検証するメールアドレス文字列

        Raises:
            ValueError: 無効なメールアドレス形式の場合
        """
        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, value):
            raise ValueError(f"無効なメールアドレス形式です: {value}")

    def __eq__(self, other):
        """等価比較を行います。"""
        if not isinstance(other, Email):
            return NotImplemented
        return self._value == other._value

    @property
    def value(self) -> str:
        """メールアドレス値を取得します。

        Returns:
            str: 正規化されたメールアドレス
        """
        return self._value

    def __str__(self) -> str:
        """文字列表現を返します。

        Returns:
            str: メールアドレス文字列
        """
        return self._value


@dataclass(frozen=True)
class Password:
    """パスワード値オブジェクトです。

    ユーザーパスワードを表現し、ハッシュ化されたパスワードを保持します。
    """

    hashed_value: str
    salt: Optional[str] = None

    def __post_init__(self):
        """初期化後の処理を行います。"""
        # freezeされたオブジェクトではあるがpost_initでは変更可能
        object.__setattr__(self, "_value", self.hashed_value)
        self.validate_strength()

    @property
    def value(self) -> str:
        """パスワード値を取得します。

        Returns:
            str: パスワード値
        """
        return self.hashed_value

    def validate_strength(self):
        """パスワードの強度を検証します。

        Django設定ファイルの AUTH_PASSWORD_VALIDATORS に定義されたバリデータを使用します。
        一般的なバリデーションルール：
        - 最低8文字以上
        - 数字を含む
        - 簡単すぎるパスワードではない
        - よく使われる一般的なパスワードではない

        Raises:
            ValueError: パスワードが要件を満たさない場合
        """
        try:
            # Djangoのバリデータを使用してパスワード強度を検証
            django_validate_password(self.hashed_value)
        except ValidationError as e:
            # DjangoのValidationErrorをValueErrorに変換
            raise ValueError(f"パスワードが要件を満たしていません: {'; '.join(e.messages)}") from e

    def matches(self, confirmation: str) -> bool:
        """パスワードが確認用パスワードと一致するか確認します。

        Args:
            confirmation: 確認用パスワード文字列

        Returns:
            bool: 一致する場合はTrue、それ以外はFalse
        """
        return self.hashed_value == confirmation
