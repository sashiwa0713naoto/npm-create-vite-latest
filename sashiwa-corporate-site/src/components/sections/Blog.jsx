import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowUpRight, AlertTriangle } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import { useMicroCMSList } from "../../lib/useMicroCMSList.js";

/* ============================================================================
   💡【microCMS スキーマ】エンドポイント名: blog
   フィールドID       | 種類              | 備考
   -------------------|-------------------|------------------------------
   title              | テキストフィールド   | 記事タイトル
   category           | テキストフィールド   | 例: "組織論", "ナレッジ"
   eyecatch           | 画像              | サムネイル画像
   aiGenerated        | 真偽値            | ONで「Auto Curated」バッジを表示
   body               | リッチエディタ（任意）| 将来の記事詳細ページ用
============================================================================ */

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function BlogSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[7/5] rounded-2xl bg-neutral-100" />
          <div className="mt-4 h-3 w-20 rounded bg-neutral-100" />
          <div className="mt-2 h-4 w-full rounded bg-neutral-100" />
          <div className="mt-2 h-4 w-2/3 rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

export default function Blog() {
  const { items, isLoading, error } = useMicroCMSList("blog", { limit: 3, orders: "-publishedAt" });

  return (
    <section id="blog" className="relative bg-neutral-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline">Blog</Badge>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-neutral-950">ブログ</h2>
          <p className="mt-3 text-sm text-neutral-400">Auto Curated — AIエージェントが選定・執筆・更新までを自動化しています。</p>
        </motion.div>

        <div className="mt-12">
          {isLoading && <BlogSkeleton />}

          {!isLoading && error && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">記事の取得に失敗しました</p>
                <p className="mt-1 text-xs text-amber-700">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
              {items.map((item, i) => (
                <motion.a
                  key={item.id}
                  href="#"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -5 }}
                  className="group block"
                >
                  <div className="relative aspect-[7/5] overflow-hidden rounded-2xl bg-neutral-100">
                    {item.eyecatch?.url && (
                      <img
                        src={item.eyecatch.url}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-neutral-400">{formatDate(item.publishedAt)}</span>
                    {item.category && <Badge variant="default">{item.category}</Badge>}
                    {item.aiGenerated && (
                      <Badge variant="ai">
                        <Sparkles className="h-2.5 w-2.5" />
                        Auto Curated
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-2 text-base font-bold text-neutral-950 leading-snug group-hover:text-red-600 transition-colors">
                    {item.title}
                  </h3>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 group-hover:text-red-600 transition-colors">
                    続きを読む
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </motion.a>
              ))}
            </div>
          )}

          {!isLoading && !error && items.length === 0 && (
            <p className="py-10 text-center text-sm text-neutral-400">まだ記事はありません。</p>
          )}
        </div>
      </div>
    </section>
  );
}
