"""UserSettingsRepository実装のテスト。

PostgresUserSettingsRepositoryの実装をテストします。
"""
import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from app.adapters.db.user_settings_repository import PostgresUserSettingsRepository
from app.models.user_settings import UserSettings

User = get_user_model()


@pytest.mark.django_db
class TestUserSettingsRepository:
    """UserSettingsRepositoryインターフェースの実装テスト。"""

    user = None
    repository = None

    def setup_method(self):
        """各テストメソッドの実行前に実行されます。"""
        # テストユーザーを作成
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

        # リポジトリインスタンス
        self.repository = PostgresUserSettingsRepository()

    def test_get_or_create_for_new_user(self):
        """新規ユーザーに対して、デフォルト値で設定が作成されることをテストします。"""
        # テストユーザーに対するUserSettingsを取得（新規作成されるはず）
        settings = self.repository.get_or_create_for_user(self.user.id)

        # UserSettingsオブジェクトが返されることを確認
        assert isinstance(settings, UserSettings)
        assert settings.user_id == self.user.id

        # デフォルト値が設定されていることを確認
        assert settings.max_file_size_mb == 100
        assert settings.batch_frequency == 'daily'
        assert settings.email_notifications is True

        # DB上に保存されていることを確認
        assert UserSettings.objects.filter(user_id=self.user.id).exists()

    def test_get_or_create_for_existing_user(self):
        """既存の設定を持つユーザーに対して、既存の設定が返されることをテストします。"""
        # あらかじめUserSettingsオブジェクトを作成し、一部のフィールドに非デフォルト値を設定
        initial_settings = UserSettings.objects.create(
            user=self.user,
            max_file_size_mb=50,  # デフォルトとは異なる値
            batch_frequency='weekly'  # デフォルトとは異なる値
        )

        # リポジトリを使用して同じユーザーのSettingsを取得
        settings = self.repository.get_or_create_for_user(self.user.id)

        # 既存のオブジェクトが返されることを確認（IDで比較）
        assert settings.id == initial_settings.id

        # デフォルト値ではなく、変更した値が維持されていることを確認
        assert settings.max_file_size_mb == 50
        assert settings.batch_frequency == 'weekly'

        # DBにオブジェクトが1つだけ存在することを確認（新規に作られていないことを確認）
        assert UserSettings.objects.filter(user_id=self.user.id).count() == 1

    def test_save_updates_settings(self):
        """saveメソッドを使用して、設定が正しく更新されることをテストします。"""
        # 設定を取得
        settings = self.repository.get_or_create_for_user(self.user.id)

        # 設定値を変更
        settings.max_file_size_mb = 200
        settings.batch_frequency = 'monthly'
        settings.email_notifications = False

        # 保存
        updated_settings = self.repository.save(settings)

        # 保存後の値が反映されていることを確認
        assert updated_settings.max_file_size_mb == 200
        assert updated_settings.batch_frequency == 'monthly'
        assert updated_settings.email_notifications is False

        # DBから再取得して確認
        db_settings = UserSettings.objects.get(user_id=self.user.id)
        assert db_settings.max_file_size_mb == 200
        assert db_settings.batch_frequency == 'monthly'
        assert db_settings.email_notifications is False

    def test_get_or_create_for_nonexistent_user(self):
        """存在しないユーザーIDに対してValueErrorが発生することをテストします。"""
        non_existent_user_id = self.user.id + 999  # 存在しないIDを生成

        # モンキーパッチを使用してget_or_createメソッドが呼ばれた時にIntegrityErrorを発生させる
        original_get_or_create = UserSettings.objects.get_or_create

        def mock_get_or_create(user_id=None, **kwargs):
            if user_id == non_existent_user_id:
                raise IntegrityError("模擬的なIntegrityError: 外部キー制約違反")
            return original_get_or_create(user_id=user_id, **kwargs)

        # モックを適用
        UserSettings.objects.get_or_create = mock_get_or_create

        try:
            # テスト実行
            with pytest.raises(ValueError) as excinfo:
                self.repository.get_or_create_for_user(non_existent_user_id)

            # エラーメッセージの内容を確認
            assert f"指定されたユーザーID {non_existent_user_id}" in str(excinfo.value)
        finally:
            # 元の実装に戻す
            UserSettings.objects.get_or_create = original_get_or_create
