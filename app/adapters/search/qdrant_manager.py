"""Qdrant ベクトルデータベース接続と管理を行うモジュール。

このモジュールは、Qdrant ベクトルデータベースへの接続、
コレクションの作成・管理、および基本的なデータベース操作を提供します。
"""

import logging
from typing import Optional, Set

from django.conf import settings
from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.http.models import Distance, VectorParams

logger = logging.getLogger(__name__)


class QdrantClientManager:
    """Qdrantクライアントマネージャクラス。

    シングルトンパターンでQdrantクライアントインスタンスを管理します。
    """

    # クラス変数として単一のインスタンスを保持
    _instance: Optional[QdrantClient] = None

    @classmethod
    def get_client(cls) -> QdrantClient:
        """Qdrant クライアントのインスタンスを取得します。

        環境変数またはDjango設定から接続情報を読み込み、Qdrantに接続するためのクライアントを返します。
        クライアントインスタンスはキャッシュされ、複数回の呼び出しでも同じインスタンスを返します。

        Returns:
            QdrantClient: 設定済みのQdrantクライアントインスタンス

        Raises:
            ConnectionError: Qdrantサーバーに接続できない場合
        """
        if cls._instance is None:
            try:
                # 将来的にAPIキーやHTTPS対応が必要な場合はここで設定
                cls._instance = QdrantClient(
                    host=settings.QDRANT_HOST,
                    # port=settings.QDRANT_PORT,  # この行をコメントアウトまたは削除
                    grpc_port=settings.QDRANT_PORT,  # settings.QDRANT_PORT (6334) を grpc_port に指定
                    prefer_grpc=True,              # gRPC接続を優先するフラグを立てる
                    timeout=settings.QDRANT_TIMEOUT
                )

                # 接続テスト
                cls._instance.get_collections()
                logger.debug(f"Qdrantサーバーに接続しました: {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
            except Exception as e:
                logger.error(f"Qdrantサーバーへの接続に失敗しました: {e}", exc_info=True)
                raise ConnectionError(f"Qdrantサーバーに接続できません: {str(e)}") from e

        return cls._instance


def get_qdrant_client() -> QdrantClient:
    """Qdrant クライアントのインスタンスを取得します。

    クライアントマネージャを通じてシングルトンインスタンスを返します。

    Returns:
        QdrantClient: 設定済みのQdrantクライアントインスタンス
    """
    return QdrantClientManager.get_client()


def _get_existing_collections() -> Set[str]:
    """既存のQdrantコレクション名のセットを取得します。

    Returns:
        Set[str]: 既存のコレクション名のセット
    """
    client = get_qdrant_client()
    return {c.name for c in client.get_collections().collections}


def ensure_collections_exist() -> None:
    """必要なQdrantコレクションが存在することを確認し、なければ作成します。

    Django設定ファイルで指定されたコレクション名で、ベクトルコレクションを初期化します。
    このメソッドは冪等であり、既存のコレクションは変更しません。

    Raises:
        ValueError: 設定が不完全または無効な場合
        ConnectionError: Qdrantサーバーに接続できない場合
    """
    # 設定の検証
    if not hasattr(settings, 'QDRANT_VECTOR_SIZE') or settings.QDRANT_VECTOR_SIZE <= 0:
        raise ValueError("QDRANT_VECTOR_SIZEが未設定または無効な値です")

    if not hasattr(settings, 'QDRANT_COLLECTION_DOCUMENTS') or not settings.QDRANT_COLLECTION_DOCUMENTS:
        raise ValueError("QDRANT_COLLECTION_DOCUMENTSが未設定です")

    if not hasattr(settings, 'QDRANT_COLLECTION_QA') or not settings.QDRANT_COLLECTION_QA:
        raise ValueError("QDRANT_COLLECTION_QAが未設定です")

    client = get_qdrant_client()

    # ベクトルの次元数 - 設定ファイルから取得
    vector_size = settings.QDRANT_VECTOR_SIZE

    # 確認・作成するコレクション名のリスト
    collections_to_ensure = [
        settings.QDRANT_COLLECTION_DOCUMENTS,
        settings.QDRANT_COLLECTION_QA,
    ]

    # 既存のコレクション名を取得
    existing_collections = _get_existing_collections()
    logger.debug(f"既存のQdrantコレクション: {existing_collections}")

    # 各コレクションの存在確認と作成
    for collection_name in collections_to_ensure:
        if collection_name not in existing_collections:
            logger.info(f"Qdrantコレクションを作成: {collection_name}")
            try:
                client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(
                        size=vector_size, distance=Distance.COSINE),
                    # 必要に応じてインデックス設定などを追加
                    # hnsw_config=models.HnswConfigDiff(m=16, ef_construct=100)
                )
                logger.info(f"コレクション作成成功: {collection_name}")
            except UnexpectedResponse as e:
                # APIエラーの詳細をログに記録
                logger.error(f"Qdrant API エラー - コレクション {collection_name} の作成に失敗: {e}", exc_info=True)
                raise
            except Exception as e:
                logger.error(f"コレクション {collection_name} の作成に失敗: {e}", exc_info=True)
                # アプリケーション起動時に致命的なエラーとして扱う場合は例外を再送出
                raise
        else:
            logger.debug(f"コレクション {collection_name} は既に存在します。")
