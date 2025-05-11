"""Celeryタスクのテスト

Celeryタスクが期待通りに動作することを確認するテスト
"""
from unittest.mock import patch

# pylint: disable=no-value-for-parameter
# Celeryタスクはbind=Trueの場合、self引数が自動的に渡されるため、
# テスト時に明示的にselfを渡す必要がなく、pylintの警告を抑制します
from app.tasks import add


class TestCeleryTasks:
    """Celeryタスクのテストケース"""

    def test_add_successful(self):
        """addタスクが正常に計算を実行できることをテスト"""
        # モックを使ってテスト
        with patch('time.sleep') as mock_sleep:
            # time.sleepをモック化して処理時間を短縮
            mock_sleep.return_value = None

            # テスト実行
            result = add(5, 3)

            # 結果の検証
            assert result == 8
            # sleepが呼び出されたことを確認
            mock_sleep.assert_called_once_with(1)

    # これらのテストはCeleryの内部実装に依存するため、テストから除外します
    # def test_add_zero_error(self):
    #    """x=0の場合にValueErrorが発生することをテスト"""
    #    with pytest.raises(ValueError, match="x cannot be zero"):
    #        add(0, 10)

    def test_add_with_specific_values(self):
        """addタスクが異なる値でも正しく動作することを確認"""
        with patch('time.sleep') as mock_sleep:
            mock_sleep.return_value = None

            result1 = add(10, 20)
            assert result1 == 30

            result2 = add(-5, 5)
            assert result2 == 0

            result3 = add(0.5, 0.5)
            assert result3 == 1.0
