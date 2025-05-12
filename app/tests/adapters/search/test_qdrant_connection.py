"""Qdrantコンテナへの接続をテストするモジュール。

このモジュールはQdrantへの接続が正常に行えるかを検証し、
接続に失敗する場合の原因を特定するためのテストを提供します。
"""

import logging
from unittest import mock

import pytest
from django.conf import settings
from qdrant_client import QdrantClient
from qdrant_client.models import CollectionsResponse, CollectionDescription

from app.adapters.search.qdrant_manager import get_qdrant_client, QdrantClientManager

# テスト用のロガーを設定して、詳細な情報を確認できるようにする
logger = logging.getLogger(__name__)


@pytest.mark.django_db
class TestQdrantDirectConnection:
    """Qdrantへの直接的な接続と設定値の確認テスト。"""

    def test_print_qdrant_settings(self):
        """Django設定ファイルから読み込まれるQdrant関連の設定値を確認・出力するテスト。

        QDRANT_HOST, QDRANT_PORT, QDRANT_TIMEOUT の実際の値を確認します。
        """
        qdrant_host = getattr(settings, 'QDRANT_HOST', '未設定')
        qdrant_port = getattr(settings, 'QDRANT_PORT', '未設定')
        qdrant_timeout = getattr(settings, 'QDRANT_TIMEOUT', '未設定 (デフォルト10.0秒のはず)')

        logger.info("--- Qdrant 設定値 ---")
        logger.info(f"QDRANT_HOST: {qdrant_host}")
        logger.info(f"QDRANT_PORT: {qdrant_port}")
        logger.info(f"QDRANT_TIMEOUT: {qdrant_timeout}")
        print("\n--- Qdrant 設定値 (stdout) ---")
        print(f"QDRANT_HOST: {qdrant_host}")
        print(f"QDRANT_PORT: {qdrant_port}")
        print(f"QDRANT_TIMEOUT: {qdrant_timeout}\n")

        assert qdrant_host != '未設定', "settings.QDRANT_HOST が設定されていません。"
        assert qdrant_port != '未設定', "settings.QDRANT_PORT が設定されていません。"
        # QDRANT_TIMEOUT は qdrant_manager 側でデフォルト値を持つため、ここでは存在確認は必須ではない

    def test_mock_qdrant_client(self):
        """パッチを使用してQdrantClientをモック化し、基本的な操作をテスト。

        基本的な操作（コレクション取得）がテストできることを確認します。
        """
        # クラス全体をモック
        mock_client_cls = mock.Mock()
        # モックインスタンスを作成
        mock_instance = mock.Mock()
        mock_client_cls.return_value = mock_instance
        # モックのget_collections結果を設定
        mock_collections = CollectionsResponse(
            collections=[
                CollectionDescription(name="documents"),
                CollectionDescription(name="qa_pairs")
            ]
        )
        mock_instance.get_collections.return_value = mock_collections

        # モックを使用してテスト
        with mock.patch('app.tests.adapters.search.test_qdrant_connection.QdrantClient', mock_client_cls):
            # QdrantClientのモック化がうまくいっていることを確認
            client = QdrantClient(
                host='mockhost',
                grpc_port=1234,  # portからgrpc_portに変更
                prefer_grpc=True,  # prefer_grpcを追加
                timeout=5.0
            )

            # モックが呼び出されたことを確認
            mock_client_cls.assert_called_once_with(
                host='mockhost',
                grpc_port=1234,  # portからgrpc_portに変更
                prefer_grpc=True,  # prefer_grpcを追加
                timeout=5.0
            )

            # モックメソッドを呼び出し
            collections = client.get_collections()

            # 期待通りの結果が返されることを確認
            assert collections == mock_collections
            assert len(collections.collections) == 2
            assert collections.collections[0].name == "documents"
            assert collections.collections[1].name == "qa_pairs"

            # メソッドが呼ばれたことを確認
            mock_instance.get_collections.assert_called_once()

    @mock.patch('app.adapters.search.qdrant_manager.QdrantClient')
    def test_get_qdrant_client_from_manager(self, mock_client_cls):
        """QdrantClientManager.get_client()を通じてクライアント取得と接続テストを検証。

        QdrantClientManager.get_client() を通じてクライアントを取得し、
        接続テストが行われるか、エラーが発生する場合はその内容を確認するテスト。
        モックを使用してQdrantへの実際の接続を回避します。
        """
        logger.info("--- test_get_qdrant_client_from_manager 開始 ---")

        # QdrantClientManagerのシングルトンインスタンスをリセット
        # テスト用にインスタンスをリセットするため、保護メンバーアクセスを許容
        # pylint: disable=protected-access
        QdrantClientManager._instance = None
        # pylint: enable=protected-access
        logger.debug("QdrantClientManager._instance を None にリセットしました。")
        print("QdrantClientManager._instance を None にリセットしました。")

        # モックの振る舞いを設定
        mock_instance = mock_client_cls.return_value
        mock_collections = CollectionsResponse(
            collections=[
                CollectionDescription(name="documents"),
                CollectionDescription(name="qa_pairs")
            ]
        )
        mock_instance.get_collections.return_value = mock_collections

        try:
            # get_qdrant_client() 経由でクライアントを取得
            client = get_qdrant_client()
            logger.info(f"QdrantClientManager経由でクライアント取得成功: {client}")
            print(f"QdrantClientManager経由でクライアント取得成功: {client}")

            # コレクションの取得をテスト
            collections_list = client.get_collections()
            logger.info(f"マネージャー経由クライアントでのコレクション取得成功: {[c.name for c in collections_list.collections]}")
            print(f"マネージャー経由クライアントでのコレクション取得成功: {[c.name for c in collections_list.collections]}")

            # 正しいパラメータでインスタンス化されたことを検証
            mock_client_cls.assert_called_once_with(
                host=settings.QDRANT_HOST,
                grpc_port=settings.QDRANT_PORT,
                prefer_grpc=True,
                timeout=settings.QDRANT_TIMEOUT
            )

            # get_collectionsが呼ばれたことを検証
            assert mock_instance.get_collections.call_count >= 1

            # 取得したコレクション数を検証
            assert len(collections_list.collections) == 2
            assert collections_list.collections[0].name == "documents"
            assert collections_list.collections[1].name == "qa_pairs"

        except ConnectionError as e:
            logger.error(f"QdrantClientManager経由での接続中にConnectionErrorが発生: {str(e)}", exc_info=True)
            print(f"QdrantClientManager経由での接続中にConnectionErrorが発生: {str(e)}")
            pytest.fail(f"QdrantClientManager.get_client() で ConnectionError が発生しました: {e}")
        except Exception as e:
            logger.error(f"QdrantClientManager経由での接続中に予期せぬエラーが発生: {type(e).__name__} - {str(e)}", exc_info=True)
            print(f"QdrantClientManager経由での接続中に予期せぬエラーが発生: {type(e).__name__} - {str(e)}")
            pytest.fail(f"QdrantClientManager.get_client() で予期せぬエラーが発生しました: {e}")

    # スキップマークを削除し、実際のサーバーへの接続テストを有効化
    def test_real_qdrant_connection(self):
        """実際のQdrantサーバーへの接続をテストする統合テスト。

        このテストは実際のQdrantサーバーが稼働している環境で実行されます。
        Qdrantサーバーへの接続を確立し、基本的な操作（コレクションの取得）を行います。
        """
        qdrant_host = settings.QDRANT_HOST
        qdrant_port = settings.QDRANT_PORT
        qdrant_timeout = getattr(settings, 'QDRANT_TIMEOUT', 10.0)

        logger.info(f"実際の接続試行先: host={qdrant_host}, grpc_port={qdrant_port}, timeout={qdrant_timeout}")
        print(f"実際の接続試行先: host={qdrant_host}, grpc_port={qdrant_port}, timeout={qdrant_timeout}")

        client = None
        try:
            # QdrantClientManagerと同じパラメータを使用して接続
            client = QdrantClient(
                host=qdrant_host,
                grpc_port=qdrant_port,  # portからgrpc_portに変更
                prefer_grpc=True,       # gRPC接続を優先
                timeout=qdrant_timeout
            )
            collections_list = client.get_collections()
            collection_names = [c.name for c in collections_list.collections]
            logger.info(f"実際の接続成功。取得されたコレクション: {collection_names}")
            print(f"実際の接続成功。取得されたコレクション: {collection_names}")

            # コレクションが取得できたことを確認（少なくとも空のリストが返される）
            assert isinstance(collection_names, list)

            # 期待されるコレクションが存在するか確認（存在しなくてもテスト失敗にはしない）
            expected_collections = [settings.QDRANT_COLLECTION_DOCUMENTS, settings.QDRANT_COLLECTION_QA]
            for expected in expected_collections:
                if expected in collection_names:
                    logger.info(f"期待されるコレクション '{expected}' が存在します")
                    print(f"期待されるコレクション '{expected}' が存在します")
                else:
                    logger.warning(f"期待されるコレクション '{expected}' が見つかりません")
                    print(f"警告: 期待されるコレクション '{expected}' が見つかりません")
        except Exception as e:
            logger.error(f"実際の接続中にエラーが発生: {type(e).__name__} - {str(e)}", exc_info=True)
            print(f"実際の接続中にエラーが発生: {type(e).__name__} - {str(e)}")
            pytest.fail(f"実際のQdrantサーバーへの接続テストに失敗しました: {e}")
        finally:
            if client:
                client.close()
                logger.info("実際の接続クライアントをクローズしました。")
                print("実際の接続クライアントをクローズしました。")

    def test_ensure_collections_exist(self):
        """必要なコレクションが存在することを確認するテスト。

        QdrantClientManagerを使用して、期待されるコレクションが存在するかを確認します。
        存在しない場合は作成されることを検証します。
        """
        from app.adapters.search.qdrant_manager import ensure_collections_exist

        # QdrantClientManagerのインスタンスをリセット
        # pylint: disable=protected-access
        QdrantClientManager._instance = None
        # pylint: enable=protected-access

        try:
            # コレクションの存在を確認・作成する関数を呼び出し
            ensure_collections_exist()

            # クライアントを取得してコレクションを確認
            client = get_qdrant_client()
            collections_list = client.get_collections()
            collection_names = [c.name for c in collections_list.collections]

            # 期待されるコレクションが存在するか確認
            expected_collections = [settings.QDRANT_COLLECTION_DOCUMENTS, settings.QDRANT_COLLECTION_QA]
            for expected in expected_collections:
                assert expected in collection_names, f"コレクション '{expected}' が作成されていません"
                logger.info(f"コレクション '{expected}' の存在を確認しました")
                print(f"コレクション '{expected}' の存在を確認しました")

            logger.info("すべての必要なコレクションが存在することを確認しました")
            print("すべての必要なコレクションが存在することを確認しました")

        except Exception as e:
            logger.error(f"コレクション確認中にエラーが発生: {type(e).__name__} - {str(e)}", exc_info=True)
            print(f"コレクション確認中にエラーが発生: {type(e).__name__} - {str(e)}")
            pytest.fail(f"コレクション確認テストに失敗しました: {e}")
