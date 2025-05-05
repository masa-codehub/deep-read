"""
値オブジェクト定義

ドメイン内での値の整合性を保証するための値オブジェクトを定義します。
"""
import re
from dataclasses import dataclass
from django.core.validators import validate_email as django_validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password as django_validate_password


@dataclass(frozen=True)
class Email:
    """
    メールアドレス値オブジェクト

    有効なメールアドレス形式であることを保証します。
    """
    value: str

    def __post_init__(self):
        try:
            # Djangoのバリデータを使用してメールアドレス形式を検証
            django_validate_email(self.value)
        except ValidationError:
            raise ValueError(f"無効なメールアドレス形式です: {self.value}")

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True)
class Password:
    """
    パスワード値オブジェクト

    パスワードの強度を検証します。Djangoの標準パスワードバリデーションを利用します。
    """
    value: str

    def __post_init__(self):
        self.validate_strength()

    def validate_strength(self):
        """
        パスワードの強度を検証します。

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
            django_validate_password(self.value)
        except ValidationError as e:
            # DjangoのValidationErrorをValueErrorに変換
            raise ValueError(f"パスワードが要件を満たしていません: {'; '.join(e.messages)}")

    def matches(self, confirmation: str) -> bool:
        """
        パスワードが確認用パスワードと一致するか確認します。

        Args:
            confirmation: 確認用パスワード文字列

        Returns:
            bool: 一致する場合はTrue、それ以外はFalse
        """
        return self.value == confirmation
