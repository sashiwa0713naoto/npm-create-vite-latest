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

## フォルダ構成

```
sashiwa-corporate-site/
├── index.html          # ページの土台となるHTML
├── package.json        # 依存パッケージの定義
├── vite.config.js       # Viteの設定
├── tailwind.config.js   # Tailwind CSSの設定
├── postcss.config.js    # PostCSSの設定
├── public/
│   └── favicon.svg      # ファビコン
└── src/
    ├── main.jsx          # アプリの起動ファイル
    ├── index.css         # Tailwindの読み込み
    └── App.jsx           # サイト本体（すべてのコンポーネント・データ）
```
