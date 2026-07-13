import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, ChevronDown, Bot } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";

const CONTACT_SUBJECTS = [
  "AI導入について",
  "データ分析コンサルティングについて",
  "受託開発のご依頼",
  "取材・登壇のご依頼",
  "採用について",
  "その他",
];

/* 💡【編集ポイント】Webhook送信先
   Zapier / make.com 等のWebhook URLに差し替えると、フォーム送信内容が
   そのままAIエージェント（Zapier経由でDify/GPTs等）へ連携されます。 */
const WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/xxxxxxx/xxxxxxx/";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    subject: CONTACT_SUBJECTS[0],
    message: "",
  });
  const [subjectOpen, setSubjectOpen] = useState(false);
  const subjectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (subjectRef.current && !subjectRef.current.contains(e.target)) setSubjectOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateField = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    const payload = {
      ...formData,
      timestamp: new Date().toISOString(),
      source: "corporate-site-contact-form",
    };

    /* ============================================================================
       💡【編集ポイント】AIエージェントへの連携（Webhook POST）
       以下を有効化すると、フォームの内容がJSONとしてWebhookに送信され、
       Zapier等の自動化フローを介してAIエージェントへタスクとして渡されます。
       開発中はコメントアウトのままで問題ありません。

       try {
         await fetch(WEBHOOK_URL, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(payload),
         });
       } catch (err) {
         console.error("Webhook送信に失敗しました", err);
       }
    ============================================================================ */
    console.log("送信ペイロード（Webhook送信のダミー）:", payload);

    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 900);
  };

  const inputClass =
    "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all duration-200 focus:border-red-500 focus:ring-4 focus:ring-red-50";

  return (
    <section id="contact" className="relative bg-neutral-950 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Badge variant="ai" pulse>
            AI Agent Standing By
          </Badge>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-white">AIに、直接依頼する。</h2>
          <p className="mt-4 text-neutral-400 max-w-lg mx-auto">
            送信された内容は自動でAIエージェントへ連携され、担当エージェントが確認のうえご返信いたします。
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-14 rounded-3xl border border-white/10 bg-white p-8 sm:p-10"
        >
          {submitted ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-600">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-6 text-lg font-bold text-neutral-950">AIエージェントに連携しました</h3>
              <p className="mt-2 text-sm text-neutral-500">担当AIエージェントが内容を確認し、まもなくご連絡いたします。</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[13px] font-semibold text-neutral-600 mb-2">お名前</label>
                  <input
                    type="text"
                    required
                    placeholder="山田 太郎"
                    value={formData.name}
                    onChange={updateField("name")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-neutral-600 mb-2">貴社名</label>
                  <input
                    type="text"
                    placeholder="株式会社〇〇"
                    value={formData.company}
                    onChange={updateField("company")}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-neutral-600 mb-2">メールアドレス</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={updateField("email")}
                  className={inputClass}
                />
              </div>

              <div className="relative" ref={subjectRef}>
                <label className="block text-[13px] font-semibold text-neutral-600 mb-2">お問い合わせ件名</label>
                <button
                  type="button"
                  onClick={() => setSubjectOpen((v) => !v)}
                  className={`${inputClass} flex items-center justify-between text-left`}
                >
                  <span>{formData.subject}</span>
                  <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${subjectOpen ? "rotate-180" : ""}`} />
                </button>
                {subjectOpen && (
                  <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
                    {CONTACT_SUBJECTS.map((subject) => (
                      <button
                        type="button"
                        key={subject}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, subject }));
                          setSubjectOpen(false);
                        }}
                        className={`block w-full px-4 py-2.5 text-left text-sm transition-colors duration-200 ${
                          formData.subject === subject ? "bg-red-50 text-red-600 font-semibold" : "text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-neutral-600 mb-2">お問い合わせ内容</label>
                <textarea
                  required
                  rows={5}
                  placeholder="ご相談内容の詳細をご記入ください。"
                  value={formData.message}
                  onChange={updateField("message")}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <Button type="submit" icon={Send} className="w-full" disabled={sending}>
                {sending ? "AIエージェントに連携中..." : "AIエージェントに送信する"}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
