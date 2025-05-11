"""
検索アプリケーション機能のテスト。

検索アプリケーションの初期化や設定に関するテストを含みます。
"""

from unittest import TestCase
from unittest.mock import patch

from app.adapters.search.apps import SearchConfig


class TestSearchConfig(TestCase):
    """
    SearchConfigクラスのテスト。

    検索アプリケーションの設定と初期化をテストします。
    """

    def test_ready(self):
        """アプリケーションのready()メソッドが正しく機能することを確認します。"""
        config = SearchConfig.create('app.adapters.search')
        with patch('app.adapters.search.qdrant_manager.ensure_collections_exist') as mock_ready:
            config.ready()
            # SearchConfigのready()メソッドでensure_collections_existが呼ばれることを確認
            mock_ready.assert_called_once()
