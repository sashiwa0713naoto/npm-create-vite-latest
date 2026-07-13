import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, X, Send, Sparkles } from "lucide-react";

/* 💡【編集ポイント】初期表示メッセージ
   将来的にはDify等のRAGチャットボットのiframeに置き換える想定です。
   下部の「Difyへの差し替え例」を参照してください。 */
const INITIAL_MESSAGES = [
  {
    role: "ai",
    text: "ただいまAIエージェントが待機しています。ご質問やご相談内容をお聞かせください。",
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
        role: "ai",
        text: "ご連絡ありがとうございます。担当のAIエージェントが内容を確認し、まもなく回答いたします。",
      },
    ]);
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4 flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.25)]"
          >
            {/* ヘッダー */}
            <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-950 px-5 py-4">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-red-600">
                <Bot className="h-4 w-4 text-white" />
                <span className="status-dot absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-neutral-950" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">AI Concierge</p>
                <p className="text-[11px] text-neutral-400">Status: Online</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto text-neutral-400 hover:text-white transition-colors">
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
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user" ? "bg-red-600 text-white" : "bg-neutral-100 text-neutral-800"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* 入力欄 */}
            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-neutral-100 p-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="メッセージを入力..."
                className="flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-red-400"
              />
              <button
                type="submit"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-white transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* フローティングボタン本体 */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_12px_30px_-6px_rgba(220,38,38,0.6)]"
        aria-label="AIコンシェルジュを開く"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white">
            <Sparkles className="h-2 w-2 text-emerald-900" />
          </span>
        )}
      </motion.button>
    </div>
  );
}
