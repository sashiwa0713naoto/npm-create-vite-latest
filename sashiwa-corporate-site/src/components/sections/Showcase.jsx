import React from "react";
import { motion } from "framer-motion";
import { Play, TrendingUp } from "lucide-react";
import Badge from "../ui/Badge.jsx";

/* 💡【編集ポイント】実績・制作物一覧
   image は https://picsum.photos/ のダミー画像（動画サムネイルの代わり）です。
   実際の動画URLが用意できたら videoUrl を追加し、再生ボタンから接続してください。 */
const SHOWCASE_DATA = [
  {
    id: "case-01",
    title: "AI駆動の需要予測基盤を構築",
    client: "小売業A社",
    metric: "在庫コスト -23%",
    image: "https://picsum.photos/seed/sashiwa-case-01/900/1100",
  },
  {
    id: "case-02",
    title: "カスタマー対応AIエージェントを導入",
    client: "SaaS企業B社",
    metric: "一次対応時間 -68%",
    image: "https://picsum.photos/seed/sashiwa-case-02/900/1100",
  },
  {
    id: "case-03",
    title: "生成AIによる制作パイプライン自動化",
    client: "メディアC社",
    metric: "制作リードタイム 1/5",
    image: "https://picsum.photos/seed/sashiwa-case-03/900/1100",
  },
];

export default function Showcase() {
  return (
    <section id="showcase" className="relative bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline">Showcase</Badge>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-neutral-950 max-w-2xl">
            AIエージェントの実績。
          </h2>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {SHOWCASE_DATA.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
              className="group relative aspect-[4/5] overflow-hidden rounded-3xl"
            >
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />

              {/* 再生ボタン（動画サムネイル風の演出） */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:bg-red-600/80 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]">
                  <Play className="h-6 w-6 text-white ml-0.5" fill="white" strokeWidth={0} />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">{item.client}</p>
                <h3 className="mt-1 text-base font-bold text-white leading-snug">{item.title}</h3>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-[11px] font-semibold text-white">{item.metric}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
