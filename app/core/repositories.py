"""
リポジトリインターフェース定義

クリーンアーキテクチャのUseCase層でのリポジトリインターフェースを定義します。
"""
from abc import ABC, abstractmethod
from typing import Optional

from app.models.user import CustomUser


class UserRepository(ABC):
    """
    ユーザーリポジトリインターフェース

    UserAccountドメインエンティティをデータストアに永続化するためのインターフェースを定義します。
    """

    @abstractmethod
    def save(self, user: CustomUser) -> CustomUser:
        """
        ユーザーを保存または更新します。

        Args:
            user: 保存するユーザーオブジェクト

        Returns:
            保存されたユーザーオブジェクト
        """
        pass

    @abstractmethod
    def find_by_id(self, user_id: int) -> Optional[CustomUser]:
        """
        IDによりユーザーを検索します。

        Args:
            user_id: 検索するユーザーのID

        Returns:
            ユーザーオブジェクト、存在しない場合はNone
        """
        pass

    @abstractmethod
    def find_by_email(self, email: str) -> Optional[CustomUser]:
        """
        メールアドレスによりユーザーを検索します。
        大文字・小文字は区別しません。

        Args:
            email: 検索するユーザーのメールアドレス

        Returns:
            ユーザーオブジェクト、存在しない場合はNone
        """
        pass
