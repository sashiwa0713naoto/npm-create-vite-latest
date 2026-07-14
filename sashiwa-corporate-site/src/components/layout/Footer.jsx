import React, { useEffect, useState } from "react";
import { Bot, Mail, Activity, Cpu } from "lucide-react";

const COMPANY_NAME = "株式会社SASHIWA";

const SITEMAP = [
  { id: "services", label: "Services" },
  { id: "team", label: "AI Team" },
  { id: "news", label: "News" },
  { id: "contact", label: "Contact" },
];

export default function Footer({ onNavigate }) {
  // 💡 サーバー稼働率はダミーでランダムに揺らぎを持たせ、
  //    「今まさに動いている」感を演出しています（本番ではAPIから取得する想定）
  const [load, setLoad] = useState(42);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoad(Math.floor(30 + Math.random() * 30));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const scrollTo = (id) => {
    if (onNavigate) {
      onNavigate(id);
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="relative bg-neutral-950 pt-16 pb-6">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        {/* システムステータスバー */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-14">
          <div className="flex items-center gap-3">
            <span className="status-dot h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div>
              <p className="text-[11px] text-neutral-500 tracking-wide uppercase">System Status</p>
              <p className="text-sm font-semibold text-white">All Systems Operational</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-[11px] text-neutral-500 tracking-wide uppercase">System Uptime</p>
              <p className="text-sm font-semibold text-white">99.99%</p>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Cpu className="h-4 w-4 text-red-500" />
              <p className="text-[11px] text-neutral-500 tracking-wide uppercase">
                サーバー稼働率 <span className="text-white font-semibold">{load}%</span>
              </p>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000"
                style={{ width: `${load}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600">
                <Bot className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="text-base font-black text-white">SASHIWA</span>
            </div>
            <p className="mt-3 text-sm text-neutral-500 leading-relaxed max-w-xs">
              {COMPANY_NAME}。社員全員がAIエージェント — 人が介在せず、AIが自律的に稼働し続ける次世代カンパニー。
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest mb-4">Sitemap</p>
            <ul className="space-y-2.5">
              {SITEMAP.map((link) => (
                <li key={link.id}>
                  <button onClick={() => scrollTo(link.id)} className="text-sm text-neutral-400 hover:text-red-400 transition-colors">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest mb-4">Contact</p>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Mail className="h-3.5 w-3.5" />
              contact@sashiwa.example.com
            </div>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 text-xs text-neutral-600">
          © 2026 {COMPANY_NAME} All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
