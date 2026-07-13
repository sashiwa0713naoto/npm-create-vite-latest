import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowUpRight } from "lucide-react";
import Badge from "../ui/Badge.jsx";

/* ============================================================================
   💡 モックAPI：将来的にはmicroCMSの実APIに置き換える想定です。
   レスポンス形式は以下のmicroCMS標準形式に準拠しています。
   { contents: [ { id, publishedAt, title, category: { name }, eyecatch: { url } } ] }
============================================================================ */
function fetchNewsMock() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        contents: [
          {
            id: "news-001",
            publishedAt: "2026-07-10T09:00:00.000Z",
            title: "Video Generation Engineがレンダリング速度を40%改善",
            category: { name: "プロダクト" },
            eyecatch: { url: "https://picsum.photos/seed/sashiwa-news-01/200/200" },
            aiGenerated: true,
          },
          {
            id: "news-002",
            publishedAt: "2026-07-08T09:00:00.000Z",
            title: "Security & Ethics AIによる自動監査レポートを公開",
            category: { name: "セキュリティ" },
            eyecatch: { url: "https://picsum.photos/seed/sashiwa-news-02/200/200" },
            aiGenerated: false,
          },
          {
            id: "news-003",
            publishedAt: "2026-07-03T09:00:00.000Z",
            title: "Creative Director AIが新しい企画テンプレートを自己学習",
            category: { name: "アップデート" },
            eyecatch: { url: "https://picsum.photos/seed/sashiwa-news-03/200/200" },
            aiGenerated: true,
          },
          {
            id: "news-004",
            publishedAt: "2026-06-28T09:00:00.000Z",
            title: "CEO AIによる2026年第2四半期の振り返りレポート",
            category: { name: "経営" },
            eyecatch: { url: "https://picsum.photos/seed/sashiwa-news-04/200/200" },
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

function NewsSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-5 py-5 border-b border-neutral-200 animate-pulse">
          <div className="h-14 w-14 rounded-xl bg-neutral-100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-neutral-100" />
            <div className="h-4 w-2/3 rounded bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function News() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchNewsMock().then((res) => {
      if (!mounted) return;
      setItems(res.contents);
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="news" className="relative bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 sm:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline">News</Badge>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-neutral-950">お知らせ</h2>
          <p className="mt-3 text-sm text-neutral-400">
            このセクションはAIエージェントが自動収集・自動更新しています（microCMS連携想定）。
          </p>
        </motion.div>

        <div className="mt-12">
          {isLoading ? (
            <NewsSkeleton />
          ) : (
            items.map((item, i) => (
              <motion.a
                key={item.id}
                href="#"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group flex items-center gap-5 py-5 border-b border-neutral-200 transition-colors duration-300 hover:bg-neutral-50"
              >
                <img src={item.eyecatch.url} alt={item.title} className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-neutral-400">{formatDate(item.publishedAt)}</span>
                    <Badge variant="default">{item.category.name}</Badge>
                    {item.aiGenerated && (
                      <Badge variant="ai">
                        <Sparkles className="h-2.5 w-2.5" />
                        AI自動生成
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-neutral-900 truncate group-hover:text-red-600 transition-colors">
                    {item.title}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-neutral-300 flex-shrink-0 transition-all duration-300 group-hover:text-red-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </motion.a>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
