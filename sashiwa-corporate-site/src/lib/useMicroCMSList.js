import { useEffect, useState } from "react";
import { fetchContents } from "./microcms.js";

/**
 * microCMSの一覧コンテンツを取得する共通フック。
 * News / Blog / Showcase など、複数のセクションで使い回せます。
 *
 * @param {string} endpoint - microCMSのAPIエンドポイント名（例: "news"）
 * @param {object} params   - limit, orders などのクエリパラメータ
 *
 * @returns {{ items: object[], isLoading: boolean, error: string|null }}
 */
export function useMicroCMSList(endpoint, params = {}) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    fetchContents(endpoint, params)
      .then((res) => {
        if (!mounted) return;
        setItems(res.contents || []);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error(err);
        setError(err.message);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, JSON.stringify(params)]);

  return { items, isLoading, error };
}
