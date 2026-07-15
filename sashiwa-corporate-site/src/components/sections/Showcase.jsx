import React from "react";
import { motion } from "framer-motion";
import { Play, TrendingUp, AlertTriangle } from "lucide-react";
import { useMicroCMSList } from "../../lib/useMicroCMSList.js";

/* ============================================================================
   💡【microCMS スキーマ】エンドポイント名: showcase
   フィールドID       | 種類              | 備考
   -------------------|-------------------|------------------------------
   title              | テキストフィールド   | 実績のタイトル
   client             | テキストフィールド   | クライアント名（例: "小売業A社"）
   metric             | テキストフィールド   | 成果指標（例: "在庫コスト -23%"）
   image              | 画像              | サムネイル / 動画のカバー画像
   videoUrl           | テキスト（任意）     | 動画URL。将来的に再生ボタンから接続
   body               | リッチエディタ（任意）| 詳細ページに表示する導入ストーリー
============================================================================ */

function ShowcaseSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="aspect-[4/5] rounded-3xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

/* 💡 onSelectItem(item) をクリック時に呼び出し、App側で詳細ページに切り替えます */
export default function Showcase({ onSelectItem }) {
  const { items, isLoading, error } = useMicroCMSList("showcase", { limit: 6, orders: "-publishedAt" });

  return (
    <section id="showcase" className="relative bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs font-semibold tracking-[0.2em] text-red-600 uppercase">Showcase</p>
          <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 max-w-2xl">
            確かな成果が、
            <br />
            私たちの実績です。
          </h2>
          <p className="mt-5 text-slate-500 max-w-xl leading-relaxed">
            業種・規模を問わず、幅広いご依頼にお応えしてきました。実際の成果指標とあわせてご紹介します。
          </p>
        </motion.div>

        <div className="mt-16">
          {isLoading && <ShowcaseSkeleton />}

          {!isLoading && error && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">実績の取得に失敗しました</p>
                <p className="mt-1 text-xs text-amber-700">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {items.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4 }}
                  onClick={() => onSelectItem?.(item)}
                  className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-slate-100 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
                >
                  {item.image?.url && (
                    <img
                      src={item.image.url}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/5" />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:bg-red-600">
                      <Play className="h-6 w-6 text-white ml-0.5" fill="white" strokeWidth={0} />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    {item.client && (
                      <p className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">{item.client}</p>
                    )}
                    <h3 className="mt-1 text-base font-bold text-white leading-snug">{item.title}</h3>
                    {item.metric && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1">
                        <TrendingUp className="h-3 w-3 text-emerald-300" />
                        <span className="font-mono text-[11px] font-semibold text-white">{item.metric}</span>
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {!isLoading && !error && items.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">まだ実績が登録されていません。</p>
          )}
        </div>
      </div>
    </section>
  );
}
