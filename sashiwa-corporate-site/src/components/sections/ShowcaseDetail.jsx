import React from "react";
import { ArrowLeft, ArrowRight, TrendingUp } from "lucide-react";
import Button from "../ui/Button.jsx";

/* 💡 Showcaseカードをクリックした先の詳細ページです。
   itemはmicroCMSから取得した実際のコンテンツオブジェクトがそのまま渡されます。
   「body」フィールドをmicroCMS側に追加すると、その内容が自動的にここへ反映されます。 */
export default function ShowcaseDetail({ item, onBack, onGoContact }) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-14 pt-10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors duration-300"
        >
          <ArrowLeft className="h-4 w-4" />
          実績一覧に戻る
        </button>
      </div>

      <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-14 pt-8 pb-4">
        {item.client && <p className="text-xs font-semibold tracking-[0.2em] uppercase text-red-600">{item.client}</p>}
        <h1 className="mt-3 text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
          {item.title}
        </h1>
        {item.metric && (
          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-mono text-sm font-semibold text-emerald-700">{item.metric}</span>
          </div>
        )}
      </div>

      {item.image?.url && (
        <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-14">
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-[0_24px_60px_-20px_rgba(15,23,42,0.2)]">
            <img src={item.image.url} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-14 py-16 sm:py-20">
        {item.body ? (
          // 💡 microCMSのリッチエディタで書いた内容をそのまま表示します
          <div className="prose prose-slate max-w-none text-slate-600 leading-loose" dangerouslySetInnerHTML={{ __html: item.body }} />
        ) : (
          <p className="text-slate-500 leading-loose">
            {item.client ? `${item.client}様への導入事例です。` : "この実績の詳細情報は、まだ登録されていません。"}
            microCMSの「showcase」に「body」フィールドを追加すると、ここに詳しいストーリーを表示できます。
          </p>
        )}

        <div className="mt-16 rounded-3xl border border-slate-200 bg-slate-50 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">同じような課題を解決したい</h3>
            <p className="mt-2 text-sm text-slate-500">貴社の状況に合わせて、専任チームがご提案いたします。</p>
          </div>
          <Button icon={ArrowRight} onClick={onGoContact} className="flex-shrink-0">
            ご相談する
          </Button>
        </div>
      </div>
    </div>
  );
}
