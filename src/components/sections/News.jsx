import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, AlertTriangle } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import { useMicroCMSList } from "../../lib/useMicroCMSList.js";

/* ============================================================================
   💡【microCMS スキーマ】エンドポイント名: news
   フィールドID       | 種類            | 備考
   -------------------|-----------------|------------------------------
   title              | テキストフィールド | 記事タイトル
   category           | テキストフィールド | 例: "プロダクト", "セキュリティ"
   eyecatch           | 画像            | サムネイル画像
   aiGenerated        | 真偽値          | 社内管理用フラグ（表側には表示しません）
   （publishedAt はmicroCMSが自動付与する標準フィールドです）

   💡 aiGenerated は今後の裏側ダッシュボード（更新元の管理など）で使う想定の
      フィールドとして残していますが、DESIGN OVERRIDEの方針に基づき、
      お客様向けページ上には表示しません。
============================================================================ */

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function NewsSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-5 py-5 border-b border-slate-200 animate-pulse">
          <div className="h-14 w-14 rounded-xl bg-slate-100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-4 w-2/3 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function News() {
  // 💡 endpoint名・件数・並び順（新着順）はここで指定しています
  const { items, isLoading, error } = useMicroCMSList("news", { limit: 4, orders: "-publishedAt" });

  return (
    <section id="news" className="relative bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs font-semibold tracking-[0.2em] text-red-600 uppercase">News</p>
          <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">お知らせ</h2>
          <p className="mt-3 text-sm text-slate-400">サービスに関する最新情報をお届けします。</p>
        </motion.div>

        <div className="mt-12">
          {isLoading && <NewsSkeleton />}

          {!isLoading && error && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">お知らせの取得に失敗しました</p>
                <p className="mt-1 text-xs text-amber-700">{error}</p>
              </div>
            </div>
          )}

          {!isLoading &&
            !error &&
            items.map((item, i) => (
              <motion.a
                key={item.id}
                href="#"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group flex items-center gap-5 py-5 border-b border-slate-200 transition-colors duration-300 hover:bg-slate-50"
              >
                {item.eyecatch?.url && (
                  <img src={item.eyecatch.url} alt={item.title} className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-slate-400">{formatDate(item.publishedAt)}</span>
                    {item.category && <Badge variant="default">{item.category}</Badge>}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900 truncate group-hover:text-red-600 transition-colors">
                    {item.title}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 flex-shrink-0 transition-all duration-300 group-hover:text-red-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </motion.a>
            ))}

          {!isLoading && !error && items.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">まだお知らせはありません。</p>
          )}
        </div>
      </div>
    </section>
  );
}
