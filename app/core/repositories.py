"""
リポジトリインターフェース定義

クリーンアーキテクチャのUseCase層でのリポジトリインターフェースを定義します。
"""
from abc import ABC, abstractmethod
from typing import Optional

from app.models.user import CustomUser
from app.models.user_settings import UserSettings


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


class UserSettingsRepository(ABC):
    """
    ユーザー設定リポジトリインターフェース

    UserSettingsエンティティをデータストアに永続化するためのインターフェースを定義します。
    """

    @abstractmethod
    def get_or_create_for_user(self, user_id: int) -> UserSettings:
        """
        指定されたユーザーIDに対応するUserSettingsを取得します。
        存在しない場合はデフォルト値で新規作成します。

        Args:
            user_id: 対象ユーザーのID

        Returns:
            ユーザー設定オブジェクト
        """
        pass

    @abstractmethod
    def save(self, settings: UserSettings) -> UserSettings:
        """
        UserSettingsオブジェクトを保存または更新します。

        Args:
            settings: 保存するユーザー設定オブジェクト

        Returns:
            保存されたユーザー設定オブジェクト
        """
        pass
