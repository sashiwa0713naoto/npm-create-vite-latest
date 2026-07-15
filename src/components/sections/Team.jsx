import React from "react";
import { motion } from "framer-motion";
import { Crown, Palette, Film, ShieldCheck } from "lucide-react";

/* ============================================================================
   💡【編集ポイント】チーム一覧
   新しい専門領域を追加する場合は、この配列に要素を1つ足すだけでOKです。
   ※お客様向けページのため、稼働率やタスク投入UIなどの内部システム情報は
     一切含めていません（社長専用ダッシュボード側の機能として別途実装）。
============================================================================ */
const TEAM_DATA = [
  {
    id: "role-management",
    role: "経営最適化",
    label: "Executive Intelligence",
    icon: Crown,
    description: "全体のKPIとリソース配分を常時最適化し、プロジェクトの意思決定スピードを最大化します。",
    tags: ["進行管理", "リソース最適化"],
  },
  {
    id: "role-creative",
    role: "企画・クリエイティブ",
    label: "Creative Direction",
    icon: Palette,
    description: "要件を的確に汲み取り、複数の企画・構成パターンを短期間で並行検討します。",
    tags: ["企画立案", "構成設計"],
  },
  {
    id: "role-production",
    role: "映像・コンテンツ制作",
    label: "Production Engine",
    icon: Film,
    description: "承認済みの構成をもとに、高品質な映像・クリエイティブ素材を高速に仕上げます。",
    tags: ["映像制作", "高速レンダリング"],
  },
  {
    id: "role-security",
    role: "品質・倫理監査",
    label: "Compliance & Ethics",
    icon: ShieldCheck,
    description: "著作権・倫理・品質基準を常時チェックし、安心してご依頼いただける体制を守ります。",
    tags: ["著作権チェック", "品質保証"],
  },
];

export default function Team() {
  return (
    <section id="team" className="relative bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs font-semibold tracking-[0.2em] text-red-600 uppercase">Our Team</p>
          <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 max-w-2xl">
            各領域のプロフェッショナルが、
            <br />
            専任で対応します。
          </h2>
          <p className="mt-5 text-slate-500 max-w-xl leading-relaxed">
            経営最適化からクリエイティブ制作、品質・倫理監査まで。専門特化した体制により、高い品質を保ちながらスピーディーにご依頼へ対応します。
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM_DATA.map((member, i) => {
            const Icon = member.icon;
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4 }}
                className="group rounded-3xl border border-slate-200 bg-white p-7 transition-all duration-500 hover:shadow-[0_24px_48px_-20px_rgba(15,23,42,0.15)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 transition-colors duration-500 group-hover:bg-red-100">
                  <Icon className="h-6 w-6 text-red-600" strokeWidth={1.6} />
                </div>

                <p className="mt-6 text-xs font-semibold tracking-[0.15em] uppercase text-slate-400">{member.label}</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 tracking-tight">{member.role}</h3>
                <p className="mt-3 text-sm text-slate-500 leading-relaxed">{member.description}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {member.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-500">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
