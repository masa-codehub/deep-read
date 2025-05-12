# Node.jsの公式イメージをベースにする (バージョンは適宜選択)
FROM node:slim

# 作業ディレクトリを設定
WORKDIR /app

# # package.json と package-lock.json (あれば) をコピー
# # (最初はなくても、後で `docker compose run` で生成すればOK)
# COPY package*.json ./

# # 依存関係をインストール (package-lock.jsonがあればci、なければinstall)
# # ここは後述の npm コマンド実行方法によって調整可能
# # 例1: package-lock.json がある前提なら (推奨)
# # RUN npm ci
# # 例2: package.json だけの場合
# RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# React開発サーバーが使うポートを開放 (例: Create React App や Vite のデフォルト)
EXPOSE 3000

# 開発サーバーを起動するコマンド (例)
# CMD ["npm", "start"]