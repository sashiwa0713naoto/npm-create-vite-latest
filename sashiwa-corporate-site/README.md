# 株式会社SASHIWA コーポレートサイト

Vite + React + Tailwind CSS で構築したコーポレートサイトのプロジェクト一式です。

## 事前準備

[Node.js](https://nodejs.org/)（18以上を推奨）がインストールされている必要があります。

## セットアップ手順

1. このZIPを展開し、フォルダをターミナル（コマンドプロンプト）で開きます。
2. 依存パッケージをインストールします。

   ```
   npm install
   ```

3. 開発サーバーを起動します。

   ```
   npm run dev
   ```

4. ターミナルに表示されるURL（例: `http://localhost:5173`）をブラウザで開くと、サイトを確認できます。
   ファイルを編集して保存すると、ブラウザが自動的に更新されます。

## サイト内容の編集方法

`src/App.jsx` の先頭付近にある、以下のような定数を編集すると、対応する箇所の表示が変わります。

- `COMPANY_NAME` / `COMPANY_NAME_EN` : 会社名の表記
- `NAV_LINKS` : ナビゲーションメニュー
- `SERVICES_DATA` : サービス紹介（新しいサービスを配列に追加するだけで自動的にカードが増えます）
- `COMPANY_PROFILE` : 会社概要（設立日・資本金・所在地・代表者など）
- `ETHICS_AND_SECURITY` : セキュリティ・AI倫理方針
- `CONTACT_SUBJECTS` : お問い合わせフォームの件名の選択肢
- `ABOUT_IMAGE` / `HERO_BANNER_IMAGE` / 各 `SERVICES_DATA[].image` : 掲載する写真のURL

写真を差し替えたい場合は、該当する定数のURL部分を、ご自身で用意した画像のURL（Google DriveやImgur等にアップロードしたものでも可）に書き換えてください。

## 本番用ファイルの作成（ビルド）

サイトを公開用に最適化したファイル一式を作成するには、以下を実行します。

```
npm run build
```

`dist` フォルダが生成され、この中身がそのまま公開用のファイルになります。

## 無料での公開方法

### 方法A：Vercel（おすすめ）

1. [vercel.com](https://vercel.com) で無料アカウントを作成（GitHubアカウントでログイン可能）
2. このプロジェクトをGitHubリポジトリにアップロード
3. Vercelで「Add New Project」→ 対象リポジトリを選択 → そのままデプロイ
   （フレームワークとして「Vite」が自動検出されます）
4. 数分で `https://（プロジェクト名）.vercel.app` のURLが発行されます

### 方法B：Netlify

1. [netlify.com](https://netlify.com) で無料アカウントを作成
2. 「Add new site」→「Deploy manually」を選び、`npm run build` で作成した `dist` フォルダをそのままドラッグ＆ドロップ
3. 数十秒でURLが発行されます

どちらのサービスも、後から独自ドメインを接続できます。

## microCMS（CMS）のセットアップ手順

News・Showcase・Blogは、コードを直接編集せずmicroCMSの管理画面から更新できます。

### 1. アカウント作成・サービス作成
1. [microCMS](https://microcms.io/) で無料アカウントを作成
2. 「サービスを作成」→ サービスID（例: `sashiwa-cms`）を決める
   → これが `https://sashiwa-cms.microcms.io` のURLになります

### 2. APIエンドポイントを3つ作成
「API作成」から、以下の3つを作成してください（タイプは「リスト形式」）。

**① `news`**
| フィールドID | 表示名 | 種類 |
|---|---|---|
| title | タイトル | テキストフィールド |
| category | カテゴリ | テキストフィールド |
| eyecatch | 画像 | 画像 |
| aiGenerated | AI自動生成 | 真偽値 |

**② `blog`**
| フィールドID | 表示名 | 種類 |
|---|---|---|
| title | タイトル | テキストフィールド |
| category | カテゴリ | テキストフィールド |
| eyecatch | 画像 | 画像 |
| aiGenerated | AI自動生成 | 真偽値 |
| body | 本文 | リッチエディタ（任意） |

**③ `showcase`**
| フィールドID | 表示名 | 種類 |
|---|---|---|
| title | タイトル | テキストフィールド |
| client | クライアント名 | テキストフィールド |
| metric | 成果指標 | テキストフィールド |
| image | 画像 | 画像 |
| videoUrl | 動画URL | テキストフィールド（任意） |

### 3. APIキーを2種類発行する
「サービス設定」→「APIキー」から、**必ず2つ**発行してください。

- **読み取り専用キー**：GETのみ許可 → サイト（`.env`の`VITE_MICROCMS_API_KEY`）で使用
- **書き込み専用キー**：POST/PUT/PATCH/DELETEを許可 → AIエージェント側のスクリプトでのみ使用し、絶対にフロントエンドのコードや`VITE_`変数には含めないこと

### 4. サイト側の環境変数を設定
`.env.example` を `.env` にコピーし、サービスIDと読み取り専用キーを設定してください。

```
cp .env.example .env
```

### 5. 試しに1件データを入れて動作確認
microCMSの管理画面から `news` に1件仮のお知らせを入れて公開し、`npm run dev` でサイトに反映されるか確認してください。

### 6. AIエージェントからの自動投稿
`docs/ai-agent-post-example.py` または `docs/ai-agent-post-example.js` に、AIエージェント側から書き込み専用キーを使って投稿するサンプルコードがあります。AIエージェントのワークフローに組み込んでご利用ください。


## フォルダ構成

```
sashiwa-corporate-site/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example          # microCMSの接続情報のテンプレート
├── docs/
│   ├── ai-agent-post-example.py   # AIエージェント(Python)からの自動投稿サンプル
│   └── ai-agent-post-example.js   # AIエージェント(Node.js)からの自動投稿サンプル
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx
    ├── lib/
    │   ├── microcms.js           # microCMS取得の共通関数（読み取り専用）
    │   └── useMicroCMSList.js    # 一覧取得用の共通フック
    └── components/
        ├── layout/    # Header, Footer, LiveActivity
        ├── sections/  # Hero, Services, Showcase, Team, News, Blog, Contact
        └── ui/        # Button, Badge, ChatBotFloating
```
