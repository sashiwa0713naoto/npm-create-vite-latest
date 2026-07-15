import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";

/* 💡【編集ポイント】初期表示メッセージ
   将来的にはDify等のRAGチャットボットのiframeに置き換える想定です。
   下部の「Difyへの差し替え例」を参照してください。 */
const INITIAL_MESSAGES = [
  {
    role: "assistant",
    text: "こんにちは。サービス内容やお見積りについて、ご質問があればお気軽にどうぞ。",
  },
];

export default function ChatBotFloating() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: input },
      {
        role: "assistant",
        text: "ご連絡ありがとうございます。担当チームが内容を確認し、追ってご連絡いたします。",
      },
    ]);
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4 flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.2)]"
          >
            {/* ヘッダー：白基調＋赤のワンポイントで、落ち着いた印象に */}
            <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50">
                <MessageCircle className="h-4 w-4 text-red-600" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">お問い合わせ窓口</p>
                <p className="text-[11px] text-slate-400">通常、数分以内に返信します</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/*
              💡【編集ポイント】Difyへの差し替え例
              実際にDify等のチャットボットを組み込む場合は、このメッセージ欄一式を
              以下のようなiframeに置き換えるだけで動作します。

              <iframe
                src="https://udify.app/chatbot/【あなたのアプリID】"
                style={{ width: "100%", height: "100%" }}
                frameBorder="0"
                allow="microphone"
              />
            */}

            {/* メッセージ欄 */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user" ? "bg-red-600 text-white" : "bg-white text-slate-700 border border-slate-200"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* 入力欄 */}
            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 bg-white p-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="メッセージを入力..."
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors duration-300 focus:border-red-400"
              />
              <button
                type="submit"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-white transition-transform duration-300 hover:scale-105"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* フローティングボタン本体：控えめで上品な単色仕上げ */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_12px_30px_-8px_rgba(220,38,38,0.5)] transition-shadow duration-300 hover:shadow-[0_16px_36px_-6px_rgba(220,38,38,0.6)]"
        aria-label="お問い合わせ窓口を開く"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
