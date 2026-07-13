import React from "react";
import { motion } from "framer-motion";
import { Bot, ArrowRight, Activity, Users, Zap } from "lucide-react";
import Button from "../ui/Button.jsx";
import Badge from "../ui/Badge.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* 💡【編集ポイント】ヒーロー下の稼働ステータス */
const STATS = [
  { icon: Users, value: "4", label: "稼働中のAIエージェント" },
  { icon: Activity, value: "99.99%", label: "System Uptime" },
  { icon: Zap, value: "1,204", label: "本日の完了タスク数" },
];

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden bg-white pt-20 sm:pt-28 pb-20">
      {/* 背景の淡いメッシュ（赤系のアクセントをごく薄く） */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-0 h-[32rem] w-[32rem] rounded-full bg-red-500/[0.06] blur-[110px]" />
        <div className="absolute bottom-0 left-0 h-[24rem] w-[24rem] rounded-full bg-neutral-900/[0.04] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
              <Badge variant="ai" pulse>
                社員数 0名 / 稼働AIエージェント 4体
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-neutral-950"
            >
              社員は、
              <span className="text-red-600">全員AI。</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-7 text-lg text-neutral-500 leading-relaxed max-w-lg"
            >
              人が介在しない、完全自律型の企業体。株式会社SASHIWAでは、経営判断からクリエイティブ制作、セキュリティ監視まで、すべてを専任のAIエージェントが24時間365日、休むことなく遂行しています。
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-10 flex flex-wrap gap-4">
              <Button icon={ArrowRight}>AIエージェントに相談する</Button>
              <Button variant="outline" icon={Bot}>
                AIチームを見る
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-14 grid grid-cols-3 gap-4 max-w-lg border-t border-neutral-200 pt-8"
            >
              {STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label}>
                    <Icon className="h-4 w-4 text-red-600" strokeWidth={2} />
                    <p className="mt-2 text-2xl font-black text-neutral-950">{stat.value}</p>
                    <p className="mt-1 text-[11px] text-neutral-400 leading-tight">{stat.label}</p>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* 💡 大胆な画像配置：picsum.photosのダミー画像を使用しています */}
          <motion.div
            className="lg:col-span-6"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-[0_40px_80px_-24px_rgba(0,0,0,0.3)]">
              <img
                src="https://picsum.photos/seed/sashiwa-ai-hero/1000/1250"
                alt="AIエージェントが稼働するオフィスのイメージ"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent" />

              {/* ガラスのようなステータスカード（グラスモーフィズム） */}
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-5 py-4 flex items-center gap-3">
                <span className="status-dot h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-white/90 tracking-wide uppercase">All Agents Online</p>
                  <p className="text-[11px] text-white/60">最終同期：たった今</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
