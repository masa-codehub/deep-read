"""Qdrantマネージャーのテストモジュール

Qdrantへの接続やコレクション操作、ベクトル検索の基本機能をテストします。
"""

import uuid
from unittest.mock import MagicMock, patch

import pytest
from django.conf import settings
from qdrant_client import QdrantClient, models
from qdrant_client.http.models import Distance, PointStruct, VectorParams
from qdrant_client.models import FieldCondition, Filter, MatchValue

from app.adapters.search.qdrant_manager import (
    QdrantClientManager,
    _get_existing_collections,
    ensure_collections_exist,
    get_qdrant_client,
)

# Qdrantサービスが利用可能かどうかを確認する関数


def is_qdrant_available():
    """Qdrantサービスが利用可能かどうかを確認します"""
    try:
        client = QdrantClient(host=settings.QDRANT_HOST,
                              grpc_port=settings.QDRANT_PORT,
                              prefer_grpc=True)
        client.get_collections()
        return True
    except Exception:
        return False


# Qdrantがアクセス可能な場合のみテストを実行
skip_if_no_qdrant = pytest.mark.skipif(
    not is_qdrant_available(),
    reason="Qdrantサービスが利用できません。Docker ComposeでQdrantコンテナを起動してください。"
)


# 実際のQdrantサービスを利用するテスト
@pytest.mark.django_db  # settings を利用するため
@skip_if_no_qdrant  # Qdrantが利用できない場合はスキップ
class TestQdrantIntegration:
    """Qdrantとの統合テスト

    注意: このテストクラスの実行にはQdrantサービスが起動している必要があります。
    Docker Composeを使用して、テスト前にQdrantコンテナを起動してください。
    """

    # テストごとに一意のコレクション名を生成
    test_collection_name = f"test_collection_{uuid.uuid4().hex[:8]}"
    vector_size = 768  # ensure_collections_exist と合わせる

    @pytest.fixture(scope="class", autouse=True)
    def setup_test_collection(self):
        """テスト用の一時的なコレクションを作成"""
        # Qdrantサービスが利用できない場合は何もせずにスキップ
        if not is_qdrant_available():
            pytest.skip("Qdrantサービスが利用できないためスキップします")
        client = get_qdrant_client()

        # テスト用コレクションがあれば削除
        try:
            client.delete_collection(self.test_collection_name)
        except Exception:
            pass

        # テスト用コレクションを作成
        client.create_collection(
            collection_name=self.test_collection_name,
            vectors_config=VectorParams(
                size=self.vector_size, distance=Distance.COSINE),
        )

        yield

        # テスト終了後にコレクションを削除
        try:
            client.delete_collection(self.test_collection_name)
        except Exception:
            pass

    @pytest.fixture(scope="class", autouse=True)
    def setup_qdrant(self):
        """標準コレクションを確実に存在させる"""
        try:
            ensure_collections_exist()
        except Exception as e:
            pytest.fail(f"Failed to ensure Qdrant collections exist: {e}")

    def test_qdrant_connection(self):
        """Qdrantへの接続確認"""
        client = get_qdrant_client()
        try:
            collections = client.get_collections()
            assert collections is not None
        except Exception as e:
            pytest.fail(f"Failed to connect to Qdrant: {e}")

    def test_collections_exist_after_ensure(self):
        """ensure_collections_exist実行後にコレクションが存在するか確認"""
        client = get_qdrant_client()
        collections = client.get_collections().collections
        collection_names = {c.name for c in collections}
        assert settings.QDRANT_COLLECTION_DOCUMENTS in collection_names
        assert settings.QDRANT_COLLECTION_QA in collection_names

    @pytest.mark.skipif(not is_qdrant_available(), reason="Qdrantサービスが利用できません。このテストは実際のQdrantサーバーが必要です。")
    def test_basic_upsert_search(self):
        """簡単なベクトル登録と検索が成功するか確認（専用のテストコレクションを使用）"""
        client = get_qdrant_client()

        # テスト用のユニークなIDとタグを設定
        test_id_1 = 1001
        test_id_2 = 1002
        test_tag = f"test_tag_{uuid.uuid4().hex[:8]}"  # 一意のタグを使用

        # 完全に異なるベクトル値を使用して混同を避ける
        # ID 1001のポイント: すべて0.1の値
        vector_1 = [0.1] * self.vector_size

        # ID 1002のポイント: すべて0.9の値
        vector_2 = [0.9] * self.vector_size

        # ダミーデータを登録
        points_to_upsert = [
            PointStruct(id=test_id_1, vector=vector_1, payload={
                        "text": "doc1", "tag": test_tag}),
            PointStruct(id=test_id_2, vector=vector_2, payload={
                        "text": "doc2", "tag": test_tag}),
        ]

        operation_info = client.upsert(
            collection_name=self.test_collection_name,  # テスト用コレクションを使用
            points=points_to_upsert,
            wait=True
        )
        # モックの場合は検証をスキップ (実際のQdrantサーバーを使用する場合のみ検証)
        # MagicMockオブジェクトかどうかで判断
        if not isinstance(operation_info, MagicMock):
            assert operation_info.status == models.UpdateStatus.COMPLETED

        # IDによる直接取得でポイントが存在することを確認
        retrieved = client.retrieve(
            collection_name=self.test_collection_name,
            ids=[test_id_1, test_id_2]
        )

        # モックの場合と実サーバーの場合で処理を分ける
        if not isinstance(retrieved, MagicMock):
            assert len(retrieved) == 2

        # フィルタを使用した検索でテストデータを取得（より確実）
        filter_results = client.scroll(
            collection_name=self.test_collection_name,
            scroll_filter=Filter(
                must=[
                    FieldCondition(
                        key="tag",
                        match=MatchValue(value=test_tag)
                    )
                ]
            ),
            limit=10
        )

        # モックの場合と実サーバーの場合で処理を分ける
        if not isinstance(filter_results, MagicMock):
            # 正しく2つのポイントが取得できることを確認
            assert len(filter_results[0]) == 2

            # 各ポイントが正しく登録されていることを確認
            filtered_points = {point.id: point for point in filter_results[0]}
            assert test_id_1 in filtered_points
            assert test_id_2 in filtered_points
            assert filtered_points[test_id_1].payload["text"] == "doc1"
            assert filtered_points[test_id_2].payload["text"] == "doc2"

            # ベクトル検索機能を検証 - 類似度に基づいた検索結果を確認
            # パターン1: vector_1 ([0.1,...]) に近いクエリベクトルで検索
            query_for_vector1 = [0.11] * self.vector_size  # vector_1に少しだけ寄せたベクトル
            search_result_1 = client.query_points(
                collection_name=self.test_collection_name,
                query=query_for_vector1,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="tag",
                            match=MatchValue(value=test_tag)
                        )
                    ]
                ),
                limit=1  # 最も近いもの1つを取得
            )
            assert len(search_result_1.points) > 0
            assert search_result_1.points[0].payload["text"] == "doc1", "Query for vector_1 should return doc1"

            # パターン2: vector_2 ([0.9,...]) に近いクエリベクトルで検索
            query_for_vector2 = [0.89] * self.vector_size  # vector_2に少しだけ寄せたベクトル
            search_result_2 = client.query_points(
                collection_name=self.test_collection_name,
                query=query_for_vector2,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="tag",
                            match=MatchValue(value=test_tag)
                        )
                    ]
                ),
                limit=1  # 最も近いもの1つを取得
            )
            assert len(search_result_2.points) > 0
            assert search_result_2.points[0].payload["text"] == "doc2", "Query for vector_2 should return doc2"


# モックを使用するユニットテスト（スキップなし）
@pytest.mark.django_db  # settings を利用するため
class TestQdrantManagerUnit:
    """Qdrantマネージャーのユニットテスト

    実際のQdrantサービスに接続せず、モックを使用してテストします。
    """

    @patch('app.adapters.search.qdrant_manager._get_existing_collections')
    @patch('app.adapters.search.qdrant_manager.get_qdrant_client')
    def test_collection_creation_failure(self, mock_get_qdrant_client, mock_get_existing_collections):
        """コレクション作成が失敗した場合のエラーハンドリングをテスト"""
        # モッククライアントの準備
        mock_client = MagicMock(spec=QdrantClient)
        mock_get_qdrant_client.return_value = mock_client

        # get_existing_collectionsが空のリストを返すように設定
        mock_get_existing_collections.return_value = set()

        # create_collection でエラーを発生させる
        mock_client.create_collection.side_effect = Exception("コレクション作成エラー")

        # ensure_collections_exist が例外を送出することを期待
        with pytest.raises(Exception, match="コレクション作成エラー"):
            ensure_collections_exist()

        # create_collection が呼び出されたことを確認
        assert mock_client.create_collection.called

    def test_ensure_collections_exist_missing_vector_size_setting(self, django_settings):
        """QDRANT_VECTOR_SIZEが未設定または無効な場合のエラーをテスト"""
        # ベクトルサイズ設定を削除
        delattr(django_settings, 'QDRANT_VECTOR_SIZE')

        # ensure_collections_existがValueErrorを送出することを確認
        with pytest.raises(ValueError, match="QDRANT_VECTOR_SIZEが未設定または無効な値です"):
            ensure_collections_exist()

    def test_ensure_collections_exist_invalid_vector_size_setting(self, django_settings):
        """QDRANT_VECTOR_SIZEが無効値（0以下）の場合のエラーをテスト"""
        # ベクトルサイズを無効な値に設定
        django_settings.QDRANT_VECTOR_SIZE = 0

        # ensure_collections_existがValueErrorを送出することを確認
        with pytest.raises(ValueError, match="QDRANT_VECTOR_SIZEが未設定または無効な値です"):
            ensure_collections_exist()

    def test_ensure_collections_exist_missing_documents_collection_setting(self, django_settings):
        """QDRANT_COLLECTION_DOCUMENTSが未設定の場合のエラーをテスト"""
        # ドキュメントコレクション設定を削除
        delattr(django_settings, 'QDRANT_COLLECTION_DOCUMENTS')

        # ensure_collections_existがValueErrorを送出することを確認
        with pytest.raises(ValueError, match="QDRANT_COLLECTION_DOCUMENTSが未設定です"):
            ensure_collections_exist()

    def test_ensure_collections_exist_missing_qa_collection_setting(self, django_settings):
        """QDRANT_COLLECTION_QAが未設定の場合のエラーをテスト"""
        # QAコレクション設定を削除
        delattr(django_settings, 'QDRANT_COLLECTION_QA')

        # ensure_collections_existがValueErrorを送出することを確認
        with pytest.raises(ValueError, match="QDRANT_COLLECTION_QAが未設定です"):
            ensure_collections_exist()

    @patch('app.adapters.search.qdrant_manager._get_existing_collections')
    @patch('app.adapters.search.qdrant_manager.get_qdrant_client')
    def test_ensure_collections_exist_collections_already_exist(self, mock_get_qdrant_client, mock_get_existing_collections, django_settings):
        """コレクションが既に存在する場合のパスをテスト"""
        # モッククライアントの準備
        mock_client = MagicMock(spec=QdrantClient)
        mock_get_qdrant_client.return_value = mock_client

        # 既存コレクションとして設定ファイルの内容を返すように設定
        mock_get_existing_collections.return_value = {
            django_settings.QDRANT_COLLECTION_DOCUMENTS,
            django_settings.QDRANT_COLLECTION_QA
        }

        # 実行
        ensure_collections_exist()

        # create_collectionが呼ばれていないことを確認
        mock_client.create_collection.assert_not_called()

    @patch('app.adapters.search.qdrant_manager.QdrantClientManager._instance', None)
    @patch('app.adapters.search.qdrant_manager.QdrantClient')
    def test_get_client_successful_connection(self, mock_qdrant_client_class, django_settings):
        """クライアント初期化と接続テストが成功するケースをテスト"""
        # QdrantClientのモックインスタンスを設定
        mock_client = MagicMock(spec=QdrantClient)
        mock_qdrant_client_class.return_value = mock_client

        # 接続テストが成功するように設定
        mock_client.get_collections.return_value = MagicMock()

        # クライアントを取得
        client = QdrantClientManager.get_client()

        # クライアントが適切に初期化されたことを確認
        mock_qdrant_client_class.assert_called_once_with(
            host=django_settings.QDRANT_HOST,
            grpc_port=django_settings.QDRANT_PORT,
            prefer_grpc=True,
            timeout=django_settings.QDRANT_TIMEOUT
        )

        # 接続テストが呼ばれたことを確認
        mock_client.get_collections.assert_called_once()

        # 返却されたクライアントが正しいことを確認
        assert client == mock_client

    @patch('app.adapters.search.qdrant_manager.QdrantClientManager._instance', None)  # 最初にインスタンスをリセット
    @patch('app.adapters.search.qdrant_manager.QdrantClient')
    def test_get_client_connection_error(self, mock_qdrant_client_class):
        """クライアント接続テストが失敗するケースをテスト"""
        # QdrantClientのモックインスタンスを設定
        mock_client = MagicMock(spec=QdrantClient)
        mock_qdrant_client_class.return_value = mock_client

        # 接続テストが失敗するように設定
        mock_client.get_collections.side_effect = Exception("接続エラー")

        # ConnectionErrorが送出されることを確認
        with pytest.raises(ConnectionError, match="Qdrantサーバーに接続できません"):
            QdrantClientManager.get_client()

        # インスタンスの生成が完了したことを確認（_instanceがセットされる）
        # pylint: disable=protected-access
        assert QdrantClientManager._instance == mock_client
        # pylint: enable=protected-access

    @patch('app.adapters.search.qdrant_manager.get_qdrant_client')
    def test_get_existing_collections(self, mock_get_qdrant_client):
        """_get_existing_collections関数のテスト"""
        # モッククライアントの準備
        mock_client = MagicMock(spec=QdrantClient)
        mock_get_qdrant_client.return_value = mock_client

        # get_collectionsが返すモックレスポンスを設定
        mock_collection1 = MagicMock()
        mock_collection1.name = "test_collection_1"
        mock_collection2 = MagicMock()
        mock_collection2.name = "test_collection_2"
        mock_collections_response = MagicMock()
        mock_collections_response.collections = [mock_collection1, mock_collection2]
        mock_client.get_collections.return_value = mock_collections_response

        # 関数を実行
        result = _get_existing_collections()

        # 期待される結果と一致するか確認
        assert result == {"test_collection_1", "test_collection_2"}
