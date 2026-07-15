import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, Sparkles, CheckCircle2 } from "lucide-react";
import Button from "../ui/Button.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* 💡【編集ポイント】ヒーロー下の指標
   お客様に安心感を伝える「事業としての強み」を表示しています。
   内部システムの稼働状況（Uptimeなど）はここには含めません。 */
const HIGHLIGHTS = [
  { value: "4", unit: "領域", label: "専門チームでワンストップ対応" },
  { value: "24h", unit: "", label: "以内を目安にご提案・お見積り" },
  { value: "100", unit: "%", label: "デジタル完結のご発注・納品" },
];

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-white pt-20 sm:pt-28 pb-20 sm:pb-28">
      {/* 背景の極めて淡いメッシュ（赤系のアクセントをごく薄く、上品に） */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-0 h-[32rem] w-[32rem] rounded-full bg-red-500/[0.05] blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[24rem] w-[24rem] rounded-full bg-slate-900/[0.03] blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
          <div className="lg:col-span-6">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0}
              className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-red-600" strokeWidth={1.8} />
              <span className="text-[11px] font-semibold tracking-[0.1em] text-red-600 uppercase">
                AI-Powered Agency
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="mt-7 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight text-slate-900"
            >
              社員は、
              <span className="text-red-600">全員AI。</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-7 text-lg text-slate-500 leading-relaxed max-w-lg"
            >
              経営判断からクリエイティブ制作、品質・倫理監査まで。専門特化したAIチームが、人件費に依存しない圧倒的なコスト効率とスピードで、貴社のご依頼にお応えします。
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-10 flex flex-wrap gap-4">
              <Button icon={ArrowRight}>サービス内容を見る</Button>
              <Button variant="outline" icon={Users}>
                チームを見る
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-16 grid grid-cols-3 gap-6 max-w-lg border-t border-slate-200 pt-9"
            >
              {HIGHLIGHTS.map((item) => (
                <div key={item.label}>
                  <p className="font-mono text-2xl sm:text-3xl font-semibold text-slate-900">
                    {item.value}
                    <span className="text-sm text-slate-400">{item.unit}</span>
                  </p>
                  <p className="mt-1.5 text-[11px] text-slate-400 leading-snug">{item.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* 💡 大胆な画像配置：picsum.photosのダミー画像を使用しています */}
          <motion.div
            className="lg:col-span-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-[0_40px_80px_-24px_rgba(15,23,42,0.25)]">
              <img
                src="https://picsum.photos/seed/sashiwa-ai-hero/1000/1250"
                alt="専門チームが伴走するイメージ"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />

              {/* 💡 グラスモーフィズムのキャプションカード（AI感を煽らず、安心感を伝える） */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/25 bg-white/15 backdrop-blur-xl px-5 py-4 flex items-center gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" strokeWidth={1.8} />
                <div>
                  <p className="text-sm font-semibold text-white">専門チームが、貴社の課題に伴走します</p>
                  <p className="mt-0.5 text-xs text-white/70">ご相談から納品まで、専任体制で対応</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
