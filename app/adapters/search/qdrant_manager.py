"""
Qdrant ベクトルデータベース接続と管理を行うモジュール

このモジュールは、Qdrant ベクトルデータベースへの接続、
コレクションの作成・管理、および基本的なデータベース操作を提供します。
"""

import logging
from django.conf import settings
from qdrant_client import QdrantClient, models
from qdrant_client.http.models import Distance, VectorParams

logger = logging.getLogger(__name__)


def get_qdrant_client() -> QdrantClient:
    """
    Qdrant クライアントのインスタンスを取得します。

    環境変数またはDjango設定から接続情報を読み込み、Qdrantに接続するためのクライアントを返します。

    Returns:
        QdrantClient: 設定済みのQdrantクライアントインスタンス
    """
    # 将来的にAPIキーやHTTPS対応が必要な場合はここで設定
    return QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)


def ensure_collections_exist():
    """
    必要なQdrantコレクションが存在することを確認し、なければ作成します。

    Django設定ファイルで指定されたコレクション名で、ベクトルコレクションを初期化します。
    このメソッドは冪等であり、既存のコレクションは変更しません。
    """
    client = get_qdrant_client()

    # ベクトルの次元数 - 設定ファイルから取得
    vector_size = settings.QDRANT_VECTOR_SIZE

    # 確認・作成するコレクション名のリスト
    collections_to_ensure = [
        settings.QDRANT_COLLECTION_DOCUMENTS,
        settings.QDRANT_COLLECTION_QA,
    ]

    # 既存のコレクション名を取得
    existing_collections = {
        c.name for c in client.get_collections().collections}
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
            except Exception as e:
                logger.error(
                    f"コレクション {collection_name} の作成に失敗: {e}", exc_info=True)
                # アプリケーション起動時に致命的なエラーとして扱う場合は例外を再送出
                raise
        else:
            logger.debug(f"コレクション {collection_name} は既に存在します。")
