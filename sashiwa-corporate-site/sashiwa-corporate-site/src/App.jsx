import React, { useState, useEffect, useRef } from "react";
import {
  Cpu,
  BarChart3,
  Code,
  Shield,
  Lock,
  FileCheck,
  ArrowRight,
  ArrowDown,
  Menu,
  X,
  Mail,
  Building2,
  Users,
  Briefcase,
  MapPin,
  Calendar,
  Wallet,
  ChevronRight,
  ChevronDown,
  Send,
  Quote,
} from "lucide-react";

/* ============================================================================
   💡【編集ポイント】会社名の一元管理
   ここを変更すると、サイト内すべての「株式会社SASHIWA」表記が一括で変わります。
============================================================================ */
const COMPANY_NAME = "株式会社SASHIWA";
const COMPANY_NAME_EN = "SASHIWA.inc";

/* ============================================================================
   💡【編集ポイント】ナビゲーションメニュー
============================================================================ */
const NAV_LINKS = [
  { id: "home", label: "トップ" },
  { id: "services", label: "サービス" },
  { id: "about", label: "会社概要" },
];

/* 💡【編集ポイント】提供サービス一覧
   新しいサービスを追加・変更する場合は、この配列の中身を編集してください。
   image は写真のURLです。今はデモ用のプレースホルダー画像を入れていますが、
   実際の業務写真やイメージ画像が用意できたら、このURLを差し替えるだけで
   サイト上の画像がすべて自動的に切り替わります。 */
const SERVICES_DATA = [
  {
    id: "svc-01",
    no: "01",
    icon: Cpu,
    label: "Smart Operation",
    title: "AI業務効率化・LLM導入支援",
    image: "https://picsum.photos/seed/sashiwa-operation/900/700",
    body:
      "最新の生成AIを活用し、稟議・議事録作成・カスタマー対応など日々の業務を自動化します。ツールを導入して終わりにせず、現場のワークフローに合わせた設計から定着化までを一貫してご支援します。属人化していた業務の棚卸しを行い、社内向けLLM環境の構築・運用体制づくりまで伴走いたします。",
  },
  {
    id: "svc-02",
    no: "02",
    icon: BarChart3,
    label: "Smart Analytics",
    title: "予測データ分析コンサルティング",
    image: "https://picsum.photos/seed/sashiwa-analytics/900/700",
    body:
      "高度な統計・機械学習アルゴリズムにより、経営データを可視化し、未来の意思決定を支える予測基盤を構築します。需要予測や異常検知モデルの開発から、経営指標のダッシュボード化、定期的なレポーティング体制の整備まで、データドリブンな経営を実現するための土台をつくります。",
  },
  {
    id: "svc-03",
    no: "03",
    icon: Code,
    label: "Smart Development",
    title: "カスタムAI・受託システム開発",
    image: "https://picsum.photos/seed/sashiwa-development/900/700",
    body:
      "企業固有の課題に真正面から向き合い、既製品では対応できない専用AIモデルとシステムを設計・開発します。要件定義から実装、既存システムとのAPI連携、リリース後の保守・継続改善まで、ワンストップで対応いたします。",
  },
];

/* ============================================================================
   💡【編集ポイント】会社概要データ
============================================================================ */
const COMPANY_PROFILE = {
  established: "2026年（予定）",
  capital: "10,000,000円（予定）",
  address: "東京都渋谷区渋谷二丁目21番1号 渋谷ヒカリエ 28階（予定）",
  representative: "代表取締役CEO　指輪　直人（予定）",
  business: "AIソリューション開発、LLM活用支援、データ分析コンサルティング",
  partners: ["各種事業会社・スタートアップ（協議中）"],
};

/* ============================================================================
   💡【編集ポイント】セキュリティ・AI倫理方針
============================================================================ */
const ETHICS_AND_SECURITY = [
  {
    icon: Lock,
    title: "データ保護・セキュリティ方針",
    body:
      "お客様よりお預かりする機密情報および個人情報は、暗号化通信・アクセス権限の厳格な管理・定期的な脆弱性診断を通じて多層的に保護します。情報は業務遂行に必要な最小限の範囲でのみ取り扱い、第三者への提供は法令および契約に基づく場合を除き行いません。",
  },
  {
    icon: Shield,
    title: "AI倫理ガイドライン",
    body:
      "私たちは、AIの出力に対して常に人による確認と説明責任を保持する「Human in the Loop」を原則とします。学習データの偏りや誤情報のリスクを継続的に検証し、公平性・透明性・説明可能性を欠いたAI実装は行いません。",
  },
  {
    icon: FileCheck,
    title: "コンプライアンス体制",
    body:
      "個人情報保護法をはじめとする関連法令を遵守し、社内規程および委託先管理規程に基づく監査体制を整備します。お客様との契約に定めるセキュリティ要件には、専任担当者が責任を持って対応します。",
  },
];

/* 💡【編集ポイント】その他の写真・画像
   About（会社紹介）セクションとHero下のバナーで使う画像です。
   今はデモ用のプレースホルダー画像を入れていますが、実際の写真が
   用意できたら、このURLを差し替えるだけでサイト上の画像が切り替わります。 */
const ABOUT_IMAGE = "https://picsum.photos/seed/sashiwa-team/1000/1300";
const HERO_BANNER_IMAGE = "https://picsum.photos/seed/sashiwa-technology/1600/1000";

/* 💡【編集ポイント】お問い合わせ件名の選択肢はこの配列を編集してください */
const CONTACT_SUBJECTS = [
  "AI導入について",
  "データ分析コンサルティングについて",
  "受託開発のご依頼",
  "取材・登壇のご依頼",
  "採用について",
  "その他",
];

/* ============================================================================
   🎨 プレミアムなタイポグラフィのための書体読み込み
   見出しの飾り数字などに上質なセリフ体を使い、高級感を演出しています。
============================================================================ */
function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400&display=swap');
      .font-display { font-family: 'Newsreader', Georgia, serif; }
    `}</style>
  );
}

/* ============================================================================
   🛠️【コンポーネント】Header
============================================================================ */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "shadow-[0_1px_0_0_rgba(15,23,42,0.06)]" : ""
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between h-20 sm:h-24">
          <button
            onClick={() => scrollTo("home")}
            className="flex items-baseline gap-2.5"
          >
            <span className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800" />
            <span className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">
              {COMPANY_NAME_EN}
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-[13px] font-medium tracking-wide text-neutral-500 transition-colors duration-300 hover:text-neutral-900"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo("contact")}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-900 px-6 py-2.5 text-[13px] font-medium tracking-wide text-neutral-900 transition-all duration-300 hover:bg-neutral-900 hover:text-white"
            >
              お問合わせ
            </button>
          </nav>

          <button
            className="md:hidden text-neutral-900 p-2"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="メニューを開く"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white px-6 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="block w-full text-left px-3 py-3 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-all duration-300"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo("contact")}
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white"
          >
            お問合わせ
          </button>
        </div>
      )}
    </header>
  );
}

/* ============================================================================
   🛠️【コンポーネント】Hero
============================================================================ */
function Hero() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative bg-white overflow-hidden">
      {/* 高級感を出すための、極めて淡いメッシュグラデーション背景 */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 right-0 h-[36rem] w-[36rem] rounded-full opacity-[0.35]"
          style={{
            background:
              "radial-gradient(circle, rgba(30,58,138,0.10) 0%, rgba(30,58,138,0) 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15,23,42,0.035) 1px, transparent 1px)",
            backgroundSize: "120px 100%",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-14 pt-20 sm:pt-28 pb-20 sm:pb-24">
        <div className="flex items-center gap-3 mb-8">
          <span className="h-px w-10 bg-neutral-300" />
          <p className="text-[11px] sm:text-xs font-medium tracking-[0.2em] text-neutral-500 uppercase">
            Next-Generation AI Solutions
          </p>
        </div>

        <h1 className="text-[2.75rem] sm:text-6xl lg:text-7xl font-display italic font-medium leading-[1.08] tracking-tight text-neutral-900 max-w-4xl">
          AIで、ビジネスの
          <br className="hidden sm:block" />
          限界を超える。
        </h1>

        <p className="mt-8 text-base sm:text-lg text-neutral-500 leading-relaxed max-w-xl font-light">
          {COMPANY_NAME}は、最先端のLLM技術とデータ分析力を武器に、企業の意思決定と業務のあり方を根本から再設計する次世代AIソリューションカンパニーです。構想から実装、運用まで、確かな技術力で伴走します。
        </p>

        <div className="mt-11 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => scrollTo("contact")}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-8 py-4 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] transition-all duration-300 hover:shadow-[0_12px_32px_-8px_rgba(15,23,42,0.6)] hover:-translate-y-0.5"
          >
            お問い合わせ・無料相談
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={() => scrollTo("services")}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 px-8 py-4 text-sm font-medium text-neutral-700 transition-all duration-300 hover:border-neutral-900 hover:text-neutral-900"
          >
            サービスを見る
          </button>
        </div>

        {/* 統計ストリップ：飾り数字にセリフ体を使い、上質さを演出 */}
        <div className="mt-20 sm:mt-24 grid grid-cols-2 gap-6 sm:gap-12 max-w-md border-t border-neutral-200 pt-10">
          {[
            { value: "2026", unit: "", label: "設立予定" },
            { value: "3", unit: "領域", label: "コア事業" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-display italic text-3xl sm:text-4xl text-neutral-900">
                {stat.value}
                <span className="text-base not-italic text-neutral-400 ml-1">
                  {stat.unit}
                </span>
              </p>
              <p className="mt-2 text-[11px] sm:text-xs tracking-wide text-neutral-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 💡【編集ポイント】AIビジュアルバナー：外部画像は使わずSVGでネットワーク図を表現 */}
      <AIBanner />
    </section>
  );
}

/* 🛠️【サブコンポーネント】AIBanner：デモ写真＋発光するネットワーク図を組み合わせた演出
   💡【編集ポイント】HERO_BANNER_IMAGE定数のURLを差し替えると、この背景写真が変わります。 */
function AIBanner() {
  const nodes = [
    { x: 60, y: 40 }, { x: 130, y: 90 }, { x: 90, y: 150 },
    { x: 190, y: 60 }, { x: 230, y: 130 }, { x: 170, y: 190 },
    { x: 280, y: 90 }, { x: 320, y: 170 }, { x: 260, y: 220 },
    { x: 370, y: 60 }, { x: 400, y: 150 },
  ];
  const edges = [
    [0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [2, 5],
    [4, 6], [6, 7], [7, 8], [5, 8], [6, 9], [9, 10], [7, 10],
  ];

  return (
    <div className="relative w-full overflow-hidden bg-[#0a1128]" style={{ minHeight: "24rem" }}>
      {/* 背景の写真（デモ画像） */}
      <img
        src={HERO_BANNER_IMAGE}
        alt="AIとテクノロジーのイメージ"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1128]/95 via-[#0d1b3a]/90 to-[#0a1128]/95" />
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(56,189,248,0.12), transparent 40%), radial-gradient(circle at 85% 80%, rgba(99,102,241,0.12), transparent 40%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8 py-16 sm:py-24">
          <div>
            <p className="text-[11px] font-medium tracking-[0.25em] text-sky-400/80 uppercase mb-4">
              Powered by Intelligence
            </p>
            <span className="font-display italic text-6xl sm:text-7xl font-medium bg-gradient-to-r from-sky-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              AI
            </span>
            <p className="mt-5 text-neutral-300 text-sm sm:text-base leading-relaxed max-w-sm font-light">
              データとテクノロジーを繋ぎ、ビジネスに新しい知能を実装する。{COMPANY_NAME}が描くのは、AIが当たり前に現場で働く未来です。
            </p>
          </div>
          <div className="relative h-64 sm:h-80">
            <svg
              viewBox="0 0 440 260"
              className="absolute inset-0 h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              {edges.map(([a, b], i) => (
                <line
                  key={i}
                  x1={nodes[a].x}
                  y1={nodes[a].y}
                  x2={nodes[b].x}
                  y2={nodes[b].y}
                  stroke="rgba(125,211,252,0.3)"
                  strokeWidth="0.75"
                />
              ))}
              {nodes.map((n, i) => (
                <circle
                  key={i}
                  cx={n.x}
                  cy={n.y}
                  r={i % 3 === 0 ? 5.5 : 3}
                  fill={i % 3 === 0 ? "#7dd3fc" : "#a5b4fc"}
                  opacity={i % 3 === 0 ? 1 : 0.6}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   🛠️【コンポーネント】Services
============================================================================ */
function Services() {
  return (
    <section id="services" className="relative bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <div className="flex items-center gap-3 mb-5">
          <span className="h-px w-10 bg-neutral-300" />
          <p className="text-[11px] font-medium tracking-[0.2em] text-neutral-500 uppercase">
            Features
          </p>
        </div>
        <h2 className="font-display italic text-4xl sm:text-5xl font-medium text-neutral-900 tracking-tight max-w-xl">
          サービスの特徴
        </h2>

        {/* 💡 SERVICES_DATA配列をループして各サービスのブロックを自動生成しています */}
        <div className="mt-20 sm:mt-24 divide-y divide-neutral-200">
          {SERVICES_DATA.map((service, i) => {
            const Icon = service.icon;
            const imageFirst = i % 2 === 0;
            return (
              <div
                key={service.id}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center py-14 sm:py-16 first:pt-0 last:pb-0"
              >
                <div
                  className={`relative aspect-[4/3] rounded-3xl overflow-hidden bg-[#0a1128] ${
                    imageFirst ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  {/* 💡 サービスの写真：SERVICES_DATA配列のimageフィールドを差し替えると更新されます */}
                  <img
                    src={service.image}
                    alt={service.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      background:
                        "linear-gradient(160deg, rgba(10,17,40,0.85) 0%, rgba(10,17,40,0.35) 55%, rgba(10,17,40,0.75) 100%)",
                    }}
                  />
                  <span className="font-display italic absolute top-6 left-7 text-white/40 text-7xl">
                    {service.no}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                      <Icon className="h-8 w-8 text-sky-200" strokeWidth={1.3} />
                    </div>
                  </div>
                </div>

                <div className={imageFirst ? "lg:order-2" : "lg:order-1"}>
                  <p className="text-xs font-medium tracking-[0.2em] text-blue-800/70 uppercase mb-3">
                    {service.label}
                  </p>
                  <h3 className="text-2xl sm:text-[1.9rem] font-semibold text-neutral-900 tracking-tight">
                    {service.title}
                  </h3>
                  <p className="mt-5 text-neutral-500 leading-loose text-sm sm:text-[15px] font-light">
                    {service.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   🛠️【コンポーネント】About
============================================================================ */
function About() {
  return (
    <section className="relative bg-[#faf9f7] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-5">
              <span className="h-px w-10 bg-neutral-300" />
              <p className="text-[11px] font-medium tracking-[0.2em] text-neutral-500 uppercase">
                About &amp; Vision
              </p>
            </div>
            <h2 className="font-display italic text-3xl sm:text-4xl font-medium text-neutral-900 tracking-tight leading-tight">
              確かな技術力で、
              AIの可能性を社会実装する。
            </h2>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {["技術への誠実さ", "現場主義", "AIの民主化", "スピードと信頼"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-[11px] text-neutral-500"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>

            <Quote className="h-8 w-8 text-neutral-300 mt-10 mb-4" strokeWidth={1.2} />
            <p className="font-display italic text-xl sm:text-2xl text-neutral-800 leading-relaxed max-w-2xl">
              AI技術を一部の専門家だけのものにせず、あらゆる企業が当たり前に使いこなせる状態へ。
            </p>

            <div className="mt-10 space-y-5 text-neutral-500 leading-loose text-sm sm:text-[15px] font-light max-w-2xl">
              <p>
                {COMPANY_NAME}は、次世代のAIソリューションを提供する専業カンパニーとして立ち上がりました。現場で磨き上げたAI実装のノウハウをもとに、より大胆に、より速く、AIの可能性を社会実装していくことを使命としています。
              </p>
              <p>
                私たちが目指すのは、AI技術を一部の専門家だけのものにせず、あらゆる企業が当たり前に使いこなせる状態、すなわち「AI技術の民主化」です。
              </p>
              <p>
                知的好奇心と誠実さを両輪に、クライアント一社一社の課題に真摯に向き合う。それが、これから築いていく{COMPANY_NAME}のブランドそのものです。
              </p>
            </div>
          </div>

          {/* 💡 会社紹介の写真：ABOUT_IMAGE定数のURLを差し替えると更新されます */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">
              <img
                src={ABOUT_IMAGE}
                alt={`${COMPANY_NAME}のチームイメージ`}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   🛠️【コンポーネント】CompanyProfile
============================================================================ */
function CompanyProfile() {
  const rows = [
    { icon: Calendar, label: "設立", value: COMPANY_PROFILE.established },
    { icon: Wallet, label: "資本金", value: COMPANY_PROFILE.capital },
    { icon: MapPin, label: "所在地", value: COMPANY_PROFILE.address },
    { icon: Users, label: "代表者", value: COMPANY_PROFILE.representative },
    { icon: Briefcase, label: "事業内容", value: COMPANY_PROFILE.business },
  ];

  return (
    <section id="about" className="relative bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <div className="flex items-center gap-3 mb-5">
          <span className="h-px w-10 bg-neutral-300" />
          <p className="text-[11px] font-medium tracking-[0.2em] text-neutral-500 uppercase">
            Company Profile
          </p>
        </div>
        <h2 className="font-display italic text-4xl sm:text-5xl font-medium text-neutral-900 tracking-tight">
          会社概要
        </h2>

        <div className="mt-16 border-t border-neutral-200">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.label}
                className="group flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-8 py-6 border-b border-neutral-200 transition-colors duration-300 hover:bg-neutral-50/60"
              >
                <div className="flex items-center gap-2.5 sm:w-40 flex-shrink-0">
                  <Icon className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
                  <span className="text-[13px] font-medium tracking-wide text-neutral-500">
                    {row.label}
                  </span>
                </div>
                <p className="text-sm sm:text-[15px] text-neutral-900 leading-relaxed">
                  {row.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-12">
          <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.2em] mb-4">
            主要取引先（予定）
          </p>
          <div className="flex flex-wrap gap-2.5">
            {COMPANY_PROFILE.partners.map((partner) => (
              <span
                key={partner}
                className="rounded-full border border-neutral-200 bg-[#faf9f7] px-4 py-2 text-xs text-neutral-600"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   🛠️【コンポーネント】SecurityEthics
============================================================================ */
function SecurityEthics() {
  return (
    <section className="relative bg-[#faf9f7] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-5">
            <span className="h-px w-10 bg-neutral-300" />
            <p className="text-[11px] font-medium tracking-[0.2em] text-neutral-500 uppercase">
              Security &amp; Ethics
            </p>
          </div>
          <h2 className="font-display italic text-4xl sm:text-5xl font-medium text-neutral-900 tracking-tight">
            AIセキュリティ・倫理方針
          </h2>
          <p className="mt-5 text-neutral-500 leading-relaxed font-light">
            AIを社会に実装する企業として、安全性と誠実さを何よりも重視します。
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {ETHICS_AND_SECURITY.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-neutral-200 bg-white p-8 transition-all duration-300 hover:shadow-[0_20px_40px_-16px_rgba(15,23,42,0.12)] hover:-translate-y-1"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0a1128]">
                  <Icon className="h-5 w-5 text-sky-300" strokeWidth={1.5} />
                </div>
                <h3 className="mt-6 text-base font-semibold text-neutral-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-neutral-500 leading-relaxed font-light">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   🛠️【コンポーネント】Contact
   ※すべての入力欄はReactのuseStateで値を管理する「制御コンポーネント」です。
============================================================================ */
function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    subject: CONTACT_SUBJECTS[0],
    message: "",
    agree: false,
  });
  const [subjectOpen, setSubjectOpen] = useState(false);
  const subjectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (subjectRef.current && !subjectRef.current.contains(e.target)) {
        setSubjectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateField = (field) => (e) => {
    const value = field === "agree" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputClass =
    "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all duration-200 focus:border-neutral-900 focus:ring-4 focus:ring-neutral-100";

  return (
    <section id="contact" className="relative bg-white">
      <div className="bg-[#0a1128] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
            <Mail className="h-6 w-6 text-sky-300" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-display italic text-2xl sm:text-3xl font-medium text-white">
              お問い合わせ・無料相談
            </h2>
            <p className="mt-2 text-sm text-neutral-400 font-light">
              AI導入のご相談から、開発案件のご依頼まで。まずはお気軽にお問い合わせください。
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 sm:px-10 lg:px-14 py-20 sm:py-24">
        {submitted ? (
          <div className="rounded-2xl border border-neutral-200 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0a1128]">
              <Send className="h-6 w-6 text-white" />
            </div>
            <h3 className="mt-6 font-display italic text-lg text-neutral-900">
              お問い合わせありがとうございます
            </h3>
            <p className="mt-2 text-sm text-neutral-500 font-light">
              内容を確認の上、担当者よりご連絡いたします。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
              <div>
                <label className="block text-[13px] font-medium text-neutral-600 mb-2.5">
                  お名前
                </label>
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
                <label className="block text-[13px] font-medium text-neutral-600 mb-2.5">
                  貴社名
                </label>
                <input
                  type="text"
                  autoComplete="organization"
                  placeholder="株式会社〇〇"
                  value={formData.company}
                  onChange={updateField("company")}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-neutral-600 mb-2.5">
                メールアドレス
              </label>
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

            <div className="relative" ref={subjectRef}>
              <label className="block text-[13px] font-medium text-neutral-600 mb-2.5">
                お問い合わせ件名
              </label>
              <button
                type="button"
                onClick={() => setSubjectOpen((v) => !v)}
                className={`${inputClass} flex items-center justify-between text-left`}
              >
                <span>{formData.subject}</span>
                <ChevronDown
                  className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${
                    subjectOpen ? "rotate-180" : ""
                  }`}
                />
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
                        formData.subject === subject
                          ? "bg-neutral-100 text-neutral-900 font-medium"
                          : "text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-neutral-600 mb-2.5">
                お問い合わせ内容
              </label>
              <textarea
                required
                rows={5}
                placeholder="ご相談内容の詳細をご記入ください。"
                value={formData.message}
                onChange={updateField("message")}
                className={`${inputClass} resize-none`}
              />
            </div>

            <label className="flex items-start gap-3 text-xs text-neutral-500">
              <input
                type="checkbox"
                required
                checked={formData.agree}
                onChange={updateField("agree")}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-neutral-900"
              />
              <span>プライバシーポリシーの内容に同意の上、送信します。</span>
            </label>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-7 py-4 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(15,23,42,0.5)] transition-all duration-300 hover:shadow-[0_12px_32px_-8px_rgba(15,23,42,0.6)] hover:-translate-y-0.5"
            >
              送信する
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

/* ============================================================================
   🛠️【コンポーネント】Footer：濃紺背景で引き締め、高級感を演出
============================================================================ */
function Footer() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[#0a1128] pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <span className="font-display italic text-xl text-white">
              {COMPANY_NAME_EN}
            </span>
            <p className="mt-4 text-sm text-neutral-400 leading-relaxed max-w-xs font-light">
              {COMPANY_NAME}。AI技術の民主化を通じて、社会に変革をもたらす次世代AIソリューションカンパニー。
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.2em] mb-5">
              Sitemap
            </p>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => scrollTo(link.id)}
                    className="text-sm text-neutral-300 hover:text-white transition-colors duration-300"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.2em] mb-5">
              Career
            </p>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-white font-medium">We are hiring!</p>
              <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed font-light">
                私たちと一緒にAIの未来をつくりませんか。採用情報は準備中です。
              </p>
              <button
                onClick={() => scrollTo("contact")}
                className="mt-3.5 inline-flex items-center gap-1 text-xs font-medium text-sky-300 hover:text-sky-200"
              >
                お問い合わせはこちら <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-7 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">
            © 2026 {COMPANY_NAME} All Rights Reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Mail className="h-3.5 w-3.5" />
            contact@sashiwa.example.com
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================================
   🚀 App：全コンポーネントを順序どおりに呼び出します
============================================================================ */
export default function App() {
  return (
    <div className="min-h-screen bg-white antialiased" style={{ fontFamily: "'Hiragino Sans', 'Yu Gothic', sans-serif" }}>
      <FontLoader />
      <Header />
      <Hero />
      <Services />
      <About />
      <CompanyProfile />
      <SecurityEthics />
      <Contact />
      <Footer />
    </div>
  );
}
