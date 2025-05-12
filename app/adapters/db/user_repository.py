"""UserRepositoryインターフェースのPostgreSQL実装。

UserRepositoryインターフェースをDjango ORM + PostgreSQLで実装します。
"""
from typing import Optional

from app.core.repositories import UserRepository
from app.models import CustomUser


class PostgresUserRepository(UserRepository):
    """UserRepositoryインターフェースのPostgreSQL実装。

    UserRepositoryインターフェースをDjango ORMを使用して実装します。
    実際のデータベースはDjangoの設定に依存します（開発環境ではSQLiteやPostgreSQLなど）。
    """

    def save(self, user: CustomUser) -> CustomUser:
        """ユーザーを保存または更新します。

        Args:
            user: 保存するユーザーオブジェクト

        Returns:
            保存されたユーザーオブジェクト

        Raises:
            ValueError: ユーザーオブジェクトが無効な場合
        """
        # Django ORMのsaveメソッドを使用
        user.save()
        return user

    def find_by_id(self, user_id: int) -> Optional[CustomUser]:
        """IDによりユーザーを検索します。

        Args:
            user_id: 検索するユーザーのID

        Returns:
            ユーザーオブジェクト、存在しない場合はNone
        """
        try:
            return CustomUser.objects.get(pk=user_id)
        except CustomUser.DoesNotExist:
            return None

    def find_by_email(self, email: str) -> Optional[CustomUser]:
        """メールアドレスによりユーザーを検索します。

        大文字小文字を区別しません。

        Args:
            email: 検索するユーザーのメールアドレス

        Returns:
            ユーザーオブジェクト、存在しない場合はNone
        """
        try:
            # email__iexactを使用して大文字小文字を区別しない検索を行う
            return CustomUser.objects.get(email__iexact=email)
        except CustomUser.DoesNotExist:
            return None
