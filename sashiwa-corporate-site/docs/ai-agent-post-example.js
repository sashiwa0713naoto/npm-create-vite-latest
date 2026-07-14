/**
 * AI社員（Node.jsエージェント）から microCMS へ自動投稿するサンプルスクリプト
 * =====================================================================
 *
 * 【重要】このスクリプトは AI エージェント側（サーバー / バッチ処理環境）で実行するものです。
 *         フロントエンド（コーポレートサイト）には絶対に組み込まないでください。
 *
 * 【事前準備】
 * 1. microCMSの管理画面で「書き込み権限（POST/PUT/PATCH/DELETE）」を持つAPIキーを発行する
 *    （サイト表示用の読み取り専用キーとは"別"のキーを必ず発行してください）
 * 2. 環境変数に以下を設定する
 *      MICROCMS_SERVICE_DOMAIN=your-service-id
 *      MICROCMS_WRITE_API_KEY=your-write-api-key
 * 3. Node.js 18以降であれば追加インストール不要（標準のfetchを使用）
 */

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const WRITE_API_KEY = process.env.MICROCMS_WRITE_API_KEY;

const BASE_URL = `https://${SERVICE_DOMAIN}.microcms.io/api/v1`;

async function postToMicroCMS(endpoint, payload) {
  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "X-MICROCMS-API-KEY": WRITE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`microCMSへの投稿に失敗しました (${res.status}): ${text}`);
  }

  return res.json(); // { id: "xxxxx" } が返る
}

/** Creative Director AI 等が、ブログ記事を1件投稿する例 */
export async function postBlogArticle({ title, category, bodyHtml, aiGenerated = true }) {
  return postToMicroCMS("blog", {
    title,
    category,
    body: bodyHtml,
    aiGenerated,
  });
}

/** Video Generation Engine が、実績（Showcase）を1件登録する例 */
export async function postShowcaseCase({ title, client, metric, imageUrl }) {
  const payload = { title, client, metric };
  if (imageUrl) payload.image = { url: imageUrl };
  return postToMicroCMS("showcase", payload);
}

/** CEO AI 等が、お知らせ（News）を1件投稿する例 */
export async function postNews({ title, category, aiGenerated = true }) {
  return postToMicroCMS("news", { title, category, aiGenerated });
}

// 動作確認用のサンプル実行（実際のエージェントのワークフローから呼び出してください）
// postNews({ title: "Blog AIが新しい記事を自動生成しました", category: "アップデート" })
//   .then((result) => console.log("投稿完了:", result))
//   .catch((err) => console.error(err));
