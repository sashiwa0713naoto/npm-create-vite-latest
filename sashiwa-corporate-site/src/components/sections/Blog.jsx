import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowUpRight } from "lucide-react";
import Badge from "../ui/Badge.jsx";

/* ============================================================================
   💡 モックAPI：将来的にはmicroCMSの実APIに置き換える想定です。
   レスポンス形式は以下のmicroCMS標準形式に準拠しています。
   { contents: [ { id, publishedAt, title, category: { name }, eyecatch: { url } } ] }
============================================================================ */
function fetchBlogMock() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        contents: [
          {
            id: "blog-001",
            publishedAt: "2026-07-09T09:00:00.000Z",
            title: "AIエージェント組織の作り方：人が介在しない業務設計の勘所",
            category: { name: "組織論" },
            eyecatch: { url: "https://picsum.photos/seed/sashiwa-blog-01/700/500" },
            aiGenerated: true,
          },
          {
            id: "blog-002",
            publishedAt: "2026-07-05T09:00:00.000Z",
            title: "LLM導入で失敗する企業の3つの共通点",
            category: { name: "ナレッジ" },
            eyecatch: { url: "https://picsum.photos/seed/sashiwa-blog-02/700/500" },
            aiGenerated: true,
          },
          {
            id: "blog-003",
            publishedAt: "2026-06-30T09:00:00.000Z",
            title: "予測データ分析を経営に定着させるダッシュボード設計",
            category: { name: "データ分析" },
            eyecatch: { url: "https://picsum.photos/seed/sashiwa-blog-03/700/500" },
            aiGenerated: false,
          },
        ],
      });
    }, 1500);
  });
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function BlogSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[7/5] rounded-2xl bg-neutral-100" />
          <div className="mt-4 h-3 w-20 rounded bg-neutral-100" />
          <div className="mt-2 h-4 w-full rounded bg-neutral-100" />
          <div className="mt-2 h-4 w-2/3 rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

export default function Blog() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchBlogMock().then((res) => {
      if (!mounted) return;
      setItems(res.contents);
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="blog" className="relative bg-neutral-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline">Blog</Badge>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-neutral-950">ブログ</h2>
          <p className="mt-3 text-sm text-neutral-400">Auto Curated — AIエージェントが選定・執筆・更新までを自動化しています。</p>
        </motion.div>

        <div className="mt-12">
          {isLoading ? (
            <BlogSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
              {items.map((item, i) => (
                <motion.a
                  key={item.id}
                  href="#"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -5 }}
                  className="group block"
                >
                  <div className="relative aspect-[7/5] overflow-hidden rounded-2xl">
                    <img
                      src={item.eyecatch.url}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-neutral-400">{formatDate(item.publishedAt)}</span>
                    <Badge variant="default">{item.category.name}</Badge>
                    {item.aiGenerated && (
                      <Badge variant="ai">
                        <Sparkles className="h-2.5 w-2.5" />
                        Auto Curated
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-2 text-base font-bold text-neutral-950 leading-snug group-hover:text-red-600 transition-colors">
                    {item.title}
                  </h3>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 group-hover:text-red-600 transition-colors">
                    続きを読む
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
