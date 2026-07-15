import React from "react";
import { motion } from "framer-motion";
import { Cpu, BarChart3, Code, ArrowUpRight } from "lucide-react";

/* 💡【編集ポイント】サービス一覧
   新しいサービスを追加する場合は、この配列に要素を1つ足すだけでOKです。
   image は https://picsum.photos/ のダミー画像です。差し替え可能です。
   detail / steps は、カードをクリックした先の詳細ページで使用します。 */
export const SERVICES_DATA = [
  {
    id: "svc-01",
    icon: Cpu,
    label: "Smart Operation",
    title: "AI業務効率化・LLM導入支援",
    body: "稟議・議事録作成・カスタマー対応など日々の業務をAIが自動化。現場のワークフローに合わせた設計から定着化までを一貫してご提供します。",
    detail:
      "属人化していた業務の棚卸しから着手し、現場のオペレーションに本当にフィットするAI活用の形を設計します。導入して終わりではなく、社内向けLLM環境の構築・運用ルールの整備、利用者向けトレーニングまでを一気通貫でご支援し、「使われ続けるAI」を実現します。",
    steps: ["業務ヒアリング・フロー設計", "AIの選定・導入", "定着化・運用サポート"],
    image: "https://picsum.photos/seed/sashiwa-svc-operation/900/700",
  },
  {
    id: "svc-02",
    icon: BarChart3,
    label: "Smart Analytics",
    title: "予測データ分析コンサルティング",
    body: "経営データをリアルタイムに可視化し、需要予測・異常検知モデルを24時間体制で運用。レポーティングまで自動化し、意思決定のスピードを高めます。",
    detail:
      "散在するデータを整理し、意思決定に直結する指標へと変換します。需要予測・異常検知モデルの構築から、経営層が一目で状況を把握できるダッシュボードの整備、定例レポーティングの仕組みづくりまで、データドリブンな経営を24時間体制で支えます。",
    steps: ["データ収集・要件整理", "分析基盤・モデル構築", "運用開始・継続的改善"],
    image: "https://picsum.photos/seed/sashiwa-svc-analytics/900/700",
  },
  {
    id: "svc-03",
    icon: Code,
    label: "Smart Development",
    title: "カスタムAI・受託システム開発",
    body: "要件定義から実装まで一貫して対応。企業固有の課題に合わせた専用AIモデルとシステムを、継続的な改善サイクルの中でご提供します。",
    detail:
      "既製品では解決できない、企業固有の課題にこそ価値があると考えています。要件定義・設計の段階から深く入り込み、専用のAIモデルとシステムを構築。既存システムとのAPI連携やリリース後の保守・継続的な改善まで、私たちが長期的に伴走します。",
    steps: ["要件定義・設計", "開発・実装", "リリース・保守運用"],
    image: "https://picsum.photos/seed/sashiwa-svc-development/900/700",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* 💡 onSelectService(id) をクリック時に呼び出し、App側で詳細ページに切り替えます */
export default function Services({ onSelectService }) {
  return (
    <section id="services" className="relative bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs font-semibold tracking-[0.2em] text-red-600 uppercase">Services</p>
          <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 max-w-2xl">
            専門領域ごとに、
            <br />
            成果へ直結するサービスを。
          </h2>
          <p className="mt-5 text-slate-500 max-w-xl leading-relaxed">
            ご相談内容に応じて、最適な専門チームが担当。ご依頼から納品まで、一貫した品質でお応えします。
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-7">
          {SERVICES_DATA.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.button
                key={service.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -4 }}
                onClick={() => onSelectService?.(service.id)}
                className="group relative text-left overflow-hidden rounded-3xl border border-slate-200 bg-white transition-shadow duration-500 hover:shadow-[0_24px_48px_-20px_rgba(15,23,42,0.15)] focus:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
              >
                <div className="relative aspect-[16/11] overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
                  <div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-white/15 backdrop-blur-md transition-colors duration-500 group-hover:bg-red-600">
                    <Icon className="h-5 w-5 text-white" strokeWidth={1.6} />
                  </div>
                </div>

                <div className="p-7">
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase text-red-600">{service.label}</p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900 tracking-tight leading-snug">{service.title}</h3>
                  <p className="mt-3 text-sm text-slate-500 leading-relaxed">{service.body}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 transition-all duration-300 group-hover:text-red-600 group-hover:gap-2.5">
                    詳しく見る
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
