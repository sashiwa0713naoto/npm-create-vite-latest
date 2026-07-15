import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, ChevronDown, CheckCircle2, Loader2, Mail } from "lucide-react";

/* ============================================================================
   💡【編集ポイント】ご依頼の目的（プラン選定に近い体験にするための選択肢）
============================================================================ */
const PURPOSE_OPTIONS = [
  "AI業務効率化・LLM導入について",
  "予測データ分析コンサルティングについて",
  "カスタムAI・受託システム開発について",
  "その他のご相談",
];

/* 💡【編集ポイント】ご予算感（正式な決済フローが整うまでの概算ヒアリング用） */
const BUDGET_OPTIONS = [
  { value: "〜30万円", label: "〜30万円" },
  { value: "30万円〜100万円", label: "30万円〜100万円" },
  { value: "100万円〜300万円", label: "100万円〜300万円" },
  { value: "300万円以上 / 未定", label: "300万円以上 ／ 未定" },
];

/* ============================================================================
   💡【編集ポイント】Make（旧Integromat）Webhook送信先
   ここにMakeのWebhook URLを設定すると、送信内容がそのままシナリオへ連携されます。
   開発中はコメントアウトのままで問題ありません。
============================================================================ */
const MAKE_WEBHOOK_URL = "https://hook.us1.make.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxx";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  // 💡 UI上の入力項目。これらはあくまで"表示・体験"のためのものであり、
  //    送信時にはmessage一本にフォーマットして結合します（JSON Key規格の死守）。
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    purpose: PURPOSE_OPTIONS[0],
    budget: "",
    details: "",
    agree: false,
  });

  const [purposeOpen, setPurposeOpen] = useState(false);
  const purposeRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (purposeRef.current && !purposeRef.current.contains(e.target)) setPurposeOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateField = (field) => (e) => {
    const value = field === "agree" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    // 💡【最重要】UI上の拡張項目（依頼目的・予算感）を、送信直前に1つの
    //    フォーマット済み文字列へ結合し、message の値として格納します。
    //    JSONのKeyは { client_name, client_email, message } の3つに固定。
    const formattedMessage =
      `【依頼目的】${formData.purpose}\n` +
      `【ご予算感】${formData.budget || "未選択"}\n\n` +
      `【ご依頼内容】\n${formData.details}`;

    const payload = {
      client_name: formData.name,
      client_email: formData.email,
      message: formattedMessage,
    };

    /* ============================================================================
       💡【編集ポイント】Makeへの連携（Webhook POST）
       以下を有効化すると、payloadがそのままMakeのシナリオに送信されます。

       try {
         await fetch(MAKE_WEBHOOK_URL, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(payload),
         });
       } catch (err) {
         console.error("Make Webhookへの送信に失敗しました", err);
       }
    ============================================================================ */
    console.log("送信ペイロード（JSON規格固定・Webhook送信のダミー）:", payload);

    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 1200);
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-red-400 focus:ring-4 focus:ring-red-50";

  return (
    <section id="contact" className="relative bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-2xl px-6 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-red-50">
            <Mail className="h-4.5 w-4.5 text-red-600" strokeWidth={1.8} />
          </div>
          <h2 className="mt-6 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            まずは、お気軽にご相談ください
          </h2>
          <p className="mt-4 text-slate-500 leading-relaxed max-w-md mx-auto">
            サービス内容・概算費用のご案内から、実際のご依頼まで。専任チームが内容を確認のうえ、担当者よりご連絡いたします。
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-[0_2px_40px_-12px_rgba(15,23,42,0.08)]"
        >
          {submitted ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <CheckCircle2 className="h-6 w-6 text-red-600" strokeWidth={1.8} />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">ご相談ありがとうございます</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                内容を確認のうえ、担当者より1〜2営業日以内にご連絡いたします。
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[13px] font-medium text-slate-600 mb-2">ご依頼の目的</label>
                <div className="relative" ref={purposeRef}>
                  <button
                    type="button"
                    onClick={() => setPurposeOpen((v) => !v)}
                    className={`${inputClass} flex items-center justify-between text-left`}
                  >
                    <span>{formData.purpose}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${purposeOpen ? "rotate-180" : ""}`} />
                  </button>
                  {purposeOpen && (
                    <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                      {PURPOSE_OPTIONS.map((purpose) => (
                        <button
                          type="button"
                          key={purpose}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, purpose }));
                            setPurposeOpen(false);
                          }}
                          className={`block w-full px-4 py-2.5 text-left text-sm transition-colors duration-200 ${
                            formData.purpose === purpose ? "bg-red-50 text-red-600 font-medium" : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {purpose}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-600 mb-3">ご予算感</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {BUDGET_OPTIONS.map((option) => {
                    const active = formData.budget === option.value;
                    return (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => setFormData((prev) => ({ ...prev, budget: option.value }))}
                        className={`rounded-xl border px-4 py-3 text-sm font-medium text-center font-mono transition-all duration-300 ${
                          active
                            ? "border-red-500 bg-red-50 text-red-600"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[13px] font-medium text-slate-600 mb-2">お名前</label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="山田 太郎"
                    value={formData.name}
                    onChange={updateField("name")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-slate-600 mb-2">メールアドレス</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={updateField("email")}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-slate-600 mb-2">ご依頼内容の詳細</label>
                <textarea
                  required
                  rows={5}
                  placeholder="実現したいこと、ご希望の納期などをご記入ください。"
                  value={formData.details}
                  onChange={updateField("details")}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <label className="flex items-start gap-3 text-xs text-slate-500">
                <input
                  type="checkbox"
                  required
                  checked={formData.agree}
                  onChange={updateField("agree")}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-red-600"
                />
                <span>プライバシーポリシーの内容に同意の上、送信します。</span>
              </label>

              <motion.button
                type="submit"
                disabled={sending}
                whileTap={{ scale: 0.98 }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-7 py-4 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(220,38,38,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-6px_rgba(220,38,38,0.6)] disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    送信中...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    この内容で相談する
                  </>
                )}
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
