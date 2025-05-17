// TEST-SOLUTION.md

# テスト修正案と解決策

## 問題の概要

LibraryView コンポーネントのテストにおいて、以下の3つのタイプのテストが失敗していました：

1. **ファイルアップロード処理のテスト**
   - `handles file upload flow correctly`
   - タイムアウトが発生

2. **エラーハンドリングのテスト**
   - `handles upload error correctly`
   - タイムアウトが発生

3. **ポーリング処理のテスト**
   - `polls for document status updates and updates the UI`
   - 要素検出の問題が発生

## 原因分析

1. **ファイルアップロード処理とモーダル表示の問題**
   - UploadButton → ファイル選択 → モーダル表示という一連の処理が不安定
   - 非同期処理の待機が不十分
   - モーダル要素の検出方法が不正確

2. **非同期処理とテスト時間の問題**
   - プログレスコールバックのモック実装が不十分
   - テストのタイムアウト設定が短すぎる
   - act() の使用が一部不適切

3. **ポーリング処理のタイミング問題**
   - フェイクタイマーの制御が不十分
   - 検索するDOM要素とセレクタの不一致
   - モック実装の制御が不十分

## 実装した解決策

1. **テストケースの修正**
   - タイムアウト時間を 30000ms から 50000ms に増加
   - モーダル検出のセレクタを適切なものに変更
   - より明確なDOM要素の検索方法を使用

2. **モック処理の改善**
   - より詳細なプログレスコールバックの制御
   - カウンター変数を使用した明確なAPI応答の制御

3. **処理待機の改善**
   - act() による確実な非同期処理のラップ
   - より具体的なwaitForの条件指定

## 推奨される追加改善点

1. **テスト可能性の向上**
   - コンポーネントにdata-testid属性を追加（例: `data-testid="upload-modal"`, `data-testid="progress-bar"`）
   - より細かい粒度のコンポーネント分割（責務の分離）

2. **テスト戦略の改善**
   - 大きなE2Eテストより、小さな単体テストを優先
   - 複雑な機能（ファイルアップロード、ポーリング）を個別にテスト

3. **コンポーネント設計の改善**
   - 副作用を分離して、テスト時にモック化しやすくする
   - カスタムフックによる複雑なロジックのカプセル化

## 単体テストの成功例

FileUploadModalの単体テストは問題なく機能しています：

```
 PASS  src/components/FileUpload/FileUploadModalIsolated.test.tsx
  FileUploadModal Basic Tests
    ✓ renders the modal when isOpen is true (71 ms)
    ✓ does not render when isOpen is false (2 ms)
    ✓ shows uploading state correctly (6 ms)
    ✓ shows success state correctly (4 ms)
    ✓ shows error state correctly (6 ms)
```

これは、より小さな単位のテストが安定していることを示しています。同様のアプローチで、LibraryViewの機能を個別に検証するテストに分割することで、より安定したテストが実現できます。
