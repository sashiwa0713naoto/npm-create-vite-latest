/**
 * microCMS APIクライアント
 *
 * 💡【使い方】
 * .env ファイルに以下を設定してください（.env.example を参照）。
 *   VITE_MICROCMS_SERVICE_DOMAIN=あなたのサービスID
 *   VITE_MICROCMS_API_KEY=読み取り専用のAPIキー
 *
 * フロントエンド（このサイト）は「読み取り専用キー」だけを使います。
 * 書き込み（AIエージェントからの自動投稿）は、このファイルではなく
 * AIエージェント側のスクリプトから直接microCMSのAPIを叩きます
 * （docs/ai-agent-post-example.js / .py を参照）。
 */

const SERVICE_DOMAIN = import.meta.env.VITE_MICROCMS_SERVICE_DOMAIN;
const API_KEY = import.meta.env.VITE_MICROCMS_API_KEY;

const BASE_URL = `https://${SERVICE_DOMAIN}.microcms.io/api/v1`;

/**
 * 指定したエンドポイント（news / blog / showcase など）から
 * コンテンツ一覧を取得します。
 *
 * @param {string} endpoint - microCMSで作成したAPIエンドポイント名
 * @param {object} params   - limit, offset, orders などのクエリパラメータ
 */
export async function fetchContents(endpoint, params = {}) {
  if (!SERVICE_DOMAIN || !API_KEY) {
    throw new Error(
      "microCMSの環境変数が設定されていません。.envファイルにVITE_MICROCMS_SERVICE_DOMAINとVITE_MICROCMS_API_KEYを設定してください。"
    );
  }

  const query = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/${endpoint}${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    headers: { "X-MICROCMS-API-KEY": API_KEY },
  });

  if (!res.ok) {
    throw new Error(`microCMSからの取得に失敗しました（${endpoint}）: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * 指定したエンドポイントの、単一コンテンツを取得します（詳細ページ用）。
 */
export async function fetchContentById(endpoint, id) {
  if (!SERVICE_DOMAIN || !API_KEY) {
    throw new Error("microCMSの環境変数が設定されていません。");
  }

  const res = await fetch(`${BASE_URL}/${endpoint}/${id}`, {
    headers: { "X-MICROCMS-API-KEY": API_KEY },
  });

  if (!res.ok) {
    throw new Error(`microCMSからの取得に失敗しました（${endpoint}/${id}）: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
