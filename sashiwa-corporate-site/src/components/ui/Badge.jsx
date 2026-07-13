import React from "react";

/**
 * 汎用バッジコンポーネント
 * variant:
 *   "default"    … グレーの通常バッジ（カテゴリ表示など）
 *   "ai"         … 赤系の「✨AI自動生成」用バッジ
 *   "status"     … 稼働ステータス表示（緑の点滅ドット付き）
 *   "outline"    … 枠線のみの控えめなバッジ
 */
export default function Badge({ children, variant = "default", pulse = false, className = "" }) {
  const variants = {
    default: "bg-neutral-100 text-neutral-600 border border-neutral-200",
    ai: "bg-red-50 text-red-600 border border-red-200",
    status: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    outline: "bg-white text-neutral-500 border border-neutral-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${variants[variant]} ${className}`}
    >
      {pulse && <span className="status-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />}
      {children}
    </span>
  );
}
