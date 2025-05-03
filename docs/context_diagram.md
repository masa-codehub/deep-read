
``` mermaid
graph TD
    subgraph ExternalEntities [外部エンティティ]
        User[👤 ユーザ]
        GenerativeAI[🤖 生成AI（各種モデル/API）]
        CloudPdfAPI[☁️ PDF解析クラウドAPI（選択的利用）]
        VectorDBService[💾 ベクトルDBサービス（マネージド/セルフホスト）]
    end

    subgraph TargetSystem [対象システム]
        DeepRead(💡 DeepRead)
    end

    %% ユーザ (User) と DeepRead 間の情報の流れ
    User -- PDF書籍 (利用権限確認)<br/>書籍選択/複数文書選択指示<br/>質問 (単一/複数文書対象)<br/>抽出/要約指示<br/>応答評価フィードバック<br/>利用規約・プライバシーポリシー同意 --> DeepRead
    DeepRead -- UI表示 (ライブラリ含む)<br/>書籍データ閲覧<br/>質問への回答 (RAG, 出典リンク付)<br/>抽出/要約結果<br/>利用規約・プライバシーポリシー提示 --> User

    %% DeepRead と 生成AI (GenerativeAI) 間の情報の流れ (RAGプロセス含む)
    DeepRead -- 画像データ (画像説明依頼)<br/>検索された関連文書箇所 (コンテキスト)<br/>要約対象テキスト<br/>バッチQ&A生成指示 --> GenerativeAI
    GenerativeAI -- 画像説明<br/>生成された回答 (コンテキストに基づく)<br/>生成された要約 (コンテキストに基づく) --> DeepRead

    %% DeepRead と PDF解析クラウドAPI (CloudPdfAPI) 間の情報の流れ (ハイブリッドアプローチ)
    DeepRead -- PDFデータ または ページ画像 (OCR/高度解析依頼) --> CloudPdfAPI
    CloudPdfAPI -- 高精度解析結果 (テキスト、構造化表、レイアウト情報) --> DeepRead

    %% DeepRead と ベクトルDBサービス (VectorDBService) 間の情報の流れ (類似検索)
    DeepRead -- テキストベクトルデータ登録/更新 --> VectorDBService
    DeepRead -- 類似ベクトル検索クエリ (ユーザ質問等に基づく) --> VectorDBService
    VectorDBService -- 類似ベクトル検索結果 (関連文書箇所ID等) --> DeepRead
```
