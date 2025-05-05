"""
暗号化データを扱うためのカスタムDBフィールド定義モジュール
"""
from django.db import models


class EncryptedField(models.BinaryField):
    """
    暗号化されたデータを保存するためのカスタムBinaryField

    このフィールドは暗号化されたデータをバイト列としてデータベースに保存します。
    実際の暗号化/復号処理はUseCase層で行い、このフィールドは
    暗号化されたデータの保存に特化しています。
    """

    description = "暗号化されたデータを保存するためのフィールド"

    def __init__(self, *args, **kwargs):
        """
        初期化

        - デフォルトでeditable=Falseに設定（管理画面での編集を防止）
        - デフォルトでnull=Trueに設定（空の値を許可）
        """
        kwargs.setdefault('editable', False)
        kwargs.setdefault('null', True)
        kwargs.setdefault('blank', True)
        super().__init__(*args, **kwargs)

    def deconstruct(self):
        """
        マイグレーション用のフィールド分解メソッド
        """
        name, path, args, kwargs = super().deconstruct()
        # スーパークラスと同じデフォルト値は引数から除外
        if kwargs.get('editable') is False:
            del kwargs['editable']
        if kwargs.get('null') is True:
            del kwargs['null']
        if kwargs.get('blank') is True:
            del kwargs['blank']
        return name, path, args, kwargs
