import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Button from "../ui/Button.jsx";

/* 💡【編集ポイント】ナビゲーションメニュー */
const NAV_LINKS = [
  { id: "services", label: "Services" },
  { id: "showcase", label: "Showcase" },
  { id: "team", label: "Team" },
  { id: "news", label: "News" },
  { id: "blog", label: "Blog" },
  { id: "contact", label: "Contact" },
];

export default function Header({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState("services");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 💡 各セクションが画面に入ったタイミングで、対応するナビの赤いアンダーラインを自動的に切り替えます
  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(Boolean);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    // 💡 詳細ページ表示中にナビが押された場合は、App側でトップページに戻ってからスクロールします
    if (onNavigate) {
      onNavigate(id);
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/85 backdrop-blur-xl border-b border-slate-200" : "bg-white border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between h-20">
          <button onClick={() => scrollTo("home")} className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
              <span className="text-sm font-bold text-white">S</span>
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">SASHIWA</span>
          </button>

          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className="relative py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                {link.label}
                {activeId === link.id && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-red-600 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="hidden lg:block">
            <Button size="sm" onClick={() => scrollTo("contact")}>
              ご相談する
            </Button>
          </div>

          <button className="lg:hidden text-slate-900 p-2" onClick={() => setMenuOpen((v) => !v)} aria-label="メニューを開く">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className={`block w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeId === link.id ? "text-red-600 bg-red-50" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2">
            <Button size="sm" className="w-full" onClick={() => scrollTo("contact")}>
              ご相談する
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
