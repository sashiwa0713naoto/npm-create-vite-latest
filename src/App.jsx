import React, { useState, useEffect, useRef, useCallback } from "react";
import Dashboard from "./Dashboard.jsx";

/* ============================================================================
   株式会社SASHIWA — コーポレートサイト（複数ページ構成）

   ページ：home / business（一覧）/ business-detail（3種）/ flow / blog /
           company / contact
   ルーティング：URLハッシュ（例 #/business/agent）。React Router 不要、
                 Vercel の設定変更も不要です。

   ★ 変更禁止：Contact の WEBHOOK_URL と payload のキー
     （client_name / client_email / message）は Make 側の規格です。

   ★ 差し替え箇所
     - POSTS：記事データ（microCMS 連携時はここを置き換え）
     - COMPANY：「準備中」の項目
     - STATS：実数が出たら更新
   ============================================================================ */

const WEBHOOK_URL = "https://hook.us2.make.com/umnotcrw2pg8twacx68irmjcnnzyjmwv";

/* ---------------------------------------------------------------- データ */

const BUSINESSES = [
  {
    slug: "agent",
    code: "AGENT",
    no: "BUSINESS 01",
    en: "AI EMPLOYEE",
    title: "AI社員構築代行",
    sub: "仕組みをつくって、御社に置く",
    theme: "#E0402F",
    soft: "#FDECEA",
    lede: "御社の業務を処理するAI社員を設計・実装し、実務が人の手を離れて回る状態にします。",
    price: "初期構築 30万円〜",
    icon: "robot",
    detail: {
      what:
        "社内の判断基準・商品知識・業務手順を、AIが読める形に整理します（ナレッジ基盤）。その上に、部門ごとの役割を持たせたAIエージェント＝「AI社員」を設計・実装し、実務が回りはじめるところまでを請け負います。ツールの導入やプロンプトの受け渡しでは終わりません。",
      points: [
        { t: "ナレッジ基盤をつくる", d: "社内の暗黙知を、AIが参照できるドキュメントに変換します。" },
        { t: "役割を持たせて実装する", d: "部門ごとに担当と権限を定義し、エージェントとして動かします。" },
        { t: "検査工程を必ず挟む", d: "別のAIが品質と表現リスクを確認してから、外に出します。" },
      ],
      plans: [
        { n: "スモール構築", d: "業務1つ分のAI社員を設計・実装します。まず1箇所を自動化して効果を確かめたい方向け。", p: "30万円〜" },
        { n: "標準構築", d: "部門単位で複数のAI社員と、それらをつなぐ処理の流れまで構築します。", p: "50万円〜" },
        { n: "フル構築", d: "全社の業務棚卸しから設計・実装・稼働後の伴走までを一貫して行います。", p: "80万円〜" },
      ],
      deliver: ["業務棚卸しレポート", "AI社員の設計書", "ナレッジ基盤の構築", "稼働環境の実装", "運用手順書"],
      span: "初期構築 約2〜4週間 ／ 納品後3ヶ月の伴走",
    },
  },
  {
    slug: "studio",
    code: "STUDIO",
    no: "BUSINESS 02",
    en: "AUTO PRODUCTION",
    title: "文書・動画 自動制作",
    sub: "成果物そのものを、つくって納品する",
    theme: "#2456C8",
    soft: "#E8EEFB",
    lede: "記事・資料・マニュアル・動画を、企画から仕上げまでAIが一貫して制作し、完成物としてお渡しします。",
    price: "月額 4万円〜／単発 1.2万円〜",
    icon: "studio",
    detail: {
      what:
        "毎回だれかが手を動かして作っている制作物を、SASHIWAのAIエージェントが引き受けます。企画・構成の設計、本文や台本の執筆、表現上のリスク検査、体裁の整形までを一本の流れで処理し、そのまま使える完成物としてお渡しします。ライターや編集者の手配も、進捗の催促も発生しません。",
      points: [
        { t: "企画から仕上げまで一貫して", d: "テーマを渡すだけで、構成の設計から完成データまでが揃います。" },
        { t: "毎月止まらない", d: "担当者の繁忙や離職で制作が止まる、という事態が起きません。" },
        { t: "別のAIが検査する", d: "制作したAIとは別のAIが、事実関係と法令上の表現を一次スクリーニングします。" },
      ],
      menus: [
        {
          label: "文書制作",
          en: "DOCUMENT",
          icon: "pen",
          items: [
            { n: "SEO記事・オウンドメディア", d: "検索意図の分析から構成設計、本文執筆まで（2,000〜3,000字）", p: "12,000円／本" },
            { n: "営業資料・提案書", d: "訴求の整理から構成、本文まで。スライド原稿の形でお渡しします", p: "30,000円／式" },
            { n: "マニュアル・手順書", d: "口頭で説明している手順を、読んで分かる文書に整えます", p: "40,000円／式" },
            { n: "定例レポート", d: "毎月・毎週の報告書を、決まった書式で自動生成します", p: "月20,000円〜" },
          ],
        },
        {
          label: "動画制作",
          en: "VIDEO",
          icon: "film",
          items: [
            { n: "縦型ショート動画", d: "企画・台本・テロップ・書き出しまで自動処理（30〜60秒）", p: "20,000円／本", prep: true },
            { n: "解説動画", d: "横型2〜3分。スライドとナレーションを組み合わせた構成", p: "50,000円／本", prep: true },
          ],
        },
      ],
      plans: [
        { n: "ライト", d: "文書 月4本。まずは更新を止めない状態をつくりたい方向け。", p: "40,000円／月" },
        { n: "スタンダード", d: "文書 月8本。オウンドメディアを本格的に回す構成。", p: "72,000円／月" },
        { n: "フル", d: "文書 月16本＋コンテンツ設計。動画も組み合わせられます。", p: "128,000円／月" },
      ],
      deliver: ["完成データ（Google Docs／動画ファイル）", "構成・台本原稿", "想定キーワードと訴求の整理", "月次の制作実績レポート"],
      span: "初回納品 約1週間 ／ 以降は毎月の定期納品",
      note:
        "AIが生成した文章・映像には、事実の誤りが含まれる可能性があります。公開前の最終確認はお客様側で行っていただく前提です。検査工程は一次スクリーニングであり、内容の正確性を保証するものではありません。なお動画制作は、使用する音源・音声合成の商用利用条件を確認中のため、現在は事前相談のみ承っています。",
    },
  },
  {
    slug: "social",
    code: "SOCIAL",
    no: "BUSINESS 03",
    en: "24/365 SOCIAL",
    title: "SNSアカウント運用代行",
    sub: "24時間365日、止まらずに発信する",
    theme: "#7C5CD6",
    soft: "#F1EDFC",
    lede: "ネタ集めから執筆、画像、予約投稿まで。人が手を動かさなくても、毎日発信が続く状態をつくります。",
    price: "月額 6万円〜",
    icon: "social",
    detail: {
      what:
        "SNS運用が続かない理由は、才能ではなく時間です。ネタを探し、文章を書き、画像を用意し、投稿時間に間に合わせる。この一連の作業をAIエージェントが毎日引き受けます。加えて「どの媒体に何をどれだけ出すべきか」という設計そのものもAIが提案するため、方針を一から決める必要がありません。SASHIWA自身のアカウントも、同じ仕組みで運用しています。",
      points: [
        { t: "運用プランをAIが設計する", d: "業種・目的・使える時間から、どの媒体にどの形式で何本出すかをAIが提案します。ゼロから決める必要はありません。" },
        { t: "媒体ごとの仕様に沿って作る", d: "リールは冒頭1秒、TikTokは2秒、Xは1行目。媒体ごとの勝ち筋を制作条件に落とし込みます。" },
        { t: "毎日、決まった時刻に出る", d: "深夜でも休日でも、設定した時刻に投稿が予約配信されます。ネタ切れも起きません。" },
      ],
      steps: [
        { n: "01", t: "運用設計", d: "業種・目的・使える時間をうかがい、AIが媒体・形式・頻度・投稿時間・コンテンツの柱を提案します。ご一緒に調整して確定します。", s: "初回 約1週間" },
        { n: "02", t: "アカウント設定", d: "プロフィール文、固定投稿、リンク導線を整えます。何を発信するアカウントなのかが一目で伝わる状態にします。", s: "同上" },
        { n: "03", t: "制作と検査", d: "媒体ごとの仕様に沿って本文・画像を制作し、別のAIが表現と法令上のリスクを検査します。", s: "毎日" },
        { n: "04", t: "配信と改善", d: "決まった時刻に自動配信。月次で伸びた投稿の傾向を分析し、翌月の方針に反映します。", s: "毎日／月次" },
      ],
      menus: [
        {
          label: "運用対象",
          en: "PLATFORM",
          icon: "social",
          items: [
            { n: "X（旧Twitter）運用", d: "1日1〜5投稿。ネタ収集・執筆・予約投稿まで自動", p: "60,000円／月" },
            { n: "Instagram運用", d: "フィード・ストーリーズの企画から画像生成、予約投稿まで", p: "80,000円／月" },
            { n: "note・ブログ連携", d: "SNS投稿と連動した長文記事を定期公開", p: "40,000円／月" },
          ],
        },
        {
          label: "オプション",
          en: "OPTION",
          icon: "pen",
          items: [
            { n: "返信の下書き生成", d: "受信したコメントへの返信案を毎朝まとめてお渡しします", p: "20,000円／月" },
            { n: "月次分析レポート", d: "伸びた投稿の傾向を分析し、翌月の方針を提案", p: "20,000円／月" },
          ],
        },
      ],
      plans: [
        { n: "シングル", d: "1アカウント・毎日1投稿。まず1つ止めずに回したい方向け。", p: "60,000円／月" },
        { n: "マルチ", d: "3アカウント同時運用。プラットフォームをまたいで展開します。", p: "108,000円／月" },
        { n: "フル", d: "5アカウント＋返信下書き＋月次分析レポート。", p: "168,000円／月" },
      ],
      deliver: ["投稿カレンダー", "投稿本文・画像データ", "返信の下書き（オプション）", "月次の分析レポート"],
      span: "初期設計 約1週間 ／ 以降は毎日の自動投稿",
      note:
        "各SNSの利用規約は随時変更されます。自動投稿が規約に抵触しないかは運用開始前に確認し、変更があった場合は運用方法を見直します。フォロワーの購入は一切行いません。また、投稿の伸びは内容以外の要因にも左右されるため、フォロワー数や表示回数を保証するものではありません。アカウントの最終的な管理権限はお客様が保持します。",
    },
  },
];

const TASKS = [
  { icon: "mail", t: "問い合わせ対応", d: "受信を分類し、定型は自動返信。判断が要るものだけ人へ。" },
  { icon: "doc", t: "レポート作成", d: "各所の数字を集計し、決まった書式で自動配信。" },
  { icon: "sns", t: "SNS投稿", d: "企画・下書き・体裁チェック・予約投稿まで自動。" },
  { icon: "slide", t: "資料づくり", d: "提案書やセミナー資料を、構成から自動生成。" },
  { icon: "search", t: "社内検索", d: "マニュアルや過去案件を横断検索し、根拠つきで要約。" },
  { icon: "yen", t: "請求・経費処理", d: "書類を自動で仕分け・記録し、人は承認だけ。" },
];

const STATS = [
  { v: 365, u: "日", label: "止まらない稼働", suffix: "" },
  { v: 24, u: "時間", label: "依頼の受付・処理" },
  { v: 0, u: "名", label: "人間の従業員" },
  { v: 5, u: "体", label: "稼働中のAI社員" },
];

const MARQUEE = [
  "SNSアカウント運用",
  "SEO記事制作",
  "営業資料・提案書",
  "マニュアル作成",
  "動画の企画・台本",
  "問い合わせ一次対応",
  "定例レポート生成",
  "AI社員の設計・実装",
  "工数とコストの試算",
  "品質・倫理の検査",
];

const BEFORE_AFTER = [
  { before: "問い合わせに気づくのが翌朝", after: "届いた瞬間に解析が始まる" },
  { before: "レポートを毎週手作業で集計", after: "決まった時刻に配信されている" },
  { before: "資料の体裁チェックで半日", after: "別のAIが自動で検査する" },
  { before: "担当者が休むと業務が止まる", after: "24時間365日、止まらない" },
];

const AGENTS = [
  { code: "AG-01", name: "CEO_AI", role: "統括", mission: "依頼を読み解き、担当を決める", lead: true },
  { code: "AG-02", name: "Creative_PR_AI", role: "制作・広報", mission: "原稿・構成・デザイン方針" },
  { code: "AG-03", name: "Engineer_DevOps_AI", role: "技術・運用", mission: "実装・技術調査・稼働監視" },
  { code: "AG-04", name: "QA_Ethics_AI", role: "品質・倫理", mission: "成果物の検査とリスク確認" },
  { code: "AG-05", name: "CFO_Resource_AI", role: "原価・資源", mission: "工数の試算とコスト算出" },
];

const WORKFLOWS = [
  {
    time: "24時間",
    tag: "問い合わせ自動化",
    title: "送信された瞬間に、担当が決まっている",
    body:
      "フォーム送信をきっかけに処理が起動。統括AIが依頼文を構造化し、必要な作業を洗い出して担当を選定します。深夜でも土日でも、待ち時間はありません。",
    steps: ["受信", "要件の構造化", "担当の自動選定", "並行実行"],
  },
  {
    time: "納品前",
    tag: "検査と原価計算",
    title: "外に出る前に、必ず二重の確認が入る",
    body:
      "成果物ができた時点で、品質・倫理を担当するAIが内容を検査。同時に原価担当のAIが工数とコストを算出します。この2工程を通らないものは納品されません。",
    steps: ["成果物の受領", "品質・倫理検査", "工数試算", "差戻し／通過"],
  },
  {
    time: "毎日22:00",
    tag: "コンテンツ運用",
    title: "翌日の分が、寝ている間に用意される",
    body:
      "テーマの収集から下書き生成、体裁の調整、投稿予約までを自動で実行。人が行うのは最終確認だけという状態まで組み上げます。",
    steps: ["情報収集", "下書き生成", "体裁チェック", "予約配信"],
  },
];

const FLOW = [
  {
    n: "01",
    title: "無料相談（30分）",
    span: "オンライン",
    body: "いま手作業でやっていることをうかがい、AIに渡せそうな業務と、おおよその費用感をご案内します。",
  },
  {
    n: "02",
    title: "業務の棚卸し・設計",
    span: "1〜2週間",
    body: "業務の流れを整理し、効果の大きいものから優先順位をつけます。どのAI社員に何を任せるかを決めます。",
  },
  {
    n: "03",
    title: "ナレッジ整備と実装",
    span: "2〜4週間",
    body: "判断基準や手順をAIが読める形に整理し、エージェントとパイプラインを実装。実データで稼働テストを行います。",
  },
  {
    n: "04",
    title: "稼働開始と改善",
    span: "3ヶ月伴走",
    body: "狭い範囲から動かしはじめ、問題がなければ対象を広げます。定期ミーティングで調整を続けます。",
  },
];

const FAQ = [
  {
    q: "AI社員とは、何ですか？",
    a: "自社の判断基準・商品知識・業務手順をAIが読める形に整理したうえで、部門ごとに役割を持たせたAIエージェントのことです。毎回ゼロから前提を説明する単発のチャットとは違い、「この業務はこの担当に渡せばいい」という状態をつくります。",
  },
  {
    q: "どんな業務を任せられますか？",
    a: "問い合わせの一次対応、定例レポートの作成、社内資料の検索と要約、記事やSNS投稿の制作、データの集計と分析、請求・経費の処理。手順が言葉で説明できる業務であれば、ほとんどが対象になります。",
  },
  {
    q: "導入までどれくらいかかりますか？",
    a: "対象業務の洗い出しに1〜2週間、実装と稼働テストに2〜4週間が目安です。範囲を絞った小さな構成であれば、より短い期間で動かしはじめることもできます。",
  },
  {
    q: "納品したら終わりですか？",
    a: "納品後3ヶ月の伴走がつきます。定期のミーティングで稼働状況を確認し、任せる範囲を広げたり、精度を上げる調整を行います。",
  },
  {
    q: "費用はいくらですか？",
    a: "任せる業務の範囲と数によって変わるため、個別のお見積もりです。まずは30分の無料相談で、どの業務を渡せそうかと概算をご案内します。オンラインで全国対応しています。",
  },
  {
    q: "自社でChatGPTを使うのと、何が違いますか？",
    a: "毎回、前提の説明から始めなくて済むことです。会社の情報・商品・判断基準・過去の成果物をAIが参照できる状態にしておき、必要なときに必要な担当へ仕事を渡します。加えて、成果物は必ず別のAIが検査してから出てきます。",
  },
  {
    q: "預けた情報の扱いが心配です。",
    a: "ご提供いただいた資料やデータは、案件の対応にのみ使用します。モデルの学習用途への転用や、第三者への提供は行いません。処理の経過は記録として保全し、後から経緯を確認できる状態にしています。",
  },
];

const COMPANY = [
  { k: "商号", v: "株式会社SASHIWA", ready: true },
  { k: "代表者", v: "指輪直人", ready: true },
  { k: "従業員", v: "AIエージェント 5体（人間 0名）", ready: true },
  { k: "事業内容", v: "AI社員構築代行／文書・動画の自動制作", ready: true },
  { k: "対応地域", v: "オンラインで全国対応", ready: true },
  { k: "設立", v: "準備中", ready: false },
  { k: "資本金", v: "準備中", ready: false },
  { k: "所在地", v: "準備中", ready: false },
];

/* 記事データ。microCMS 連携時はここを API 取得結果に差し替えてください。
   形式：{ id, date, category, title, excerpt, url } */
const POSTS = [];

/* ---------------------------------------------------------------- ルート定義 */

const ROUTES = {
  home: { title: "株式会社SASHIWA｜社員は全員AI。AI社員構築代行" },
  business: { title: "事業内容｜株式会社SASHIWA" },
  flow: { title: "導入の流れ｜株式会社SASHIWA" },
  blog: { title: "記事｜株式会社SASHIWA" },
  company: { title: "会社概要｜株式会社SASHIWA" },
  contact: { title: "お問い合わせ｜株式会社SASHIWA" },
  dashboard: { title: "CONTROL｜株式会社SASHIWA" },
};

function parseHash() {
  const h = (typeof window !== "undefined" ? window.location.hash : "") || "";
  const clean = h.replace(/^#\/?/, "").replace(/\/$/, "");
  if (!clean) return { page: "home", slug: null };
  const [page, slug] = clean.split("/");
  if (page === "business" && slug) return { page: "business", slug };
  if (ROUTES[page]) return { page, slug: null };
  return { page: "home", slug: null };
}

/* ---------------------------------------------------------------- アイコン */

function Icon({ name, size = 28 }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    robot: (
      <>
        <rect x="4" y="8" width="16" height="12" rx="4" {...s} />
        <path d="M12 4v4" {...s} />
        <circle cx="12" cy="3.2" r="1.4" {...s} />
        <circle cx="9.2" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="14.8" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
        <path d="M9.5 17h5" {...s} />
      </>
    ),
    flow: (
      <>
        <rect x="2.5" y="9" width="6" height="6" rx="1.6" {...s} />
        <rect x="15.5" y="9" width="6" height="6" rx="1.6" {...s} />
        <path d="M8.5 12h7" {...s} />
        <path d="M13.4 10.2 15.5 12l-2.1 1.8" {...s} />
        <path d="M5.5 9V5.5h13V9" {...s} opacity=".4" />
      </>
    ),
    chip: (
      <>
        <rect x="6" y="6" width="12" height="12" rx="2.4" {...s} />
        <rect x="9.5" y="9.5" width="5" height="5" rx="1" {...s} />
        <path d="M9 6V3M15 6V3M9 21v-3M15 21v-3M6 9H3M6 15H3M21 9h-3M21 15h-3" {...s} />
      </>
    ),
    mail: (
      <>
        <rect x="2.5" y="5" width="19" height="14" rx="2.4" {...s} />
        <path d="m3.5 7 8.5 6 8.5-6" {...s} />
      </>
    ),
    doc: (
      <>
        <path d="M6 2.8h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1Z" {...s} />
        <path d="M14 2.8V7h4" {...s} />
        <path d="M8.5 12h7M8.5 16h5" {...s} />
      </>
    ),
    sns: (
      <>
        <circle cx="6" cy="12" r="2.6" {...s} />
        <circle cx="17.5" cy="6.5" r="2.6" {...s} />
        <circle cx="17.5" cy="17.5" r="2.6" {...s} />
        <path d="m8.4 10.8 6.8-3.2M8.4 13.2l6.8 3.2" {...s} />
      </>
    ),
    slide: (
      <>
        <rect x="2.5" y="4" width="19" height="12.5" rx="2" {...s} />
        <path d="M12 16.5V20M8.5 20h7" {...s} />
        <path d="M7 12.5V9M11 12.5V7M15 12.5v-2.5" {...s} />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" {...s} />
        <path d="m15.8 15.8 4.4 4.4" {...s} />
      </>
    ),
    yen: (
      <>
        <circle cx="12" cy="12" r="9" {...s} />
        <path d="m8.5 7.5 3.5 5 3.5-5M8.5 13.5h7M8.5 16h7M12 12.5V17.5" {...s} />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" {...s} />
        <path d="m8 12.3 2.8 2.8L16 9.8" {...s} />
      </>
    ),
    pen: (
      <>
        <path d="M16.8 3.4a2.3 2.3 0 0 1 3.3 3.3L8.4 18.4l-4.4 1.2 1.2-4.4Z" {...s} />
        <path d="m15 5.2 3.3 3.3" {...s} />
      </>
    ),
    social: (
      <>
        <circle cx="12" cy="7.4" r="3.4" {...s} />
        <path d="M5.2 20.2a6.8 6.8 0 0 1 13.6 0" {...s} />
        <path d="M19.4 4.6a4 4 0 0 1 0 5.6M4.6 4.6a4 4 0 0 0 0 5.6" {...s} opacity=".5" />
      </>
    ),
    studio: (
      <>
        <path d="M4 3.2h7.5l3.2 3.2v9.4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4.2a1 1 0 0 1 1-1Z" {...s} />
        <path d="M11.5 3.2v3.4h3.2" {...s} />
        <path d="M6 10h5M6 13h3.5" {...s} />
        <rect x="12.5" y="12" width="9" height="8.8" rx="2" {...s} />
        <path d="m16.2 14.7 3 1.7-3 1.7z" {...s} />
      </>
    ),
    film: (
      <>
        <rect x="2.5" y="4.5" width="19" height="15" rx="2.6" {...s} />
        <path d="M7.5 4.5v15M16.5 4.5v15M2.5 12h19" {...s} opacity=".45" />
        <path d="m10.8 9.4 3.4 2.1-3.4 2.1z" {...s} />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="sw-ic">
      {paths[name] || paths.check}
    </svg>
  );
}

/* ---------------------------------------------------------------- マスコット */

function RingChara({ tone = "#E0402F", gem = "#FFE3DF", id = "a", delay = "0s", scale = 1 }) {
  return (
    <svg
      viewBox="0 0 128 152"
      className="sw-ring"
      style={{ animationDelay: delay, transform: `scale(${scale})` }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`rg-${id}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={tone} />
          <stop offset="100%" stopColor={tone} stopOpacity="0.72" />
        </linearGradient>
      </defs>
      {/* 宝石＝AIコア */}
      <g className="sw-ring__gem">
        <path d="M64 8 L80 27 L64 46 L48 27 Z" fill={gem} stroke={tone} strokeWidth="3.4" strokeLinejoin="round" />
        <path d="M48 27 H80 M64 8 L64 46" stroke={tone} strokeWidth="1.8" opacity=".45" />
      </g>
      {/* 輪＝人と人をつなぐ */}
      <circle cx="64" cy="98" r="38" fill="none" stroke={`url(#rg-${id})`} strokeWidth="17" strokeLinecap="round" />
      {/* 顔 */}
      <circle cx="64" cy="98" r="29.5" fill="#FFFFFF" opacity=".96" />
      <circle cx="53" cy="94" r="4.2" fill="#1A2233" className="sw-ring__eye" />
      <circle cx="75" cy="94" r="4.2" fill="#1A2233" className="sw-ring__eye" />
      <circle cx="45" cy="105" r="4.6" fill={tone} opacity=".28" />
      <circle cx="83" cy="105" r="4.6" fill={tone} opacity=".28" />
      <path d="M56 106 q8 8 16 0" stroke="#1A2233" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      {/* 手 */}
      <path d="M20 100 q-9 -5 -11 -15" stroke={tone} strokeWidth="5.4" fill="none" strokeLinecap="round" />
      <path d="M108 100 q9 -5 11 -15" stroke={tone} strokeWidth="5.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* 3体が輪でつながる＝人と人をつなげる */
function RingTrio() {
  return (
    <div className="sw-trio">
      <span className="sw-trio__i sw-trio__i--l">
        <RingChara tone="#2456C8" gem="#DCE6FB" id="b" delay=".5s" scale={0.82} />
      </span>
      <span className="sw-trio__i sw-trio__i--c">
        <RingChara tone="#E0402F" gem="#FFE3DF" id="a" delay="0s" />
      </span>
      <span className="sw-trio__i sw-trio__i--r">
        <RingChara tone="#7C5CD6" gem="#EDE6FC" id="c" delay="1s" scale={0.82} />
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- 補助 */

function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return setShown(true);
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }),
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, shown] = useReveal();
  return (
    <div ref={ref} className={`sw-rv ${shown ? "is-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function useCountUp(target, dur = 1400) {
  const [n, setN] = useState(0);
  const [ref, shown] = useReveal();
  useEffect(() => {
    if (!shown) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target === 0) return setN(target);
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown, target, dur]);
  return [ref, n];
}

function Counter({ value, unit, label }) {
  const [ref, n] = useCountUp(value);
  return (
    <div className="sw-stat" ref={ref}>
      <p className="sw-mono sw-stat__v">
        {n}
        <span>{unit}</span>
      </p>
      <p className="sw-stat__l">{label}</p>
    </div>
  );
}

function Marquee({ items, reverse }) {
  const row = [...items, ...items];
  return (
    <div className="sw-mq" aria-hidden="true">
      <div className={`sw-mq__t ${reverse ? "is-rev" : ""}`}>
        {row.map((t, i) => (
          <span key={i}>
            {t}
            <em>◆</em>
          </span>
        ))}
      </div>
    </div>
  );
}

function Head({ en, jp, note, center }) {
  return (
    <Reveal className={`sw-head ${center ? "is-center" : ""}`}>
      <p className="sw-mono sw-head__en">{en}</p>
      <h2 className="sw-head__jp">{jp}</h2>
      {note && <p className="sw-head__note">{note}</p>}
    </Reveal>
  );
}

function PageHero({ en, title, lede }) {
  return (
    <section className="sw-phero">
      <div className="sw-wrap">
        <p className="sw-mono sw-phero__en">{en}</p>
        <h1 className="sw-phero__t">{title}</h1>
        {lede && <p className="sw-phero__l">{lede}</p>}
      </div>
    </section>
  );
}

function CtaBand({ go }) {
  return (
    <section className="sw-cta">
      <div className="sw-wrap">
        <Reveal>
          <h2 className="sw-cta__h">
            御社にも、24時間はたらく<span className="sw-sig">AI社員</span>を。
          </h2>
          <p className="sw-cta__b">
まずは30分の無料相談から。どの業務をAIに渡せるか、実際に動いている構成をお見せしながらご案内します。
          </p>
          <div className="sw-cta__btns">
            <button className="sw-btn sw-btn--sig sw-btn--lg" onClick={() => go("contact")}>
              無料相談を申し込む
            </button>
            <button className="sw-btn sw-btn--wline sw-btn--lg" onClick={() => go("flow")}>
              導入の流れを見る
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- ヘッダー */

function Header({ page, go }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dd, setDd] = useState(false);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 20);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  const nav = (p, slug) => {
    setOpen(false);
    setDd(false);
    go(p, slug);
  };

  return (
    <header className={`sw-hd ${scrolled ? "is-on" : ""}`}>
      <div className="sw-hd__in">
        <a
          className="sw-logo"
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            nav("home");
          }}
        >
          <span className="sw-logo__m" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M5 18 L12 6 L19 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
              <circle cx="12" cy="5.4" r="2.4" fill="currentColor" />
            </svg>
          </span>
          <span className="sw-logo__t">
            SASHIWA<span>Inc.</span>
          </span>
        </a>

        <nav className="sw-nav" aria-label="メインナビゲーション">
          <div className="sw-nav__pill">
            <div
              className={`sw-dd ${dd ? "is-open" : ""}`}
              onMouseEnter={() => setDd(true)}
              onMouseLeave={() => setDd(false)}
            >
              <button
                className={`sw-nav__a ${page === "business" ? "is-cur" : ""}`}
                onClick={() => nav("business")}
                aria-expanded={dd}
              >
                事業内容 <span className="sw-dd__c" aria-hidden="true" />
              </button>
              <div className="sw-dd__m">
                {BUSINESSES.map((b) => (
                  <button key={b.slug} onClick={() => nav("business", b.slug)}>
                    <span className="sw-mono">{b.no}</span>
                    {b.title}
                  </button>
                ))}
                <button className="sw-dd__all" onClick={() => nav("business")}>
                  事業一覧を見る →
                </button>
              </div>
            </div>
            <button className={`sw-nav__a ${page === "flow" ? "is-cur" : ""}`} onClick={() => nav("flow")}>
              導入の流れ
            </button>
            <button className={`sw-nav__a ${page === "blog" ? "is-cur" : ""}`} onClick={() => nav("blog")}>
              記事
            </button>
            <button className={`sw-nav__a ${page === "company" ? "is-cur" : ""}`} onClick={() => nav("company")}>
              会社概要
            </button>
          </div>
        </nav>

        <button className="sw-hd__cta" onClick={() => nav("contact")}>
          お問い合わせ
        </button>

        <button
          className={`sw-burger ${open ? "is-x" : ""}`}
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>

      <div className={`sw-drawer ${open ? "is-open" : ""}`}>
        <p className="sw-mono sw-drawer__k">事業内容</p>
        {BUSINESSES.map((b) => (
          <button key={b.slug} className="sw-drawer__sub" onClick={() => nav("business", b.slug)}>
            {b.title}
          </button>
        ))}
        <button className="sw-drawer__a" onClick={() => nav("business")}>
          事業一覧
        </button>
        <button className="sw-drawer__a" onClick={() => nav("flow")}>
          導入の流れ
        </button>
        <button className="sw-drawer__a" onClick={() => nav("blog")}>
          記事
        </button>
        <button className="sw-drawer__a" onClick={() => nav("company")}>
          会社概要
        </button>
        <button className="sw-drawer__cta" onClick={() => nav("contact")}>
          お問い合わせ
        </button>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- ホーム */

function HomePage({ go }) {
  return (
    <>
      {/* ヒーロー：全画面グラデーション＋巨大ロゴタイプ */}
      <section className="sw-hero">
        <div className="sw-hero__bg" aria-hidden="true" />
        <div className="sw-hero__glow" aria-hidden="true" />
        <div className="sw-hero__in">
          <p className="sw-mono sw-hero__eb">AI EMPLOYEE COMPANY</p>
          <h1 className="sw-hero__word" aria-label="SASHIWA">
            {"SASHIWA".split("").map((c, i) => (
              <span key={i} style={{ animationDelay: `${0.06 * i + 0.15}s` }}>
                {c}
              </span>
            ))}
          </h1>
          <p className="sw-hero__cap">
            社員は、全員AI。<span className="sw-hero__slash">／</span>
            <b>24時間365日</b>、止まらない会社。
          </p>
          <p className="sw-hero__note">
            銀行振込と最終承認以外のすべての業務を、AI社員が処理できる状態を実際につくっています。
          </p>
          <div className="sw-hero__cta">
            <button className="sw-btn sw-btn--white sw-btn--lg" onClick={() => go("contact")}>
              無料相談を申し込む <em aria-hidden="true">→</em>
            </button>
          </div>
          <RingTrio />
          <span className="sw-hero__scroll" aria-hidden="true">
            <em />
          </span>
        </div>
      </section>

      {/* ステートメント */}
      <section className="sw-state">
        <div className="sw-wrap">
          <Reveal>
            <h2 className="sw-state__h">
              人がくり返している仕事は、
              <br />
              全部<span className="sw-sig">AI社員</span>にやらせる。
            </h2>
            <p className="sw-state__b">
              SNSの毎日投稿も、記事も、資料も、問い合わせの一次対応も。
              株式会社SASHIWAには人間の従業員が0名で、5体のAIエージェントが受注から制作、検査、原価計算までを処理しています。
              <b>その運用の仕組みそのものを、御社にご提供します。</b>
            </p>
            <button className="sw-btn sw-btn--sig sw-btn--lg" onClick={() => go("business")}>
              3つの事業を見る <em aria-hidden="true">→</em>
            </button>
          </Reveal>
        </div>
      </section>

      <Marquee items={MARQUEE} />

      {/* 指標（カウントアップ） */}
      <section className="sw-nums">
        <div className="sw-wrap">
          <Reveal>
            <p className="sw-mono sw-nums__en">ALWAYS RUNNING</p>
            <h2 className="sw-nums__h">
              担当者が寝ている間も、<span className="sw-sig">動き続けています。</span>
            </h2>
          </Reveal>
          <div className="sw-nums__g">
            {STATS.map((st) => (
              <Counter key={st.label} value={st.v} unit={st.u} label={st.label} />
            ))}
          </div>
        </div>
      </section>

      {/* 3事業 */}
      <section className="sw-sec">
        <div className="sw-wrap">
          <Head
            center
            en="BUSINESS"
            jp="3つの事業"
            note="仕組みを買うか、成果物を買うか、運用ごと任せるか。目的に合わせてお選びいただけます。"
          />
          <div className="sw-bz">
            {BUSINESSES.map((b, i) => (
              <Reveal key={b.slug} delay={i * 90}>
                <article
                  className="sw-bz__c"
                  style={{ "--t": b.theme, "--s": b.soft }}
                  onClick={() => go("business", b.slug)}
                >
                  <span className="sw-bz__ic">
                    <Icon name={b.icon} size={30} />
                  </span>
                  <p className="sw-mono sw-bz__no">
                    {b.no} <span>{b.en}</span>
                  </p>
                  <h3>{b.title}</h3>
                  <p className="sw-bz__sub">{b.sub}</p>
                  <p className="sw-bz__l">{b.lede}</p>
                  <p className="sw-bz__price">{b.price}</p>
                  <span className="sw-bz__link">
                    詳しく見る <em aria-hidden="true">→</em>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SNS 24/365 特集 */}
      <section className="sw-always">
        <div className="sw-always__bg" aria-hidden="true" />
        <div className="sw-wrap sw-always__in">
          <div className="sw-always__l">
            <Reveal>
              <p className="sw-mono sw-always__eb">BUSINESS 03 ｜ 24/365 SOCIAL</p>
              <h2 className="sw-always__h">
                <span className="sw-always__big">24時間365日</span>
                <br />
                発信が止まらない状態を、
                <br />
                つくります。
              </h2>
              <p className="sw-always__b">
                SNS運用が続かない理由は、才能ではなく時間です。ネタを探し、文章を書き、画像を用意し、
                投稿時間に間に合わせる。この一連の作業をAIエージェントが毎日引き受けます。
                担当者が休んでも、繁忙期でも、投稿は止まりません。
              </p>
              <div className="sw-always__cta">
                <button className="sw-btn sw-btn--soc sw-btn--lg" onClick={() => go("business", "social")}>
                  SNS運用代行を見る <em aria-hidden="true">→</em>
                </button>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120} className="sw-always__r">
            <div className="sw-tl">
              <p className="sw-mono sw-tl__k">1日の稼働ログ（例）</p>
              {[
                { t: "05:30", d: "業界ニュースを収集し、投稿テーマを抽出" },
                { t: "07:00", d: "朝の投稿を配信（X／1本目）" },
                { t: "12:00", d: "昼の投稿を配信（Instagram）" },
                { t: "18:30", d: "夕方の投稿を配信（X／2本目）" },
                { t: "22:00", d: "翌日分の下書きを生成し、検査を通過" },
                { t: "02:14", d: "受信コメントの返信案をまとめる" },
              ].map((r, i) => (
                <div className="sw-tl__r" key={r.t} style={{ animationDelay: `${i * 0.12}s` }}>
                  <span className="sw-mono sw-tl__t">{r.t}</span>
                  <span className="sw-tl__dot" />
                  <span className="sw-tl__d">{r.d}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 任せられる業務 */}
      <section className="sw-sec">
        <div className="sw-wrap">
          <Head
            center
            en="WHAT YOU CAN HAND OVER"
            jp="こんな業務を任せられます"
            note="手順が言葉で説明できる業務であれば、ほとんどが対象になります。"
          />
          <div className="sw-tasks">
            {TASKS.map((t, i) => (
              <Reveal key={t.t} delay={i * 55}>
                <article className="sw-task">
                  <span className="sw-task__ic">
                    <Icon name={t.icon} size={26} />
                  </span>
                  <h3>{t.t}</h3>
                  <p>{t.d}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="sw-sec sw-sec--white">
        <div className="sw-wrap">
          <Head center en="BEFORE / AFTER" jp="導入すると、こう変わります" />
          <div className="sw-ba">
            <div className="sw-ba__hd">
              <span>いま</span>
              <span className="is-after">AI社員を置いたあと</span>
            </div>
            {BEFORE_AFTER.map((r, i) => (
              <Reveal key={r.before} delay={i * 60} className="sw-ba__r">
                <p className="sw-ba__b">{r.before}</p>
                <span className="sw-ba__ar" aria-hidden="true">
                  →
                </span>
                <p className="sw-ba__a">
                  <Icon name="check" size={17} />
                  {r.after}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 自社実証 */}
      <section className="sw-proof">
        <div className="sw-wrap">
          <Reveal className="sw-proof__top">
            <p className="sw-mono sw-proof__en">PROOF OF WORK</p>
            <h2 className="sw-proof__h">
              「全部、<span className="sw-sig">AI</span>でやっています。」
            </h2>
            <p className="sw-proof__s">このサービスの一番の実例は、SASHIWA自身です。</p>
          </Reveal>

          <Reveal className="sw-proof__body" delay={60}>
            <p>
              SASHIWAには人間の従業員がいません。このWebサイト、記事、投稿、提案資料、問い合わせの一次処理、
              原価計算まで、すべてをAIエージェントが制作・処理しています。
            </p>
            <p>
              依頼が届くと統括AIが要件を構造化して担当を選定。制作担当と技術担当が並行して作業を進め、
              品質・倫理担当が成果物を検査し、原価担当が工数を算出します。人が行うのは、方針の決定と最終承認だけです。
            </p>
          </Reveal>

          <div className="sw-roster">
            <p className="sw-mono sw-roster__k">ROSTER — 稼働中のAI社員</p>
            <div className="sw-roster__g">
              {AGENTS.map((a, i) => (
                <Reveal key={a.code} delay={i * 50}>
                  <article className={`sw-ag ${a.lead ? "is-lead" : ""}`}>
                    <p className="sw-mono sw-ag__c">{a.code}</p>
                    <p className="sw-ag__r">{a.role}</p>
                    <p className="sw-mono sw-ag__n">{a.name}</p>
                    <p className="sw-ag__m">{a.mission}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 実際に動いている自動化 */}
      <section className="sw-sec sw-sec--white">
        <div className="sw-wrap">
          <Head
            en="REAL WORKFLOWS"
            jp="実際に動いている自動化"
            note="単発のタスク処理ではなく、止まらずに回り続けるパイプラインです。"
          />
          <div className="sw-wf">
            {WORKFLOWS.map((w, i) => (
              <Reveal key={w.title} delay={i * 70} className="sw-wf__r">
                <div className="sw-wf__l">
                  <span className="sw-mono sw-wf__time">{w.time}</span>
                  <span className="sw-wf__tag">{w.tag}</span>
                </div>
                <div className="sw-wf__m">
                  <h3>{w.title}</h3>
                  <p>{w.body}</p>
                  <ol className="sw-wf__st">
                    {w.steps.map((s, k) => (
                      <li key={s}>
                        <span className="sw-mono">{String(k + 1).padStart(2, "0")}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 流れ（要約）→ 詳細ページへ */}
      <section className="sw-sec">
        <div className="sw-wrap">
          <Head en="HOW IT WORKS" jp="導入の流れ" />
          <div className="sw-flow">
            {FLOW.map((f, i) => (
              <Reveal key={f.n} delay={i * 60} className="sw-flow__c">
                <p className="sw-mono sw-flow__n">STEP {f.n}</p>
                <h3>{f.title}</h3>
                <p className="sw-mono sw-flow__s">{f.span}</p>
                <p className="sw-flow__b">{f.body}</p>
              </Reveal>
            ))}
          </div>
          <div className="sw-more">
            <button className="sw-btn sw-btn--line" onClick={() => go("flow")}>
              導入の流れを詳しく見る
            </button>
          </div>
        </div>
      </section>

      {/* FAQ 要約 */}
      <section className="sw-sec sw-sec--white">
        <div className="sw-wrap sw-narrow">
          <Head center en="FAQ" jp="よくあるご質問" />
          <FaqList items={FAQ.slice(0, 4)} />
          <div className="sw-more">
            <button className="sw-btn sw-btn--line" onClick={() => go("flow")}>
              すべての質問を見る
            </button>
          </div>
        </div>
      </section>

      <CtaBand go={go} />
    </>
  );
}

/* ---------------------------------------------------------------- FAQ部品 */

function FaqList({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="sw-faq">
      {items.map((f, n) => (
        <div key={f.q} className={`sw-faq__i ${open === n ? "is-open" : ""}`}>
          <button className="sw-faq__q" aria-expanded={open === n} onClick={() => setOpen(open === n ? -1 : n)}>
            <span className="sw-mono sw-faq__m">Q</span>
            <span className="sw-faq__qt">{f.q}</span>
            <span className="sw-faq__ic" aria-hidden="true" />
          </button>
          <div className="sw-faq__a">
            <p>{f.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- 事業一覧 */

function BusinessIndexPage({ go }) {
  return (
    <>
      <PageHero
        en="BUSINESS"
        title="事業内容"
        lede="仕組みを買うか、成果物を買うか。目的に合わせてお選びいただけます。"
      />
      <section className="sw-sec">
        <div className="sw-wrap">
          <div className="sw-bz sw-bz--lg">
            {BUSINESSES.map((b, i) => (
              <Reveal key={b.slug} delay={i * 70}>
                <article
                  className="sw-bz__c"
                  style={{ "--t": b.theme, "--s": b.soft }}
                  onClick={() => go("business", b.slug)}
                >
                  <span className="sw-bz__ic">
                    <Icon name={b.icon} size={30} />
                  </span>
                  <p className="sw-mono sw-bz__no">
                    {b.no} <span>{b.en}</span>
                  </p>
                  <h3>{b.title}</h3>
                  <p className="sw-bz__sub">{b.sub}</p>
                  <p className="sw-bz__l">{b.lede}</p>
                  <p className="sw-bz__price">{b.price}</p>
                  <ul className="sw-bz__ul">
                    {b.detail.deliver.slice(0, 3).map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                  <span className="sw-bz__link">
                    詳しく見る <em aria-hidden="true">→</em>
                  </span>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <CtaBand go={go} />
    </>
  );
}

/* ---------------------------------------------------------------- 事業詳細 */

function BusinessDetailPage({ slug, go }) {
  const idx = Math.max(0, BUSINESSES.findIndex((b) => b.slug === slug));
  const b = BUSINESSES[idx];
  const prev = BUSINESSES[(idx - 1 + BUSINESSES.length) % BUSINESSES.length];
  const next = BUSINESSES[(idx + 1) % BUSINESSES.length];

  return (
    <>
      <section className="sw-phero sw-phero--bz" style={{ "--t": b.theme, "--s": b.soft }}>
        <div className="sw-wrap">
          <button className="sw-crumb" onClick={() => go("business")}>
            ← 事業一覧
          </button>
          <p className="sw-mono sw-phero__en" style={{ color: b.theme }}>
            {b.no} <span className="sw-phero__sep">｜</span> {b.en}
          </p>
          <h1 className="sw-phero__t">{b.title}</h1>
          <p className="sw-phero__sub">{b.sub}</p>
          <p className="sw-phero__l">{b.lede}</p>
          <button className="sw-btn sw-btn--sig" onClick={() => go("contact")}>
            この事業について相談する
          </button>
        </div>
      </section>

      <section className="sw-sec sw-sec--white">
        <div className="sw-wrap sw-narrow">
          <Head en="WHAT IT IS" jp={`${b.title}とは`} />
          <Reveal className="sw-prose">
            <p>{b.detail.what}</p>
          </Reveal>
          <div className="sw-pts">
            {b.detail.points.map((p, i) => (
              <Reveal key={p.t} delay={i * 60} className="sw-pt">
                <span className="sw-mono sw-pt__n">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{p.t}</h3>
                  <p>{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {b.detail.steps && (
        <section className="sw-sec sw-sec--white" style={{ "--t": b.theme, "--s": b.soft }}>
          <div className="sw-wrap sw-narrow">
            <Head en="OPERATION" jp="運用の流れ" note="最初の設計から、毎日の配信、月次の改善まで一貫してお引き受けします。" />
            <div className="sw-ops">
              {b.detail.steps.map((st, i) => (
                <Reveal key={st.n} delay={i * 70} className="sw-op">
                  <div className="sw-op__l">
                    <span className="sw-mono sw-op__n">{st.n}</span>
                    <span className="sw-op__line" />
                  </div>
                  <div className="sw-op__m">
                    <h3>{st.t}</h3>
                    <p className="sw-mono sw-op__s">{st.s}</p>
                    <p className="sw-op__d">{st.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {b.detail.menus && (
        <section className="sw-sec" style={{ "--t": b.theme, "--s": b.soft }}>
          <div className="sw-wrap sw-narrow">
            <Head en="MENU" jp="制作メニュー" note="単発でのご依頼も承っています。" />
            {b.detail.menus.map((m) => (
              <Reveal key={m.label} className="sw-menu">
                <div className="sw-menu__hd">
                  <span className="sw-menu__ic">
                    <Icon name={m.icon} size={22} />
                  </span>
                  <h3>{m.label}</h3>
                  <span className="sw-mono sw-menu__en">{m.en}</span>
                </div>
                <div className="sw-menu__l">
                  {m.items.map((it) => (
                    <div className="sw-menu__i" key={it.n}>
                      <div>
                        <p className="sw-menu__n">
                          {it.n}
                          {it.prep && <em className="sw-bz__prep">準備中</em>}
                        </p>
                        <p className="sw-menu__d">{it.d}</p>
                      </div>
                      <p className="sw-mono sw-menu__p">{it.p}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="sw-sec" style={{ "--t": b.theme, "--s": b.soft }}>
        <div className="sw-wrap sw-narrow">
          <Head en="PLANS" jp={b.detail.menus ? "継続プラン" : "料金プラン"} />
          <div className="sw-plans">
            {b.detail.plans.map((pl, i) => (
              <Reveal key={pl.n} delay={i * 60}>
                <article className="sw-plan">
                  <p className="sw-plan__n">{pl.n}</p>
                  <p className="sw-plan__d">{pl.d}</p>
                  <p className="sw-plan__p">{pl.p}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <p className="sw-plans__n">
            ※ 表示価格は税別・目安です。業務量や範囲により変動しますので、無料相談で確定のお見積りをお出しします。
          </p>
        </div>
      </section>

      <section className="sw-sec sw-sec--white" style={{ "--t": b.theme, "--s": b.soft }}>
        <div className="sw-wrap sw-narrow">
          <Head en="DELIVERABLES" jp="お渡しするもの" />
          <div className="sw-dl">
            {b.detail.deliver.map((d, i) => (
              <Reveal key={d} delay={i * 50}>
                <div className="sw-dl__i">
                  <Icon name="check" size={20} />
                  {d}
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="sw-span">
            <span className="sw-mono">期間の目安</span>
            {b.detail.span}
          </Reveal>
          {b.detail.note && (
            <Reveal className="sw-note">
              <Icon name="check" size={18} />
              <p>{b.detail.note}</p>
            </Reveal>
          )}
        </div>
      </section>

      <section className="sw-pager">
        <div className="sw-wrap sw-pager__in">
          <button onClick={() => go("business", prev.slug)}>
            <span className="sw-mono">← {prev.no}</span>
            {prev.title}
          </button>
          <button className="sw-pager__c" onClick={() => go("business")}>
            事業一覧へ
          </button>
          <button className="sw-pager__r" onClick={() => go("business", next.slug)}>
            <span className="sw-mono">{next.no} →</span>
            {next.title}
          </button>
        </div>
      </section>

      <CtaBand go={go} />
    </>
  );
}

/* ---------------------------------------------------------------- 導入の流れ */

function FlowPage({ go }) {
  return (
    <>
      <PageHero
        en="HOW IT WORKS"
        title="導入の流れ"
        lede="無料相談から稼働開始まで、おおよそ1〜2ヶ月です。範囲を絞れば、より短く始めることもできます。"
      />
      <section className="sw-sec">
        <div className="sw-wrap sw-narrow">
          <div className="sw-steps">
            {FLOW.map((f, i) => (
              <Reveal key={f.n} delay={i * 70} className="sw-step">
                <div className="sw-step__l">
                  <span className="sw-mono">STEP {f.n}</span>
                  <span className="sw-step__dot" aria-hidden="true" />
                </div>
                <div className="sw-step__m">
                  <h3>{f.title}</h3>
                  <p className="sw-mono sw-step__s">{f.span}</p>
                  <p className="sw-step__b">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="sw-sec sw-sec--white">
        <div className="sw-wrap sw-narrow">
          <Head center en="FAQ" jp="よくあるご質問" />
          <FaqList items={FAQ} />
        </div>
      </section>

      <CtaBand go={go} />
    </>
  );
}

/* ---------------------------------------------------------------- 記事 */

function BlogPage({ go }) {
  return (
    <>
      <PageHero en="ARTICLES" title="記事" lede="AI社員の設計や自動化の実務について書いています。" />
      <section className="sw-sec">
        <div className="sw-wrap sw-narrow">
          {POSTS.length === 0 ? (
            <Reveal className="sw-empty">
              <span className="sw-empty__ic">
                <Icon name="doc" size={30} />
              </span>
              <h2>記事は準備中です</h2>
              <p>
                現在、AI社員の設計方法や自動化の実例をまとめています。公開までは、
                実際の構成を無料相談で直接お見せしています。
              </p>
              <button className="sw-btn sw-btn--sig" onClick={() => go("contact")}>
                無料相談で構成を見る
              </button>
            </Reveal>
          ) : (
            <div className="sw-posts">
              {POSTS.map((p, i) => (
                <Reveal key={p.id} delay={i * 50}>
                  <a className="sw-post" href={p.url} target="_blank" rel="noopener noreferrer">
                    <div className="sw-post__meta">
                      <span className="sw-mono">{p.date}</span>
                      <span className="sw-post__cat">{p.category}</span>
                    </div>
                    <h3>{p.title}</h3>
                    <p>{p.excerpt}</p>
                  </a>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
      <CtaBand go={go} />
    </>
  );
}

/* ---------------------------------------------------------------- 会社概要 */

function CompanyPage({ go }) {
  return (
    <>
      <PageHero en="COMPANY" title="会社概要" lede="社員は全員AI。人間の従業員がいない会社です。" />
      <section className="sw-sec">
        <div className="sw-wrap sw-narrow">
          <Reveal className="sw-tb">
            {COMPANY.map((r) => (
              <div className="sw-tb__r" key={r.k}>
                <div className="sw-tb__k">{r.k}</div>
                <div className="sw-tb__v">{r.ready ? r.v : <span className="sw-mono sw-badge">{r.v}</span>}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="sw-sec sw-sec--white">
        <div className="sw-wrap">
          <Head en="ROSTER" jp="AI社員のご紹介" note="5体がそれぞれ独立した役割を持ち、互いの成果物を検査し合います。" />
          <div className="sw-roster__g sw-roster__g--light">
            {AGENTS.map((a, i) => (
              <Reveal key={a.code} delay={i * 50}>
                <article className={`sw-ag ${a.lead ? "is-lead" : ""}`}>
                  <p className="sw-mono sw-ag__c">{a.code}</p>
                  <p className="sw-ag__r">{a.role}</p>
                  <p className="sw-mono sw-ag__n">{a.name}</p>
                  <p className="sw-ag__m">{a.mission}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand go={go} />
    </>
  );
}

/* ---------------------------------------------------------------- お問い合わせ
   ★ WEBHOOK_URL / payload のキー名は Make 側の規格。変更禁止。
   ------------------------------------------------------------------------- */

function ContactPage() {
  const [service, setService] = useState("AGENT");
  const [form, setForm] = useState({ name: "", company: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const up = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (sending) return;

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("お名前・メールアドレス・ご相談内容を入力してください。");
      return;
    }

    setError("");
    setSending(true);

    // ---- Make が受け取る規格（3キー固定）。変更しないこと ----
    const payload = {
      client_name: form.name,
      client_email: form.email,
      message: `【事業】${service}／【貴社名】${form.company}／【件名】${form.subject}／【内容】${form.message}`,
    };

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSubmitted(true);
    } catch (err) {
      setError("送信できませんでした。通信環境をご確認のうえ、もう一度お試しください。");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHero
        en="CONTACT"
        title="お問い合わせ"
        lede="30分の無料相談を承っています。送信された時点で、統括AIが内容の解析を開始します。"
      />
      <section className="sw-sec">
        <div className="sw-wrap sw-narrow">
          {submitted ? (
            <Reveal className="sw-done">
              <span className="sw-done__ic">
                <Icon name="check" size={34} />
              </span>
              <h2>受け付けました。</h2>
              <p>
                内容の解析を開始しました。担当エージェントの割り当てと、確認のご連絡を
                ご記入のメールアドレス宛にお送りします。
              </p>
              <button
                className="sw-btn sw-btn--line"
                onClick={() => {
                  setSubmitted(false);
                  setService("AGENT");
                  setForm({ name: "", company: "", email: "", subject: "", message: "" });
                }}
              >
                続けて別の相談を送る
              </button>
            </Reveal>
          ) : (
            <Reveal className="sw-form">
              <p className="sw-fd__l sw-svcpick__k">ご相談の内容</p>
              <div className="sw-svcpick">
                {BUSINESSES.map((b) => (
                  <button
                    key={b.code}
                    type="button"
                    className={`sw-svcpick__b ${service === b.code ? "is-on" : ""}`}
                    style={{ "--t": b.theme, "--s": b.soft }}
                    onClick={() => setService(b.code)}
                  >
                    <span className="sw-svcpick__ic">
                      <Icon name={b.icon} size={20} />
                    </span>
                    <span>
                      <b>{b.title}</b>
                      <em>{b.price}</em>
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  className={`sw-svcpick__b ${service === "OTHER" ? "is-on" : ""}`}
                  style={{ "--t": "#5B6373", "--s": "#EDEFF3" }}
                  onClick={() => setService("OTHER")}
                >
                  <span className="sw-svcpick__ic">
                    <Icon name="search" size={20} />
                  </span>
                  <span>
                    <b>まだ決まっていない</b>
                    <em>相談しながら決めたい</em>
                  </span>
                </button>
              </div>

              <div className="sw-form__g">
                <label className="sw-fd">
                  <span className="sw-fd__l">
                    お名前 <em>必須</em>
                  </span>
                  <input type="text" value={form.name} onChange={up("name")} placeholder="指輪 直人" autoComplete="name" />
                </label>
                <label className="sw-fd">
                  <span className="sw-fd__l">貴社名</span>
                  <input
                    type="text"
                    value={form.company}
                    onChange={up("company")}
                    placeholder="株式会社◯◯"
                    autoComplete="organization"
                  />
                </label>
                <label className="sw-fd">
                  <span className="sw-fd__l">
                    メールアドレス <em>必須</em>
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={up("email")}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>
                <label className="sw-fd">
                  <span className="sw-fd__l">件名</span>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={up("subject")}
                    placeholder="問い合わせ対応の自動化について"
                  />
                </label>
                <label className="sw-fd sw-fd--w">
                  <span className="sw-fd__l">
                    ご相談内容 <em>必須</em>
                  </span>
                  <textarea
                    rows={7}
                    value={form.message}
                    onChange={up("message")}
                    placeholder="いま手作業でやっていることと、困っている点をそのままお書きください。整った文章でなくて構いません。"
                  />
                </label>
              </div>

              {error && (
                <p className="sw-form__err" role="alert">
                  {error}
                </p>
              )}

              <div className="sw-form__f">
                <p className="sw-form__note">
                  いただいた内容は案件の対応にのみ使用し、学習用途への転用や第三者への提供は行いません。
                </p>
                <button className="sw-btn sw-btn--sig sw-btn--lg" onClick={handleSubmit} disabled={sending}>
                  {sending ? "送信中..." : "この内容で送信する"}
                </button>
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------- フッター */

function Footer({ go }) {
  return (
    <footer className="sw-ft">
      <div className="sw-wrap">
        <div className="sw-ft__top">
          <div className="sw-ft__brand">
            <p className="sw-ft__logo">
              SASHIWA<span>Inc.</span>
            </p>
            <p className="sw-ft__tag">社員は、全員AI。</p>
            <p className="sw-ft__sub">株式会社SASHIWA｜オンライン相談 全国対応</p>
          </div>
          <div className="sw-ft__cols">
            <div>
              <p className="sw-mono sw-ft__k">BUSINESS</p>
              {BUSINESSES.map((b) => (
                <button key={b.slug} onClick={() => go("business", b.slug)}>
                  {b.title}
                </button>
              ))}
            </div>
            <div>
              <p className="sw-mono sw-ft__k">COMPANY</p>
              <button onClick={() => go("home")}>ホーム</button>
              <button onClick={() => go("flow")}>導入の流れ</button>
              <button onClick={() => go("blog")}>記事</button>
              <button onClick={() => go("company")}>会社概要</button>
              <button onClick={() => go("contact")}>お問い合わせ</button>
            </div>
          </div>
        </div>
        <p className="sw-ft__note">
          ※当サイトに記載の成果・稼働に関する記述は自社運用の実績であり、同様の成果を保証するものではありません。
        </p>
        <p className="sw-mono sw-ft__cp">© {new Date().getFullYear()} SASHIWA Inc. ALL RIGHTS RESERVED.</p>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------- ルート */

export default function App() {
  const [route, setRoute] = useState(() => parseHash());

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const meta = ROUTES[route.page];
    if (meta && typeof document !== "undefined") document.title = meta.title;
  }, [route]);

  const go = useCallback((page, slug) => {
    const hash = page === "home" ? "#/" : slug ? `#/${page}/${slug}` : `#/${page}`;
    if (window.location.hash === hash) {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: "auto" });
    } else {
      window.location.hash = hash;
    }
  }, []);

  // ダッシュボードはヘッダー・フッターなしの独立画面（公開ナビには出しません）
  if (route.page === "dashboard") return <Dashboard />;

  let body = null;
  if (route.page === "business" && route.slug) body = <BusinessDetailPage slug={route.slug} go={go} />;
  else if (route.page === "business") body = <BusinessIndexPage go={go} />;
  else if (route.page === "flow") body = <FlowPage go={go} />;
  else if (route.page === "blog") body = <BlogPage go={go} />;
  else if (route.page === "company") body = <CompanyPage go={go} />;
  else if (route.page === "contact") body = <ContactPage />;
  else body = <HomePage go={go} />;

  return (
    <div className="sw-root">
      <style>{CSS}</style>
      <Header page={route.page} go={go} />
      <main>{body}</main>
      <Footer go={go} />
    </div>
  );
}

/* ================================================================== CSS */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700;900&display=swap');

.sw-root{
  --bg:#F4F6F9;
  --white:#FFFFFF;
  --ink:#1A2233;
  --ink2:#121A29;
  --muted:#616B7D;
  --line:#E2E6EC;
  --sig:#E0402F;
  --sig-d:#C4342A;
  --sig-s:#FDEDEB;
  --navy:#1F3358;
  --r:18px;

  --sans:'Noto Sans JP',"Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;
  --mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;

  background:var(--bg);color:var(--ink);font-family:var(--sans);
  font-size:16px;line-height:1.9;min-height:100vh;overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
}
.sw-root *,.sw-root *::before,.sw-root *::after{box-sizing:border-box;}
.sw-root h1,.sw-root h2,.sw-root h3,.sw-root p,.sw-root ul,.sw-root ol,.sw-root li{margin:0;padding:0;}
.sw-root ul,.sw-root ol{list-style:none;}
.sw-root a{color:inherit;text-decoration:none;}
.sw-root button{font:inherit;color:inherit;background:none;border:none;cursor:pointer;text-align:left;}
.sw-root :focus-visible{outline:2px solid var(--sig);outline-offset:3px;}
.sw-mono{font-family:var(--mono);font-feature-settings:"tnum";}
.sw-wrap{width:100%;max-width:1120px;margin:0 auto;padding:0 24px;}
.sw-narrow{max-width:820px;}
.sw-sig{color:var(--sig);}
.sw-ic{display:block;}

.sw-rv{opacity:0;transform:translateY(14px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1);}
.sw-rv.is-in{opacity:1;transform:none;}
.sw-tasks > .sw-rv,.sw-bz > .sw-rv,.sw-roster__g > .sw-rv,.sw-dl > .sw-rv,.sw-posts > .sw-rv{height:100%;display:block;}
@media (prefers-reduced-motion:reduce){.sw-rv{opacity:1;transform:none;transition:none;}.sw-root *{animation:none !important;}}

/* buttons */
.sw-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 28px;font-size:14px;font-weight:700;border-radius:999px;border:1.5px solid transparent;transition:background .22s,color .22s,border-color .22s,transform .2s,box-shadow .22s;}
.sw-btn--sig{background:var(--sig);color:#fff;box-shadow:0 10px 22px -12px rgba(224,64,47,.7);}
.sw-btn--sig:hover{background:var(--sig-d);transform:translateY(-2px);}
.sw-btn--sig:disabled{opacity:.45;cursor:not-allowed;transform:none;}
.sw-btn--line{border-color:var(--line);background:var(--white);color:var(--ink);}
.sw-btn--line:hover{border-color:var(--ink);transform:translateY(-2px);}
.sw-btn--wline{border-color:rgba(255,255,255,.35);color:#fff;}
.sw-btn--wline:hover{background:#fff;color:var(--ink);border-color:#fff;}
.sw-btn--lg{padding:16px 36px;font-size:15px;}

/* header */
.sw-hd{position:fixed;top:0;left:0;right:0;z-index:90;transition:background .3s,box-shadow .3s;}
.sw-hd.is-on{background:rgba(244,246,249,.92);backdrop-filter:blur(14px);box-shadow:0 1px 0 var(--line);}
.sw-hd__in{max-width:1220px;margin:0 auto;padding:0 24px;height:76px;display:flex;align-items:center;gap:18px;}
.sw-logo{display:flex;align-items:center;gap:9px;flex-shrink:0;}
.sw-logo__m{color:var(--sig);display:flex;}
.sw-logo__t{font-weight:900;letter-spacing:.12em;font-size:17px;}
.sw-logo__t span{font-family:var(--mono);font-weight:400;font-size:10px;letter-spacing:.1em;color:var(--muted);margin-left:5px;}
.sw-nav{margin-left:auto;}
.sw-nav__pill{display:flex;align-items:center;gap:4px;background:var(--white);border:1px solid var(--line);border-radius:999px;padding:5px 8px;box-shadow:0 6px 18px -14px rgba(26,34,51,.5);}
.sw-nav__a{font-size:13.5px;font-weight:500;padding:8px 15px;border-radius:999px;transition:background .2s,color .2s;white-space:nowrap;display:flex;align-items:center;gap:6px;}
.sw-nav__a:hover{background:var(--bg);}
.sw-nav__a.is-cur{color:var(--sig);}
.sw-dd{position:relative;}
.sw-dd__c{width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid currentColor;opacity:.55;transition:transform .25s;}
.sw-dd.is-open .sw-dd__c{transform:rotate(180deg);}
.sw-dd__m{position:absolute;top:calc(100% + 10px);left:-6px;min-width:260px;background:var(--white);border:1px solid var(--line);border-radius:14px;padding:8px;box-shadow:0 22px 44px -22px rgba(26,34,51,.4);opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .22s,transform .22s,visibility .22s;}
.sw-dd.is-open .sw-dd__m{opacity:1;visibility:visible;transform:none;}
.sw-dd__m button{display:block;width:100%;padding:10px 14px;border-radius:9px;font-size:13.5px;font-weight:500;transition:background .18s;}
.sw-dd__m button:hover{background:var(--bg);}
.sw-dd__m button span{display:block;font-size:9.5px;letter-spacing:.14em;color:var(--sig);margin-bottom:2px;}
.sw-dd__all{border-top:1px solid var(--line);margin-top:6px;padding-top:12px !important;border-radius:0 !important;font-size:12.5px !important;color:var(--muted);}
.sw-hd__cta{font-size:13px;font-weight:700;background:var(--sig);color:#fff;padding:11px 22px;border-radius:999px;transition:background .2s,transform .2s;box-shadow:0 10px 22px -12px rgba(224,64,47,.7);}
.sw-hd__cta:hover{background:var(--sig-d);transform:translateY(-2px);}
.sw-burger{display:none;flex-direction:column;gap:5px;width:26px;padding:8px 0;margin-left:auto;}
.sw-burger span{display:block;height:2px;background:var(--ink);width:100%;border-radius:2px;transition:transform .3s;}
.sw-burger.is-x span:first-child{transform:translateY(3.5px) rotate(45deg);}
.sw-burger.is-x span:last-child{transform:translateY(-3.5px) rotate(-45deg);}
.sw-drawer{display:none;}
@media (max-width:1020px){
  .sw-nav,.sw-hd__cta{display:none;}
  .sw-burger{display:flex;}
  .sw-hd{background:rgba(244,246,249,.94);backdrop-filter:blur(14px);}
  .sw-drawer{display:block;max-height:0;overflow:hidden;background:var(--white);transition:max-height .42s cubic-bezier(.22,1,.36,1);border-top:1px solid var(--line);}
  .sw-drawer.is-open{max-height:620px;}
  .sw-drawer__k{font-size:10px;letter-spacing:.18em;color:var(--muted);padding:18px 24px 6px;}
  .sw-drawer__sub{display:block;width:100%;padding:11px 24px 11px 38px;font-size:14px;color:var(--muted);}
  .sw-drawer__a{display:block;width:100%;padding:15px 24px;border-top:1px solid var(--line);font-size:15px;font-weight:500;}
  .sw-drawer__cta{display:block;width:calc(100% - 48px);margin:18px 24px 24px;background:var(--sig);color:#fff;padding:15px;border-radius:999px;text-align:center;font-weight:700;}
}

/* hero */
.sw-hero{position:relative;padding:150px 0 80px;overflow:hidden;}
.sw-hero__bg{position:absolute;inset:0;background:
  radial-gradient(46% 46% at 82% 22%,rgba(224,64,47,.12),transparent 68%),
  radial-gradient(44% 44% at 12% 82%,rgba(31,51,88,.10),transparent 70%);}
.sw-hero__in{position:relative;display:grid;grid-template-columns:1.08fr .92fr;gap:40px;align-items:center;}
.sw-hero__eb{display:flex;align-items:center;gap:12px;font-size:11px;letter-spacing:.18em;color:var(--muted);margin-bottom:24px;}
.sw-hero__bar{width:24px;height:1px;background:var(--sig);}
.sw-hero__h1{font-weight:900;font-size:clamp(34px,5.6vw,60px);line-height:1.28;letter-spacing:.01em;margin-bottom:26px;}
.sw-hero__em{color:var(--sig);}
.sw-hero__lede{font-size:15.5px;line-height:2.15;color:var(--muted);max-width:32em;margin-bottom:32px;}
.sw-hero__lede b{color:var(--ink);font-weight:700;}
.sw-hero__cta{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:28px;}
.sw-hero__r{display:flex;justify-content:center;}
.sw-mascot{width:100%;max-width:400px;height:auto;}
.sw-mascot__big{animation:swFloat 5s ease-in-out infinite;transform-origin:center;}
.sw-mascot__bot{animation:swFloat 3.4s ease-in-out infinite;}
@keyframes swFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);}}
@media (max-width:940px){
  .sw-hero{padding:118px 0 56px;}
  .sw-hero__in{grid-template-columns:1fr;gap:24px;}
  .sw-hero__r{order:-1;}
  .sw-mascot{max-width:280px;}
}

/* oneline */

/* section shells */
.sw-sec{padding:86px 0;}
.sw-sec--white{background:var(--white);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
@media (max-width:760px){.sw-sec{padding:62px 0;}}
.sw-head{margin-bottom:44px;}
.sw-head.is-center{text-align:center;}
.sw-head.is-center .sw-head__note{margin-left:auto;margin-right:auto;}
.sw-head__en{font-size:10.5px;letter-spacing:.24em;color:var(--sig);margin-bottom:12px;font-weight:700;}
.sw-head__jp{font-weight:900;font-size:clamp(25px,3.4vw,36px);line-height:1.45;letter-spacing:.01em;}
.sw-head__note{font-size:14px;line-height:2.05;color:var(--muted);margin-top:14px;max-width:44em;}
.sw-more{margin-top:36px;text-align:center;}

/* page hero */
.sw-phero{padding:138px 0 54px;background:linear-gradient(180deg,rgba(224,64,47,.07),transparent 82%);}
.sw-phero__en{font-size:11px;letter-spacing:.22em;color:var(--sig);font-weight:700;margin-bottom:14px;}
.sw-phero__sep{color:var(--muted);}
.sw-phero__t{font-weight:900;font-size:clamp(30px,4.6vw,48px);line-height:1.3;margin-bottom:16px;}
.sw-phero__l{font-size:15px;line-height:2.1;color:var(--muted);max-width:40em;}
.sw-phero--bz .sw-btn{margin-top:26px;}
.sw-crumb{font-size:12.5px;color:var(--muted);margin-bottom:18px;padding:6px 14px;border:1px solid var(--line);border-radius:999px;background:var(--white);transition:border-color .2s;}
.sw-crumb:hover{border-color:var(--ink);}
@media (max-width:760px){.sw-phero{padding:112px 0 42px;}}

/* tasks */
.sw-tasks{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.sw-task{background:var(--white);border:1px solid var(--line);border-radius:var(--r);padding:28px 26px;height:100%;transition:transform .28s,box-shadow .28s,border-color .28s;}
.sw-task:hover{transform:translateY(-4px);box-shadow:0 24px 44px -30px rgba(26,34,51,.5);border-color:transparent;}
.sw-task__ic{display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:15px;background:var(--sig-s);color:var(--sig);margin-bottom:18px;}
.sw-task h3{font-size:17px;font-weight:700;margin-bottom:8px;}
.sw-task p{font-size:13.5px;line-height:1.95;color:var(--muted);}
@media (max-width:900px){.sw-tasks{grid-template-columns:repeat(2,1fr);}}
@media (max-width:600px){.sw-tasks{grid-template-columns:1fr;}}

/* before after */
.sw-ba{max-width:880px;margin:0 auto;}
.sw-ba__hd{display:grid;grid-template-columns:1fr 44px 1fr;gap:12px;margin-bottom:12px;}
.sw-ba__hd span{font-size:11.5px;font-weight:700;letter-spacing:.1em;color:var(--muted);text-align:center;}
.sw-ba__hd span:first-child{grid-column:1;}
.sw-ba__hd span.is-after{grid-column:3;color:var(--sig);}
.sw-ba__r{display:grid;grid-template-columns:1fr 44px 1fr;gap:12px;align-items:stretch;margin-bottom:12px;}
.sw-ba__b,.sw-ba__a{display:flex;align-items:center;gap:9px;font-size:14px;line-height:1.7;padding:18px 22px;border-radius:14px;}
.sw-ba__b{background:#EAECF0;color:var(--muted);}
.sw-ba__a{background:var(--white);border:1.5px solid var(--sig);color:var(--ink);font-weight:700;}
.sw-ba__a svg{color:var(--sig);flex-shrink:0;}
.sw-ba__ar{display:flex;align-items:center;justify-content:center;color:var(--sig);font-size:18px;}
@media (max-width:700px){
  .sw-ba__hd{display:none;}
  .sw-ba__r{grid-template-columns:1fr;gap:6px;margin-bottom:20px;}
  .sw-ba__ar{transform:rotate(90deg);}
}

/* business cards */
.sw-bz{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
.sw-bz__c{background:var(--white);border:1px solid var(--line);border-radius:var(--r);padding:32px 28px;height:100%;display:flex;flex-direction:column;cursor:pointer;transition:transform .28s,box-shadow .28s,border-color .28s;}
.sw-bz__c:hover{transform:translateY(-4px);box-shadow:0 26px 48px -30px rgba(26,34,51,.5);border-color:var(--sig);}
.sw-bz__ic{display:inline-flex;align-items:center;justify-content:center;width:58px;height:58px;border-radius:17px;background:var(--navy);color:#fff;margin-bottom:20px;}
.sw-bz__no{font-size:10px;letter-spacing:.14em;color:var(--sig);font-weight:700;margin-bottom:10px;}
.sw-bz__no span{color:var(--muted);font-weight:400;margin-left:6px;}
.sw-bz__c h3{font-size:21px;font-weight:900;line-height:1.5;margin-bottom:12px;}
.sw-bz__l{font-size:13.5px;line-height:2;color:var(--muted);margin-bottom:20px;}
.sw-bz__ul{margin-bottom:20px;display:grid;gap:5px;}
.sw-bz__ul li{font-size:12.5px;color:var(--muted);padding-left:15px;position:relative;}
.sw-bz__ul li::before{content:"";position:absolute;left:0;top:.85em;width:8px;height:1.5px;background:var(--sig);}
.sw-bz__link{margin-top:auto;font-size:13px;font-weight:700;color:var(--sig);display:inline-flex;align-items:center;gap:7px;}
.sw-bz__link em{font-style:normal;transition:transform .25s;display:inline-block;}
.sw-bz__c:hover .sw-bz__link em{transform:translateX(5px);}
@media (max-width:900px){.sw-bz{grid-template-columns:1fr;}}

/* proof (dark) */
.sw-proof{background:var(--ink2);color:#D7DCE4;padding:86px 0;}
.sw-proof__top{margin-bottom:30px;}
.sw-proof__en{font-size:10.5px;letter-spacing:.24em;color:var(--sig);font-weight:700;margin-bottom:14px;}
.sw-proof__h{font-weight:900;font-size:clamp(26px,4.6vw,48px);line-height:1.4;color:#fff;}
.sw-proof__s{font-size:14px;color:#8B96A6;margin-top:14px;}
.sw-proof__body{display:grid;grid-template-columns:repeat(2,1fr);gap:30px;padding-bottom:44px;border-bottom:1px solid #232C3C;}
.sw-proof__body p{font-size:14.5px;line-height:2.15;color:#9EA9B8;}
@media (max-width:820px){.sw-proof__body{grid-template-columns:1fr;gap:18px;}}
.sw-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:44px 0;}
.sw-stat{background:#1A2233;border:1px solid #262F41;border-radius:var(--r);padding:26px 22px;}
.sw-stat__v{font-size:42px;font-weight:500;line-height:1;color:#fff;letter-spacing:-.02em;margin-bottom:10px;}
.sw-stat__v span{font-size:14px;color:var(--sig);margin-left:3px;letter-spacing:0;}
.sw-stat__l{font-size:12.5px;color:#8B96A6;}
@media (max-width:760px){.sw-stats{grid-template-columns:repeat(2,1fr);}.sw-stat__v{font-size:34px;}}
.sw-roster__k{font-size:10px;letter-spacing:.2em;color:#6F7B8B;margin-bottom:16px;}
.sw-roster__g{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;}
.sw-ag{background:#1A2233;border:1px solid #262F41;border-radius:14px;padding:20px 18px;height:100%;transition:transform .28s,border-color .28s;}
.sw-ag:hover{transform:translateY(-3px);border-color:#3B4658;}
.sw-ag.is-lead{border-color:rgba(224,64,47,.5);}
.sw-ag__c{font-size:9.5px;letter-spacing:.14em;color:#6F7B8B;margin-bottom:9px;}
.sw-ag__r{font-size:13px;font-weight:700;color:#fff;margin-bottom:5px;}
.sw-ag__n{font-size:10px;color:var(--sig);word-break:break-all;margin-bottom:11px;}
.sw-ag__m{font-size:11.5px;line-height:1.8;color:#828D9C;}
.sw-roster__g--light .sw-ag{background:var(--bg);border-color:var(--line);}
.sw-roster__g--light .sw-ag__r{color:var(--ink);}
.sw-roster__g--light .sw-ag__c{color:var(--muted);}
.sw-roster__g--light .sw-ag__m{color:var(--muted);}
@media (max-width:940px){.sw-roster__g{grid-template-columns:repeat(2,1fr);}}
@media (max-width:520px){.sw-roster__g{grid-template-columns:1fr;}}

/* workflows */
.sw-wf{display:grid;gap:16px;}
.sw-wf__r{display:grid;grid-template-columns:180px 1fr;gap:28px;background:var(--bg);border:1px solid var(--line);border-radius:var(--r);padding:30px 32px;}
.sw-wf__l{display:flex;flex-direction:column;gap:10px;align-items:flex-start;}
.sw-wf__time{font-size:15px;font-weight:700;color:var(--sig);}
.sw-wf__tag{font-size:11.5px;color:var(--muted);background:var(--white);border:1px solid var(--line);border-radius:999px;padding:4px 12px;}
.sw-wf__m h3{font-size:clamp(18px,2.4vw,23px);font-weight:900;line-height:1.55;margin-bottom:12px;}
.sw-wf__m > p{font-size:14px;line-height:2.05;color:var(--muted);margin-bottom:18px;}
.sw-wf__st{display:flex;gap:8px;flex-wrap:wrap;}
.sw-wf__st li{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink);background:var(--white);border:1px solid var(--line);border-radius:999px;padding:6px 13px;}
.sw-wf__st li span{font-size:9.5px;color:var(--sig);}
@media (max-width:820px){.sw-wf__r{grid-template-columns:1fr;gap:14px;padding:24px 20px;}.sw-wf__l{flex-direction:row;align-items:center;}}

/* flow cards */
.sw-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.sw-flow__c{background:var(--white);border:1px solid var(--line);border-radius:var(--r);padding:26px 22px 30px;}
.sw-flow__n{font-size:10.5px;letter-spacing:.16em;color:var(--sig);font-weight:700;margin-bottom:14px;}
.sw-flow__c h3{font-size:18px;font-weight:900;margin-bottom:6px;line-height:1.5;}
.sw-flow__s{font-size:11.5px;color:var(--muted);margin-bottom:14px;}
.sw-flow__b{font-size:13px;line-height:1.95;color:var(--muted);}
@media (max-width:940px){.sw-flow{grid-template-columns:repeat(2,1fr);}}
@media (max-width:560px){.sw-flow{grid-template-columns:1fr;}}

/* steps (flow page) */
.sw-steps{display:grid;gap:0;}
.sw-step{display:grid;grid-template-columns:120px 1fr;gap:28px;padding-bottom:34px;}
.sw-step__l{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:12px;}
.sw-step__l span:first-child{font-size:11px;letter-spacing:.16em;color:var(--sig);font-weight:700;}
.sw-step__dot{position:absolute;left:0;top:34px;bottom:-34px;width:1px;background:var(--line);}
.sw-step:last-child .sw-step__dot{display:none;}
.sw-step__m{background:var(--white);border:1px solid var(--line);border-radius:var(--r);padding:26px 28px;}
.sw-step__m h3{font-size:20px;font-weight:900;margin-bottom:6px;}
.sw-step__s{font-size:12px;color:var(--sig);margin-bottom:12px;}
.sw-step__b{font-size:14px;line-height:2.05;color:var(--muted);}
@media (max-width:700px){.sw-step{grid-template-columns:1fr;gap:10px;padding-bottom:20px;}.sw-step__dot{display:none;}}

/* prose / points / deliverables */
.sw-prose p{font-size:15px;line-height:2.2;color:var(--muted);}
.sw-pts{margin-top:34px;display:grid;gap:12px;}
.sw-pt{display:grid;grid-template-columns:56px 1fr;gap:8px;background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:22px 24px;}
.sw-pt__n{font-size:12px;letter-spacing:.12em;color:var(--sig);font-weight:700;padding-top:4px;}
.sw-pt h3{font-size:16.5px;font-weight:700;margin-bottom:5px;}
.sw-pt p{font-size:13.5px;line-height:1.95;color:var(--muted);}
.sw-dl{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
.sw-dl__i{display:flex;align-items:center;gap:11px;background:var(--white);border:1px solid var(--line);border-radius:14px;padding:18px 22px;font-size:14.5px;font-weight:500;height:100%;}
.sw-dl__i svg{color:var(--sig);flex-shrink:0;}
.sw-span{margin-top:22px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-size:14px;color:var(--muted);border-top:1px solid var(--line);padding-top:22px;}
.sw-span span{font-size:10px;letter-spacing:.14em;color:var(--sig);border:1px solid var(--line);border-radius:999px;padding:5px 12px;}
@media (max-width:600px){.sw-dl{grid-template-columns:1fr;}}

/* pager */
.sw-pager{border-top:1px solid var(--line);background:var(--white);}
.sw-pager__in{display:grid;grid-template-columns:1fr auto 1fr;gap:20px;align-items:center;padding-top:26px;padding-bottom:26px;}
.sw-pager__in button{font-size:14px;font-weight:700;transition:color .2s;}
.sw-pager__in button:hover{color:var(--sig);}
.sw-pager__in button span{display:block;font-size:10px;letter-spacing:.12em;color:var(--muted);font-weight:400;margin-bottom:3px;}
.sw-pager__c{font-size:12.5px !important;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:9px 18px;white-space:nowrap;}
.sw-pager__r{text-align:right;}
@media (max-width:700px){.sw-pager__in{grid-template-columns:1fr;gap:12px;}.sw-pager__r{text-align:left;}.sw-pager__c{justify-self:start;}}

/* faq */
.sw-faq{background:var(--white);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;}
.sw-sec--white .sw-faq{background:var(--bg);}
.sw-faq__i + .sw-faq__i{border-top:1px solid var(--line);}
.sw-faq__q{width:100%;display:grid;grid-template-columns:32px 1fr 22px;gap:12px;align-items:start;padding:22px 26px;}
.sw-faq__m{font-size:13px;color:var(--sig);font-weight:700;padding-top:2px;}
.sw-faq__qt{font-size:15.5px;font-weight:700;line-height:1.75;}
.sw-faq__ic{position:relative;width:14px;height:14px;margin-top:7px;justify-self:end;}
.sw-faq__ic::before,.sw-faq__ic::after{content:"";position:absolute;background:var(--sig);transition:transform .3s;}
.sw-faq__ic::before{left:0;top:6.3px;width:14px;height:1.6px;}
.sw-faq__ic::after{left:6.3px;top:0;width:1.6px;height:14px;}
.sw-faq__i.is-open .sw-faq__ic::after{transform:scaleY(0);}
.sw-faq__a{max-height:0;overflow:hidden;transition:max-height .42s cubic-bezier(.22,1,.36,1);}
.sw-faq__i.is-open .sw-faq__a{max-height:520px;}
.sw-faq__a p{font-size:13.5px;line-height:2.15;color:var(--muted);padding:0 26px 24px 70px;}
@media (max-width:600px){.sw-faq__q{padding:18px 18px;}.sw-faq__a p{padding:0 18px 20px;}}

/* empty (blog) */
.sw-empty{background:var(--white);border:1px solid var(--line);border-radius:var(--r);padding:56px 34px;text-align:center;}
.sw-empty__ic{display:inline-flex;align-items:center;justify-content:center;width:66px;height:66px;border-radius:20px;background:var(--sig-s);color:var(--sig);margin-bottom:20px;}
.sw-empty h2{font-size:22px;font-weight:900;margin-bottom:12px;}
.sw-empty p{font-size:14px;line-height:2.05;color:var(--muted);max-width:32em;margin:0 auto 26px;}
.sw-posts{display:grid;gap:14px;}
.sw-post{display:block;background:var(--white);border:1px solid var(--line);border-radius:var(--r);padding:26px 28px;height:100%;transition:transform .25s,box-shadow .25s;}
.sw-post:hover{transform:translateY(-3px);box-shadow:0 22px 40px -30px rgba(26,34,51,.5);}
.sw-post__meta{display:flex;gap:12px;align-items:center;font-size:11.5px;color:var(--muted);margin-bottom:10px;}
.sw-post__cat{color:var(--sig);border:1px solid var(--line);border-radius:999px;padding:2px 10px;}
.sw-post h3{font-size:18px;font-weight:700;line-height:1.6;margin-bottom:8px;}
.sw-post p{font-size:13.5px;line-height:1.95;color:var(--muted);}

/* company table */
.sw-tb{background:var(--white);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;}
.sw-tb__r{display:grid;grid-template-columns:190px 1fr;gap:20px;padding:18px 26px;align-items:center;}
.sw-tb__r + .sw-tb__r{border-top:1px solid var(--line);}
.sw-tb__k{font-size:13px;color:var(--muted);font-weight:500;}
.sw-tb__v{font-size:14.5px;}
.sw-badge{font-size:11px;letter-spacing:.08em;color:var(--muted);background:var(--bg);border-radius:999px;padding:4px 12px;}
@media (max-width:600px){.sw-tb__r{grid-template-columns:1fr;gap:3px;padding:15px 18px;}}

/* cta band */
.sw-cta{background:var(--ink2);color:#fff;padding:80px 0;text-align:center;position:relative;overflow:hidden;}
.sw-cta::before{content:"";position:absolute;inset:0;background:radial-gradient(58% 100% at 50% 0%,rgba(224,64,47,.26),transparent 72%);}
.sw-cta .sw-wrap{position:relative;}
.sw-cta__h{font-weight:900;font-size:clamp(24px,4.2vw,42px);line-height:1.45;margin-bottom:16px;}
.sw-cta__b{font-size:14.5px;line-height:2;color:#A9B3C1;margin-bottom:32px;}
.sw-cta__btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}

/* contact form */
.sw-form{background:var(--white);border:1px solid var(--line);border-radius:var(--r);padding:38px 36px;}
.sw-form__g{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;}
.sw-fd{display:flex;flex-direction:column;gap:9px;}
.sw-fd--w{grid-column:1/-1;}
.sw-fd__l{font-size:12.5px;font-weight:700;display:flex;align-items:center;gap:8px;}
.sw-fd__l em{font-style:normal;font-size:10px;font-weight:700;color:#fff;background:var(--sig);border-radius:4px;padding:2px 7px;}
.sw-fd input,.sw-fd textarea{width:100%;background:var(--bg);border:1.5px solid transparent;border-radius:12px;color:var(--ink);padding:14px 16px;font-family:var(--sans);font-size:14.5px;line-height:1.8;resize:vertical;transition:border-color .22s,background .22s;}
.sw-fd input::placeholder,.sw-fd textarea::placeholder{color:#9BA3B1;}
.sw-fd input:focus,.sw-fd textarea:focus{outline:none;border-color:var(--sig);background:var(--white);}
.sw-form__err{margin-top:16px;font-size:13px;color:var(--sig);background:var(--sig-s);border-radius:10px;padding:12px 16px;line-height:1.8;}
.sw-form__f{margin-top:28px;padding-top:24px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;}
.sw-form__note{font-size:12px;color:var(--muted);line-height:1.9;max-width:30em;}
@media (max-width:700px){.sw-form{padding:26px 20px;}.sw-form__g{grid-template-columns:1fr;}.sw-form__f .sw-btn{width:100%;}}
.sw-done{background:var(--white);border:1px solid var(--line);border-radius:var(--r);padding:52px 36px;text-align:center;}
.sw-done__ic{display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:22px;background:var(--sig-s);color:var(--sig);margin-bottom:22px;}
.sw-done h2{font-size:24px;font-weight:900;margin-bottom:14px;}
.sw-done p{font-size:14px;line-height:2.05;color:var(--muted);max-width:34em;margin:0 auto 26px;}

/* footer */
.sw-ft{background:#0E1626;color:#8B96A6;padding:56px 0 34px;}
.sw-ft__top{display:flex;justify-content:space-between;gap:40px;flex-wrap:wrap;padding-bottom:32px;border-bottom:1px solid #1E2739;}
.sw-ft__logo{font-weight:900;letter-spacing:.12em;font-size:18px;color:#fff;margin-bottom:10px;}
.sw-ft__logo span{font-family:var(--mono);font-weight:400;font-size:10px;color:#6F7B8B;margin-left:5px;}
.sw-ft__tag{font-size:15px;font-weight:700;color:#C6CEDA;margin-bottom:6px;}
.sw-ft__sub{font-size:12px;}
.sw-ft__cols{display:flex;gap:56px;flex-wrap:wrap;}
.sw-ft__cols > div{display:flex;flex-direction:column;gap:9px;}
.sw-ft__k{font-size:9.5px;letter-spacing:.18em;color:#5D6779;margin-bottom:4px;}
.sw-ft__cols button{font-size:13px;transition:color .2s;}
.sw-ft__cols button:hover{color:#fff;}
.sw-ft__note{font-size:11px;line-height:1.9;color:#5C6672;margin:22px 0 16px;}
.sw-ft__cp{font-size:10px;letter-spacing:.1em;color:#4C5561;}
@media (max-width:700px){.sw-ft__cols{gap:32px;}}

/* ---- 事業ブランド ---- */
.sw-bz__c{--t:var(--sig);--s:var(--sig-s);}
.sw-bz__c:hover{border-color:var(--t);}
.sw-bz__ic{background:var(--t) !important;}
.sw-bz__no{color:var(--t) !important;}
.sw-bz__ul li::before{background:var(--t);}
.sw-bz__link{color:var(--t);}
.sw-bz__price{font-family:var(--mono);font-size:14px;font-weight:700;color:var(--t);margin-bottom:18px;}
.sw-bz__prep{font-style:normal;font-size:11px;font-weight:700;color:var(--muted);background:var(--bg);border-radius:999px;padding:3px 10px;margin-left:10px;vertical-align:middle;}
.sw-phero--bz{background:linear-gradient(180deg,var(--s),transparent 82%);}
.sw-phero--bz .sw-btn--sig{background:var(--t);box-shadow:none;}
.sw-phero--bz .sw-btn--sig:hover{filter:brightness(.92);}

/* ---- 料金プラン ---- */
.sw-plans{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.sw-plans > .sw-rv{height:100%;display:block;}
.sw-plan{background:var(--white);border:1px solid var(--line);border-top:3px solid var(--t);border-radius:16px;padding:24px 22px;height:100%;transition:transform .25s,box-shadow .25s;}
.sw-plan:hover{transform:translateY(-3px);box-shadow:0 22px 40px -30px rgba(26,34,51,.5);}
.sw-plan__n{font-size:15px;font-weight:900;margin-bottom:8px;}
.sw-plan__d{font-size:12.5px;line-height:1.85;color:var(--muted);margin-bottom:16px;min-height:3.4em;}
.sw-plan__p{font-family:var(--mono);font-size:19px;font-weight:700;color:var(--t);}
.sw-plans__n{font-size:12px;line-height:1.9;color:var(--muted);margin-top:18px;}
@media (max-width:820px){.sw-plans{grid-template-columns:1fr;}.sw-plan__d{min-height:0;}}

.sw-note{display:flex;gap:12px;align-items:flex-start;background:var(--bg);border-left:3px solid var(--t);border-radius:12px;padding:18px 20px;margin-top:20px;}
.sw-note svg{color:var(--t);margin-top:4px;}
.sw-note p{font-size:12.5px;line-height:1.95;color:var(--muted);}

/* ---- 事業セレクタ（お問い合わせ） ---- */
.sw-svcpick__k{margin-bottom:12px;}
.sw-svcpick{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:26px;padding-bottom:26px;border-bottom:1px solid var(--line);}
.sw-svcpick__b{display:flex;align-items:center;gap:12px;border:1.5px solid var(--line);border-radius:14px;padding:14px 16px;background:var(--white);transition:border-color .2s,background .2s,transform .2s;}
.sw-svcpick__b:hover{border-color:var(--t);transform:translateY(-1px);}
.sw-svcpick__b.is-on{border-color:var(--t);background:var(--s);}
.sw-svcpick__ic{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:var(--s);color:var(--t);flex-shrink:0;}
.sw-svcpick__b.is-on .sw-svcpick__ic{background:var(--t);color:#fff;}
.sw-svcpick__b b{display:block;font-size:14px;font-weight:700;line-height:1.5;}
.sw-svcpick__b em{font-style:normal;font-size:11.5px;color:var(--muted);}
@media (max-width:640px){.sw-svcpick{grid-template-columns:1fr;}}

/* ---- 2事業レイアウト・制作メニュー ---- */
.sw-bz{grid-template-columns:repeat(2,1fr);}
.sw-bz__sub{font-size:12.5px;font-weight:700;color:var(--t);margin-bottom:12px;}
.sw-phero__sub{font-size:14px;font-weight:700;color:var(--t);margin-bottom:10px;}
@media (max-width:900px){.sw-bz{grid-template-columns:1fr;}}

.sw-menu{background:var(--white);border:1px solid var(--line);border-radius:18px;padding:26px 28px;margin-bottom:16px;}
.sw-menu__hd{display:flex;align-items:center;gap:12px;padding-bottom:18px;border-bottom:1px solid var(--line);margin-bottom:6px;}
.sw-menu__ic{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:13px;background:var(--s);color:var(--t);}
.sw-menu__hd h3{font-size:18px;font-weight:900;}
.sw-menu__en{font-size:9.5px;letter-spacing:.18em;color:var(--muted);margin-left:auto;}
.sw-menu__i{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding:16px 0;}
.sw-menu__i + .sw-menu__i{border-top:1px solid var(--line);}
.sw-menu__n{font-size:15px;font-weight:700;line-height:1.6;margin-bottom:4px;}
.sw-menu__d{font-size:12.5px;line-height:1.85;color:var(--muted);}
.sw-menu__p{font-size:15px;font-weight:700;color:var(--t);white-space:nowrap;padding-top:2px;}
@media (max-width:600px){
  .sw-menu{padding:20px 18px;}
  .sw-menu__i{flex-direction:column;gap:6px;}
  .sw-menu__p{padding-top:0;}
}

/* ============ ヒーロー全面刷新 ============ */
.sw-hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:110px 24px 70px;overflow:hidden;text-align:center;}
.sw-hero__bg{position:absolute;inset:0;background:
  linear-gradient(155deg,#E0402F 0%,#C22C55 34%,#7C3F9E 66%,#3B3A8F 100%);}
.sw-hero__bg::after{content:"";position:absolute;inset:0;
  background-image:radial-gradient(rgba(255,255,255,.16) 1px,transparent 1px);background-size:26px 26px;opacity:.5;
  mask-image:radial-gradient(80% 70% at 50% 45%,#000,transparent 78%);
  -webkit-mask-image:radial-gradient(80% 70% at 50% 45%,#000,transparent 78%);}
.sw-hero__glow{position:absolute;left:50%;top:38%;width:min(1100px,120vw);height:min(1100px,120vw);transform:translate(-50%,-50%);
  background:radial-gradient(circle,rgba(255,255,255,.30),transparent 62%);animation:swBreath 7s ease-in-out infinite;}
@keyframes swBreath{0%,100%{opacity:.75;transform:translate(-50%,-50%) scale(1);}50%{opacity:1;transform:translate(-50%,-50%) scale(1.08);}}
.sw-hero__in{position:relative;width:100%;max-width:1100px;}
.sw-hero__eb{font-size:11px;letter-spacing:.34em;color:rgba(255,255,255,.75);margin-bottom:18px;animation:swUp .8s .05s both cubic-bezier(.22,1,.36,1);}
.sw-hero__word{display:flex;justify-content:center;gap:.02em;font-weight:900;color:#fff;line-height:.92;letter-spacing:.02em;
  font-size:clamp(56px,15vw,178px);margin-bottom:26px;}
.sw-hero__word span{display:inline-block;animation:swDrop .9s both cubic-bezier(.2,1.1,.35,1);}
@keyframes swDrop{from{opacity:0;transform:translateY(-38px) rotate(-6deg);}to{opacity:1;transform:none;}}
@keyframes swUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}
.sw-hero__cap{font-size:clamp(19px,3.2vw,34px);font-weight:900;color:#fff;line-height:1.55;margin-bottom:18px;animation:swUp .9s .55s both cubic-bezier(.22,1,.36,1);}
.sw-hero__cap b{color:#FFE27A;font-weight:900;}
.sw-hero__slash{opacity:.5;margin:0 .25em;font-weight:400;}
.sw-hero__note{font-size:13.5px;line-height:2;color:rgba(255,255,255,.86);max-width:36em;margin:0 auto 34px;animation:swUp .9s .7s both cubic-bezier(.22,1,.36,1);}
.sw-hero__cta{animation:swUp .9s .85s both cubic-bezier(.22,1,.36,1);}
.sw-btn--white{background:#fff;color:#1A2233;box-shadow:0 16px 34px -18px rgba(0,0,0,.55);}
.sw-btn--white:hover{transform:translateY(-2px);background:#1A2233;color:#fff;}
.sw-btn em{font-style:normal;transition:transform .25s;display:inline-block;}
.sw-btn:hover em{transform:translateX(4px);}
.sw-hero__scroll{position:absolute;left:50%;bottom:-46px;transform:translateX(-50%);width:26px;height:42px;border:1.5px solid rgba(255,255,255,.55);border-radius:999px;display:flex;justify-content:center;padding-top:8px;}
.sw-hero__scroll em{width:3px;height:8px;border-radius:2px;background:#fff;animation:swScroll 1.8s ease-in-out infinite;}
@keyframes swScroll{0%{opacity:0;transform:translateY(0);}30%{opacity:1;}100%{opacity:0;transform:translateY(16px);}}
@media (max-width:760px){.sw-hero{min-height:auto;padding:104px 20px 90px;}.sw-hero__scroll{display:none;}}

/* キャラクター：指輪 */
.sw-trio{display:flex;align-items:flex-end;justify-content:center;margin-top:46px;animation:swUp 1s 1s both cubic-bezier(.22,1,.36,1);}
.sw-trio__i{display:block;}
.sw-trio__i--c{width:min(190px,32vw);z-index:2;}
.sw-trio__i--l,.sw-trio__i--r{width:min(150px,26vw);}
.sw-trio__i--l{margin-right:-26px;}
.sw-trio__i--r{margin-left:-26px;}
.sw-ring{width:100%;height:auto;display:block;animation:swFloatY 4.6s ease-in-out infinite;filter:drop-shadow(0 14px 22px rgba(0,0,0,.22));}
@keyframes swFloatY{0%,100%{transform:translateY(0);}50%{transform:translateY(-11px);}}
.sw-ring__gem{transform-origin:64px 27px;animation:swGem 3s ease-in-out infinite;}
@keyframes swGem{0%,100%{opacity:1;}50%{opacity:.62;}}

/* ============ ステートメント ============ */
.sw-state{padding:110px 0;text-align:center;background:var(--white);}
.sw-state__h{font-size:clamp(26px,4.6vw,48px);font-weight:900;line-height:1.55;margin-bottom:24px;}
.sw-state__b{font-size:15px;line-height:2.2;color:var(--muted);max-width:40em;margin:0 auto 34px;}
.sw-state__b b{color:var(--ink);font-weight:700;}
@media (max-width:760px){.sw-state{padding:72px 0;}}

/* ============ マーキー ============ */
.sw-mq{overflow:hidden;background:var(--ink);padding:16px 0;border-top:1px solid var(--ink);}
.sw-mq__t{display:flex;width:max-content;animation:swMq 38s linear infinite;}
.sw-mq__t.is-rev{animation-direction:reverse;}
.sw-mq__t span{display:flex;align-items:center;gap:22px;font-size:15px;font-weight:700;color:#fff;padding-right:22px;white-space:nowrap;}
.sw-mq__t em{font-style:normal;font-size:9px;color:var(--sig);}
@keyframes swMq{to{transform:translateX(-50%);}}

/* ============ 指標カウントアップ ============ */
.sw-nums{padding:104px 0;background:var(--bg);}
.sw-nums__en{font-size:10.5px;letter-spacing:.26em;color:var(--sig);font-weight:700;margin-bottom:12px;}
.sw-nums__h{font-size:clamp(23px,3.4vw,36px);font-weight:900;line-height:1.5;margin-bottom:40px;}
.sw-nums__g{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
.sw-nums__g .sw-stat{background:var(--white);border:1px solid var(--line);border-radius:20px;padding:30px 24px;transition:transform .3s,box-shadow .3s;}
.sw-nums__g .sw-stat:hover{transform:translateY(-4px);box-shadow:0 26px 46px -32px rgba(26,34,51,.5);}
.sw-nums__g .sw-stat__v{font-size:clamp(38px,5vw,54px);font-weight:700;line-height:1;color:var(--ink);letter-spacing:-.03em;margin-bottom:10px;}
.sw-nums__g .sw-stat__v span{font-family:var(--sans);font-size:14px;color:var(--sig);margin-left:5px;letter-spacing:0;}
.sw-nums__g .sw-stat__l{font-size:12.5px;color:var(--muted);}
@media (max-width:820px){.sw-nums{padding:70px 0;}.sw-nums__g{grid-template-columns:repeat(2,1fr);}}

/* ============ 3事業グリッド ============ */
.sw-bz{grid-template-columns:repeat(3,1fr);}
@media (max-width:1000px){.sw-bz{grid-template-columns:1fr;}}

/* ============ SNS 24/365 特集 ============ */
.sw-always{position:relative;padding:110px 0;overflow:hidden;background:#151A2B;color:#D9DEEA;}
.sw-always__bg{position:absolute;inset:0;background:
  radial-gradient(50% 60% at 12% 20%,rgba(124,92,214,.34),transparent 66%),
  radial-gradient(46% 56% at 88% 84%,rgba(224,64,47,.22),transparent 68%);}
.sw-always__in{position:relative;display:grid;grid-template-columns:1.05fr .95fr;gap:52px;align-items:center;}
.sw-always__eb{font-size:10.5px;letter-spacing:.22em;color:#B9A6F0;font-weight:700;margin-bottom:18px;}
.sw-always__h{font-size:clamp(24px,3.4vw,38px);font-weight:900;line-height:1.5;color:#fff;margin-bottom:22px;}
.sw-always__big{display:inline-block;font-size:clamp(38px,6.4vw,74px);line-height:1.05;letter-spacing:-.02em;
  background:linear-gradient(92deg,#fff,#C9B6FF 55%,#FF9C8F);-webkit-background-clip:text;background-clip:text;color:transparent;}
.sw-always__b{font-size:14.5px;line-height:2.15;color:#98A3B8;margin-bottom:30px;max-width:34em;}
.sw-btn--soc{background:#7C5CD6;color:#fff;box-shadow:0 16px 30px -18px rgba(124,92,214,.9);}
.sw-btn--soc:hover{background:#6A4BC4;transform:translateY(-2px);}
@media (max-width:940px){.sw-always{padding:72px 0;}.sw-always__in{grid-template-columns:1fr;gap:34px;}}

/* 稼働タイムライン */
.sw-tl{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:24px 26px;backdrop-filter:blur(6px);}
.sw-tl__k{font-size:9.5px;letter-spacing:.2em;color:#8B93AB;margin-bottom:16px;}
.sw-tl__r{display:grid;grid-template-columns:56px 20px 1fr;align-items:center;gap:10px;padding:11px 0;animation:swSlide .7s both cubic-bezier(.22,1,.36,1);}
.sw-tl__r + .sw-tl__r{border-top:1px solid rgba(255,255,255,.07);}
@keyframes swSlide{from{opacity:0;transform:translateX(14px);}to{opacity:1;transform:none;}}
.sw-tl__t{font-size:12px;color:#C9B6FF;font-weight:700;}
.sw-tl__dot{position:relative;width:8px;height:8px;border-radius:50%;background:#7C5CD6;justify-self:center;}
.sw-tl__dot::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1px solid rgba(124,92,214,.5);animation:swPing 2.4s ease-out infinite;}
@keyframes swPing{0%{transform:scale(.7);opacity:1;}100%{transform:scale(1.7);opacity:0;}}
.sw-tl__d{font-size:12.5px;line-height:1.75;color:#A9B2C6;}
@media (max-width:520px){.sw-tl__r{grid-template-columns:50px 16px 1fr;}.sw-tl__d{font-size:11.5px;}}

/* ヘッダーをヒーロー上で白抜きに */
.sw-hd:not(.is-on) .sw-logo__t{color:#fff;}
.sw-hd:not(.is-on) .sw-logo__t span{color:rgba(255,255,255,.7);}
.sw-hd:not(.is-on) .sw-logo__m{color:#fff;}
.sw-hd:not(.is-on) .sw-burger span{background:#fff;}

/* 運用の流れ */
.sw-ops{display:grid;gap:0;}
.sw-op{display:grid;grid-template-columns:64px 1fr;gap:20px;padding-bottom:28px;}
.sw-op__l{position:relative;display:flex;flex-direction:column;align-items:center;}
.sw-op__n{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:var(--t);color:#fff;font-size:13px;font-weight:700;flex-shrink:0;}
.sw-op__line{position:absolute;top:48px;bottom:-28px;width:2px;background:var(--s);}
.sw-op:last-child .sw-op__line{display:none;}
.sw-op__m{background:var(--bg);border-radius:16px;padding:20px 24px;}
.sw-op__m h3{font-size:18px;font-weight:900;margin-bottom:5px;}
.sw-op__s{font-size:11px;color:var(--t);font-weight:700;margin-bottom:10px;}
.sw-op__d{font-size:13.5px;line-height:2.05;color:var(--muted);}
@media (max-width:600px){.sw-op{grid-template-columns:44px 1fr;gap:14px;}.sw-op__n{width:36px;height:36px;font-size:11px;}.sw-op__line{top:40px;}}
`;
