import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Palette, Film, ShieldCheck, Send, X } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";

/* 💡【編集ポイント】AI社員一覧
   新しいAIエージェントを追加する場合は、この配列に要素を1つ足すだけでOKです。
   load はダミーのCPU使用率（%）です。将来的にはAPIから取得する想定です。 */
const AI_TEAM = [
  {
    id: "agent-ceo",
    name: "CEO",
    role: "経営最適化AI",
    icon: Crown,
    load: 42,
    avatar: "https://picsum.photos/seed/sashiwa-agent-ceo/300/300",
    description: "全社のKPIをリアルタイムに監視し、リソース配分と意思決定を最適化します。",
  },
  {
    id: "agent-creative",
    name: "Creative Director AI",
    role: "企画・構成生成",
    icon: Palette,
    load: 67,
    avatar: "https://picsum.photos/seed/sashiwa-agent-creative/300/300",
    description: "クライアントの要件から企画・構成案を自動生成し、複数パターンを並行して検討します。",
  },
  {
    id: "agent-video",
    name: "Video Generation Engine",
    role: "映像レンダリング",
    icon: Film,
    load: 88,
    avatar: "https://picsum.photos/seed/sashiwa-agent-video/300/300",
    description: "承認された構成案をもとに、映像素材の生成・編集・レンダリングを高速に実行します。",
  },
  {
    id: "agent-security",
    name: "Security & Ethics AI",
    role: "著作権・倫理監視",
    icon: ShieldCheck,
    load: 24,
    avatar: "https://picsum.photos/seed/sashiwa-agent-security/300/300",
    description: "全生成物の著作権・倫理チェックを24時間実施し、リスクのある出力をブロックします。",
  },
];

function AgentCard({ agent, index }) {
  const Icon = agent.icon;
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskText, setTaskText] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmitTask = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    // 💡 本番では、ここでWebhook（Zapier等）にPOSTしてAIエージェントへタスクを渡します
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setTaskOpen(false);
      setTaskText("");
    }, 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white transition-shadow duration-500 hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.15)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={agent.avatar} alt={agent.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
        <div className="absolute top-4 left-4">
          <Badge variant="status" pulse>
            Status: Online
          </Badge>
        </div>
        <div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 backdrop-blur-md">
          <Icon className="h-5 w-5 text-white" strokeWidth={1.6} />
        </div>
      </div>

      <div className="p-6">
        <p className="text-xs font-bold tracking-[0.15em] uppercase text-red-600">{agent.role}</p>
        <h3 className="mt-1 text-lg font-black text-neutral-950 tracking-tight">{agent.name}</h3>
        <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{agent.description}</p>

        {/* CPU Load プログレスバー */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">CPU Load</span>
            <span className="text-[11px] font-bold text-neutral-700">{agent.load}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${agent.load}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
            />
          </div>
        </div>

        <button
          onClick={() => setTaskOpen((v) => !v)}
          className="mt-5 w-full rounded-full border border-neutral-300 py-2.5 text-xs font-bold text-neutral-700 transition-colors duration-300 hover:border-red-500 hover:text-red-600"
        >
          このAIにタスクを投げる
        </button>

        <AnimatePresence>
          {taskOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {sent ? (
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-700 font-semibold">
                  タスクを {agent.name} に送信しました。
                </div>
              ) : (
                <form onSubmit={handleSubmitTask} className="mt-4 space-y-2.5">
                  <textarea
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    rows={3}
                    placeholder={`${agent.name} への指示内容を入力...`}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs outline-none focus:border-red-400 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setTaskOpen(false)}
                      className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="h-3 w-3" />
                      閉じる
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                    >
                      <Send className="h-3 w-3" />
                      送信
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function Team() {
  return (
    <section id="team" className="relative bg-neutral-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline">AI Team</Badge>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-neutral-950 max-w-2xl">
            私たちのチームは、
            <br />
            全員AIです。
          </h2>
          <p className="mt-4 text-neutral-500 max-w-xl">
            それぞれが専門領域を持つAIエージェントとして自律稼働しています。気になるAIに、直接タスクを依頼してみてください。
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {AI_TEAM.map((agent, i) => (
            <AgentCard key={agent.id} agent={agent} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
