import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Button from "../ui/Button.jsx";

/* 💡 Servicesカードをクリックした先の詳細ページです。
   データはServices.jsxのSERVICES_DATA配列から渡されます。 */
export default function ServiceDetail({ service, onBack, onGoContact }) {
  const Icon = service.icon;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-14 pt-10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-red-600 transition-colors duration-300"
        >
          <ArrowLeft className="h-4 w-4" />
          サービス一覧に戻る
        </button>
      </div>

      <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-14 pt-8 pb-4">
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-red-600">{service.label}</p>
        <h1 className="mt-3 text-3xl sm:text-5xl font-black text-neutral-950 tracking-tight leading-tight">
          {service.title}
        </h1>
      </div>

      <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-14">
        <div className="relative aspect-[16/7] rounded-3xl overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)]">
          <img src={service.image} alt={service.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
          <div className="absolute bottom-6 left-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/25">
            <Icon className="h-6 w-6 text-white" strokeWidth={1.4} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 sm:px-10 lg:px-14 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <p className="text-neutral-600 leading-loose text-base">{service.detail || service.body}</p>
          </div>

          {service.steps && (
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-[0.2em] mb-4">ご支援の流れ</p>
              <div className="space-y-4">
                {service.steps.map((step, i) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
                      {i + 1}
                    </div>
                    <p className="text-sm text-neutral-700 leading-relaxed pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-16 rounded-3xl border border-neutral-200 bg-neutral-50 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black text-neutral-950">このサービスについて相談する</h3>
            <p className="mt-2 text-sm text-neutral-500">導入のご相談から概算のお見積りまで、AIエージェントが対応します。</p>
          </div>
          <Button icon={ArrowRight} onClick={onGoContact} className="flex-shrink-0">
            AIエージェントに相談する
          </Button>
        </div>
      </div>
    </div>
  );
}
