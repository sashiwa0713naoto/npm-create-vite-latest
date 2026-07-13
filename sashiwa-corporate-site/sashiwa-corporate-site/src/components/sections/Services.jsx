import React from "react";
import { motion } from "framer-motion";
import { Cpu, BarChart3, Code, ArrowUpRight } from "lucide-react";
import Badge from "../ui/Badge.jsx";

/* 💡【編集ポイント】サービス一覧
   新しいサービスを追加する場合は、この配列に要素を1つ足すだけでOKです。
   image は https://picsum.photos/ のダミー画像です。差し替え可能です。 */
const SERVICES_DATA = [
  {
    id: "svc-01",
    icon: Cpu,
    label: "Smart Operation",
    title: "AI業務効率化・LLM導入支援",
    body: "稟議・議事録作成・カスタマー対応など日々の業務を、専任のAIエージェントが自動化。現場のワークフローに合わせた設計から定着化までを一貫して遂行します。",
    image: "https://picsum.photos/seed/sashiwa-svc-operation/900/700",
  },
  {
    id: "svc-02",
    icon: BarChart3,
    label: "Smart Analytics",
    title: "予測データ分析コンサルティング",
    body: "Analytics AIが経営データをリアルタイムに可視化し、需要予測・異常検知モデルを24時間体制で運用。人の手を介さずレポーティングまで自動生成します。",
    image: "https://picsum.photos/seed/sashiwa-svc-analytics/900/700",
  },
  {
    id: "svc-03",
    icon: Code,
    label: "Smart Development",
    title: "カスタムAI・受託システム開発",
    body: "Development AIが要件定義から実装までを担当。企業固有の課題に合わせた専用AIモデルとシステムを、継続的な自己改善サイクルの中で開発・運用します。",
    image: "https://picsum.photos/seed/sashiwa-svc-development/900/700",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Services() {
  return (
    <section id="services" className="relative bg-neutral-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline">Services</Badge>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-neutral-950 max-w-2xl">
            AIエージェントが、
            <br />
            事業を動かす。
          </h2>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-7">
          {SERVICES_DATA.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-shadow duration-500 hover:shadow-[0_30px_60px_-20px_rgba(220,38,38,0.25)]"
              >
                <div className="relative aspect-[16/11] overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {/* ホバー時に赤く発光するグラスバッジ */}
                  <div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 backdrop-blur-md transition-all duration-500 group-hover:bg-red-600/80 group-hover:shadow-[0_0_24px_rgba(220,38,38,0.6)]">
                    <Icon className="h-5 w-5 text-white" strokeWidth={1.6} />
                  </div>
                </div>

                <div className="p-7">
                  <p className="text-xs font-bold tracking-[0.15em] uppercase text-red-600">{service.label}</p>
                  <h3 className="mt-2 text-lg font-bold text-neutral-950 tracking-tight leading-snug">{service.title}</h3>
                  <p className="mt-3 text-sm text-neutral-500 leading-relaxed">{service.body}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-neutral-950 transition-all duration-300 group-hover:text-red-600 group-hover:gap-2.5">
                    詳しく見る
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
