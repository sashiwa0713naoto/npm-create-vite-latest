import React from "react";
import { motion } from "framer-motion";

/**
 * 汎用ボタンコンポーネント
 * variant: "primary" | "outline" | "ghost"
 * サイズ: "md" | "sm"
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  className = "",
  ...props
}) {
  const base =
    "relative inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-300 overflow-hidden";

  const sizes = {
    md: "px-7 py-3.5 text-sm",
    sm: "px-5 py-2.5 text-xs",
  };

  const variants = {
    primary:
      "bg-red-600 text-white shadow-[0_8px_24px_-8px_rgba(220,38,38,0.6)] hover:shadow-[0_12px_32px_-6px_rgba(220,38,38,0.75)] hover:-translate-y-0.5",
    outline:
      "border border-neutral-300 text-neutral-800 hover:border-red-500 hover:text-red-600 bg-white/60 backdrop-blur-sm",
    ghost:
      "text-neutral-600 hover:text-red-600 hover:bg-red-50",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {/* プライマリボタンのみ：ホバー時に光がすっと走るグラス発光エフェクト */}
      {variant === "primary" && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      )}
      {Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
