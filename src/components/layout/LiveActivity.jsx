import React from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, ShieldCheck, BarChart3, Film } from "lucide-react";

/* 💡【編集ポイント】AI社員の稼働ログ
   ここに配列を追加するだけで、ティッカーに流れる項目が増えます。
   将来的にはWebSocket等でリアルタイムのログに差し替える想定です。 */
const ACTIVITY_LOG = [
  { time: "14:22", icon: Film, text: "Creative AIが紹介動画のレンダリングを完了しました" },
  { time: "14:25", icon: BarChart3, text: "SEO AIがブログ記事3件を最適化しました" },
  { time: "14:31", icon: ShieldCheck, text: "Security & Ethics AIが著作権チェックを完了しました" },
  { time: "14:38", icon: Bot, text: "CEO AIが月次KPIレポートを生成しました" },
  { time: "14:44", icon: Sparkles, text: "Creative Director AIが新規提案書のドラフトを作成しました" },
];

export default function LiveActivity() {
  // 💡 ループがシームレスに見えるよう、配列を2回連結しています
  const items = [...ACTIVITY_LOG, ...ACTIVITY_LOG];

  return (
    <div className="w-full overflow-hidden border-b border-neutral-200 bg-neutral-950">
      <div className="flex items-center">
        <div className="flex-shrink-0 flex items-center gap-2 bg-red-600 px-4 py-2 text-white z-10">
          <span className="status-dot h-2 w-2 rounded-full bg-white" />
          <span className="text-[11px] font-bold tracking-widest uppercase">Live</span>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <motion.div
            className="flex whitespace-nowrap py-2"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 28, ease: "linear", repeat: Infinity }}
          >
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-2 px-6 text-xs text-neutral-300">
                  <span className="font-mono text-neutral-500">[{item.time}]</span>
                  <Icon className="h-3.5 w-3.5 text-red-400" strokeWidth={1.8} />
                  <span>{item.text}</span>
                  <span className="ml-6 text-neutral-700">/</span>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
