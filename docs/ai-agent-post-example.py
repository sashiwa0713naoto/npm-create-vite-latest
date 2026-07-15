"""
AI社員（Pythonエージェント）から microCMS へ自動投稿するサンプルスクリプト
=====================================================================

【重要】このスクリプトは AI エージェント側（サーバー / バッチ処理環境）で実行するものです。
        フロントエンド（コーポレートサイト）には絶対に組み込まないでください。

【事前準備】
1. microCMSの管理画面で「書き込み権限（POST/PUT/PATCH/DELETE）」を持つAPIキーを発行する
   （サイト表示用の読み取り専用キーとは"別"のキーを必ず発行してください）
2. 環境変数に以下を設定する（.envファイルやサーバーのSecret Managerなど）
     MICROCMS_SERVICE_DOMAIN=your-service-id
     MICROCMS_WRITE_API_KEY=your-write-api-key
3. pip install requests
"""

import os
import requests

SERVICE_DOMAIN = os.environ["MICROCMS_SERVICE_DOMAIN"]
WRITE_API_KEY = os.environ["MICROCMS_WRITE_API_KEY"]

BASE_URL = f"https://{SERVICE_DOMAIN}.microcms.io/api/v1"
HEADERS = {
    "X-MICROCMS-API-KEY": WRITE_API_KEY,
    "Content-Type": "application/json",
}


def post_blog_article(title: str, category: str, body_html: str, ai_generated: bool = True):
    """
    Blog AIエージェントが記事を1件、新規投稿する例。
    microCMSは「コンテンツID省略」でPOSTすると自動採番されます。
    """
    payload = {
        "title": title,
        "category": category,
        "body": body_html,          # リッチエディタ用にHTML文字列を渡す
        "aiGenerated": ai_generated,
    }

    res = requests.post(f"{BASE_URL}/blog", headers=HEADERS, json=payload, timeout=15)
    res.raise_for_status()
    return res.json()  # { "id": "xxxxx" } が返る


def post_showcase_case(title: str, client: str, metric: str, image_url: str = None):
    """
    Video Generation Engine 等が、実績（Showcase）を1件登録する例。
    画像を添付する場合は、事前にmicroCMSのメディアAPI（/media）にアップロードし、
    返ってきたURLをimage_urlとして渡してください。
    """
    payload = {
        "title": title,
        "client": client,
        "metric": metric,
    }
    if image_url:
        payload["image"] = {"url": image_url}

    res = requests.post(f"{BASE_URL}/showcase", headers=HEADERS, json=payload, timeout=15)
    res.raise_for_status()
    return res.json()


def post_news(title: str, category: str, ai_generated: bool = True):
    """CEO AI等が、お知らせ（News）を1件投稿する例。"""
    payload = {
        "title": title,
        "category": category,
        "aiGenerated": ai_generated,
    }
    res = requests.post(f"{BASE_URL}/news", headers=HEADERS, json=payload, timeout=15)
    res.raise_for_status()
    return res.json()


if __name__ == "__main__":
    # 動作確認用のサンプル実行（実際のエージェントのワークフローから呼び出してください）
    result = post_news(
        title="Blog AIが新しい記事を自動生成しました",
        category="アップデート",
        ai_generated=True,
    )
    print("投稿完了:", result)
