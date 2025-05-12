"""UserSettingsRepositoryの実装

PostgreSQLを使用したユーザー設定リポジトリの実装クラス
"""
from django.contrib.auth import get_user_model
from django.db import transaction, IntegrityError

from app.core.repositories import UserSettingsRepository
from app.models.user_settings import UserSettings


User = get_user_model()


class PostgresUserSettingsRepository(UserSettingsRepository):
    """PostgreSQLデータベースを使用したUserSettingsリポジトリの実装

    Djangoのモデルマネージャーとget_or_createメソッドを使用して
    UserSettingsRepositoryインターフェースを実装します
    """

    def get_or_create_for_user(self, user_id: int) -> UserSettings:
        """指定されたユーザーIDに対応するUserSettingsを取得します。

        存在しない場合はデフォルト値で新規作成します。

        Args:
            user_id: 対象ユーザーのID

        Returns:
            ユーザー設定オブジェクト

        Raises:
            ValueError: 指定されたユーザーIDが存在しない場合
        """
        try:
            # 設定を取得、なければ作成
            # Django ORMのget_or_createメソッドは (object, created) のタプルを返す
            settings, _ = UserSettings.objects.get_or_create(user_id=user_id)
            return settings
        except (IntegrityError, User.DoesNotExist) as e:
            raise ValueError(f"指定されたユーザーID {user_id} は存在しないか、不正です") from e

    @transaction.atomic
    def save(self, settings: UserSettings) -> UserSettings:
        """UserSettingsオブジェクトを保存または更新します。

        Args:
            settings: 保存するユーザー設定オブジェクト

        Returns:
            保存されたユーザー設定オブジェクト
        """
        # バリデーションチェックを実行
        settings.full_clean()
        # DBに保存
        settings.save()
        return settings
