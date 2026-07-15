import React from "react";
import { Mail } from "lucide-react";

const COMPANY_NAME = "株式会社SASHIWA";

/* 💡【編集ポイント】サイトマップ（Header.jsxのナビゲーションと揃えています） */
const SITEMAP = [
  { id: "services", label: "Services" },
  { id: "showcase", label: "Showcase" },
  { id: "team", label: "Team" },
  { id: "news", label: "News" },
  { id: "blog", label: "Blog" },
  { id: "contact", label: "Contact" },
];

export default function Footer({ onNavigate }) {
  const scrollTo = (id) => {
    if (onNavigate) {
      onNavigate(id);
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="relative bg-white border-t border-slate-200 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600">
                <span className="text-xs font-bold text-white">S</span>
              </span>
              <span className="text-base font-bold text-slate-900">SASHIWA</span>
            </div>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-xs">
              {COMPANY_NAME}。専門特化したAIの力で、事業のスピードとクオリティを両立するプロフェッショナルファームです。
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Sitemap</p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {SITEMAP.map((link) => (
                <li key={link.id}>
                  <button onClick={() => scrollTo(link.id)} className="text-sm text-slate-500 hover:text-red-600 transition-colors">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Contact</p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              contact@sashiwa.example.com
            </div>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-slate-200 text-xs text-slate-400">
          © 2026 {COMPANY_NAME} All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
