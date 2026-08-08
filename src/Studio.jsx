import React, { useState, useMemo, useCallback } from "react";

/* ============================================================================
   株式会社SASHIWA — 制作スタジオ v3
   配置：src/Studio.jsx

   ■ 設計の考え方
   お客様も運用者も「何が最適か」は分かりません。そこで
     STEP1 運用設計 … AIがまず最適解を提案し、人が調整する
     STEP2 制作     … 提案された条件を引き継いで、細部を詰めて生成する
     STEP3 投稿予約 … 予約キューに積む
   という順路にしています。

   ■ 推奨エンジンについて
   媒体特性・業種・目的・使える時間から、内蔵のルールで即座に提案します
   （通信もAPI費用も発生しません）。さらに踏み込んだ運用設計書が必要な場合は、
   「詳細な運用設計書をAIに作らせる」からMake経由でDifyに依頼できます。

   ■ セキュリティ
   APIキーはフロントに置きません。生成は必ず Make Webhook 経由です。
   ============================================================================ */

const WEBHOOK_URL = "https://hook.us2.make.com/umnotcrw2pg8twacx68irmjcnnzyjmwv";
const LIVE_SUBMIT = true;
const OWNER = { name: "OWNER（指輪直人）", email: "owner@sashiwa.local" };

/* =========================== プラットフォーム定義 ======================== */

const PLATFORMS = [
  {
    id: "instagram", label: "Instagram", en: "INSTAGRAM", tone: "#C13584", soft: "#FBEAF4",
    hashtag: "5〜10個。大規模タグより中小規模タグを混ぜる",
    times: ["12:00", "20:00"], kpi: "保存数・リーチ",
    win: "1枚目（表紙）で結論を言い切ること。保存される情報密度があるか。",
    strength: { 認知: 4, 見込み客: 3, 販売: 4, 採用: 4, 信頼: 3 },
    effort: 3,
    formats: [
      { id: "reel", label: "リール", ratio: "9:16", dur: "15〜60秒", cap: 2200, spec: "冒頭1秒でフックを出す。字幕は全編必須。音源は商用可のものだけ。" },
      { id: "feed", label: "フィード", ratio: "4:5", cap: 2200, spec: "1枚目で完結させる。文字は最小限で大きく。" },
      { id: "carousel", label: "カルーセル", ratio: "4:5", cap: 2200, pages: "5〜10枚", spec: "表紙→本編→まとめ→CTA。1枚1メッセージ。" },
      { id: "story", label: "ストーリーズ", ratio: "9:16", dur: "15秒", cap: 0, spec: "リンク導線に使う。上下15%は安全マージンを空ける。" },
    ],
  },
  {
    id: "threads", label: "Threads", en: "THREADS", tone: "#1A2233", soft: "#ECEEF2",
    hashtag: "1〜2個。付けすぎない",
    times: ["08:00", "22:00"], kpi: "返信数・いいね",
    win: "会話が始まる余白を残すこと。断定より問いかけ。",
    strength: { 認知: 3, 見込み客: 3, 販売: 2, 採用: 2, 信頼: 3 },
    effort: 1,
    formats: [
      { id: "text", label: "テキスト投稿", cap: 500, spec: "1投稿1論点。改行を多めに取り、スマホで読める塊にする。" },
      { id: "thread", label: "連投（スレッド）", cap: 500, pages: "3〜7投稿", spec: "1本目で全体の結論、以降で分解。最後に問いかけ。" },
      { id: "image", label: "画像つき投稿", ratio: "1:1", cap: 500, spec: "画像は文章の補足ではなく、単体で意味が通ること。" },
    ],
  },
  {
    id: "tiktok", label: "TikTok", en: "TIKTOK", tone: "#E0402F", soft: "#FDECEA",
    hashtag: "3〜5個。ジャンルタグ中心",
    times: ["19:00", "22:00"], kpi: "視聴完了率",
    win: "最後まで見られること。冒頭2秒で離脱が決まる。",
    strength: { 認知: 5, 見込み客: 2, 販売: 3, 採用: 3, 信頼: 2 },
    effort: 4,
    formats: [
      { id: "short", label: "ショート動画", ratio: "9:16", dur: "15〜60秒", cap: 2200, spec: "冒頭2秒でフック。テンポは短めのカット割り。字幕必須。" },
      { id: "long", label: "長尺動画", ratio: "9:16", dur: "1〜3分", cap: 2200, spec: "序盤で結論を提示してから展開する。中だるみを作らない。" },
      { id: "photo", label: "フォトモード", ratio: "9:16", cap: 2200, pages: "5〜10枚", spec: "1枚目で疑問を投げ、めくらせる構成に。" },
    ],
  },
  {
    id: "yt_shorts", label: "YouTube Shorts", en: "YT SHORTS", tone: "#D3241C", soft: "#FCEAE9",
    hashtag: "#Shorts を必ず含める",
    times: ["07:00", "21:00"], kpi: "視聴維持率・チャンネル登録",
    win: "ループして見られる構成。終わりと始まりを繋げる。",
    strength: { 認知: 5, 見込み客: 2, 販売: 2, 採用: 3, 信頼: 3 },
    effort: 4,
    formats: [
      { id: "short", label: "ショート", ratio: "9:16", dur: "〜60秒", cap: 100, spec: "タイトルは40文字以内。冒頭1.5秒でフック。ループ構成を狙う。" },
      { id: "clip", label: "切り抜き", ratio: "9:16", dur: "30〜60秒", cap: 100, spec: "長尺の山場を切り出す。前後に文脈の補足字幕を足す。" },
    ],
  },
  {
    id: "youtube", label: "YouTube", en: "YOUTUBE", tone: "#B3181C", soft: "#FBE9E9",
    hashtag: "3個まで。説明欄の先頭に",
    times: ["19:00"], kpi: "総再生時間・クリック率",
    win: "サムネイルとタイトルの組み合わせで開かれるか。",
    strength: { 認知: 3, 見込み客: 4, 販売: 3, 採用: 4, 信頼: 5 },
    effort: 5,
    formats: [
      { id: "long", label: "通常動画", ratio: "16:9", dur: "8〜15分", cap: 5000, spec: "冒頭30秒で得られるものを明示。章立てとタイムスタンプを付ける。" },
      { id: "thumb", label: "サムネイル案", ratio: "16:9", cap: 0, spec: "文字は13文字以内。スマホの小さい表示で読めるか。" },
      { id: "community", label: "コミュニティ投稿", cap: 1000, spec: "動画への導線か、視聴者への問いかけに絞る。" },
    ],
  },
  {
    id: "x", label: "X（旧Twitter）", en: "X", tone: "#1A2233", soft: "#ECEEF2",
    hashtag: "0〜2個。無しでも良い",
    times: ["08:00", "12:00", "22:00"], kpi: "インプレッション・リポスト",
    win: "1行目だけで価値が伝わること。折り返される前に刺す。",
    strength: { 認知: 4, 見込み客: 4, 販売: 3, 採用: 3, 信頼: 4 },
    effort: 1,
    formats: [
      { id: "post", label: "単発投稿", cap: 140, spec: "1行目で完結。改行で余白を作る。" },
      { id: "thread", label: "スレッド", cap: 140, pages: "5〜10投稿", spec: "1本目で結論と本数を提示。各投稿を単体で読めるように。" },
      { id: "long", label: "長文投稿", cap: 3000, spec: "冒頭140文字で読ませきる。以降に詳細。" },
    ],
  },
  {
    id: "note", label: "note", en: "NOTE", tone: "#0E9F73", soft: "#E7F6F1",
    hashtag: "3〜5個",
    times: ["07:00"], kpi: "スキ・フォロー・読了率",
    win: "見出しだけ読んでも筋が通ること。",
    strength: { 認知: 2, 見込み客: 5, 販売: 3, 採用: 3, 信頼: 5 },
    effort: 3,
    formats: [
      { id: "article", label: "記事", cap: 8000, spec: "冒頭200字で読む理由を提示。見出しは疑問形か結論形で。" },
      { id: "paid", label: "有料記事", cap: 12000, spec: "無料部分で価値を証明し、有料部分に実践手順を置く。" },
    ],
  },
];

/* =============================== 選択肢 ================================= */

const INDUSTRIES = [
  { id: "btob", label: "BtoBサービス", pillars: ["導入前後の変化", "業界の課題整理", "自社の運用の裏側"], bias: ["x", "note", "youtube"] },
  { id: "shigyo", label: "士業・コンサル", pillars: ["よくある相談と回答", "制度・法改正の解説", "失敗事例の共有"], bias: ["note", "x", "youtube"], legal: "各士業の広告規制（誇大広告・成功報酬の表示など）に注意してください。" },
  { id: "food", label: "飲食", pillars: ["調理・仕込みの様子", "季節メニュー", "店主の思想"], bias: ["instagram", "tiktok", "yt_shorts"], legal: "「日本一」などの最上級表現には客観的な根拠が必要です（景品表示法）。" },
  { id: "beauty", label: "美容・サロン", pillars: ["施術のビフォーアフター", "自宅ケアの方法", "スタッフ紹介"], bias: ["instagram", "tiktok", "yt_shorts"], legal: "施術の効果を断定する表現は薬機法に抵触します。ビフォーアフターの掲載条件も要確認。" },
  { id: "retail", label: "小売・EC", pillars: ["商品の使い方", "選び方ガイド", "お客様の声"], bias: ["instagram", "tiktok", "x"], legal: "価格・割引の表示は二重価格表示に注意（景品表示法）。" },
  { id: "school", label: "教育・スクール", pillars: ["ミニ講義", "受講生の変化", "学習法の解説"], bias: ["youtube", "instagram", "note"], legal: "合格率・就職率などの実績表示には根拠と算出条件の明示が必要です。" },
  { id: "estate", label: "不動産", pillars: ["物件の見どころ", "エリア解説", "契約の注意点"], bias: ["youtube", "instagram", "x"], legal: "宅建業法の広告規制（おとり広告・取引態様の明示）に注意してください。" },
  { id: "health", label: "医療・健康", pillars: ["症状の基礎知識", "受診の目安", "予防の習慣"], bias: ["note", "youtube", "x"], legal: "医療広告ガイドライン・薬機法の対象です。効果効能の断定、体験談の掲載は原則できません。検査は必ず「厳格」を選んでください。" },
  { id: "creative", label: "制作・クリエイティブ", pillars: ["制作過程", "ビフォーアフター", "使っている道具"], bias: ["instagram", "x", "yt_shorts"] },
  { id: "other", label: "その他", pillars: ["専門知識の共有", "現場の様子", "お客様との対話"], bias: ["x", "instagram", "note"] },
];

const GOALS = [
  { id: "認知", label: "認知を広げる", note: "まず知ってもらう" },
  { id: "見込み客", label: "見込み客を集める", note: "問い合わせにつなげる" },
  { id: "販売", label: "商品を売る", note: "購入・申込を増やす" },
  { id: "採用", label: "採用したい", note: "応募を集める" },
  { id: "信頼", label: "信頼を積む", note: "専門性を示す" },
];

const RESOURCES = [
  { id: "low", label: "ほぼ取れない", note: "週1時間未満", max: 1, cad: "週2本", eff: 2 },
  { id: "mid", label: "少し取れる", note: "週2〜3時間", max: 2, cad: "週3〜4本", eff: 3 },
  { id: "high", label: "しっかり取れる", note: "週5時間以上", max: 3, cad: "毎日", eff: 5 },
];

const TONES = ["丁寧・ですます", "フランク", "断定的・力強い", "専門的・硬め", "やわらかい・共感"];
const STRUCTS = ["PREP法（結論→理由→例→結論）", "ストーリー型", "リスト型（○選）", "比較型", "実演・手順型", "Q&A型", "逆説型"];
const HOOKS = ["数字を出す", "否定から入る", "疑問形で問う", "実体験を語る", "常識を覆す", "損失を示す", "実績で示す"];
const PERSONS = ["私", "僕", "弊社", "当社", "使わない"];
const EMOJI = ["使わない", "控えめ", "適度に"];
const CTAS = ["プロフィールのリンクへ", "DMで相談", "コメントを促す", "LPへ誘導", "保存を促す", "CTAなし"];
const EXTRAS = ["ハッシュタグ案", "フック案（冒頭）", "サムネ文言", "字幕テキスト", "投稿の狙い・解説", "CTA文案", "次回投稿の案"];
const VARIANTS = [
  { id: "1", label: "1案", note: "すぐ使いたいとき" },
  { id: "3", label: "3案", note: "比較して選びたい（推奨）" },
  { id: "5", label: "5案", note: "方向性から探りたい" },
];
const QA_LEVELS = [
  { id: "standard", label: "標準検査", note: "事実関係と表現の一次確認" },
  { id: "strict", label: "厳格検査", note: "薬機法・景表法・著作権まで二重確認（納品用）" },
];

/* ========================= AI推奨エンジン（内蔵） ======================== */

function recommend({ industry, goal, resource, budgetVideo }) {
  const ind = INDUSTRIES.find((i) => i.id === industry) || INDUSTRIES[9];
  const res = RESOURCES.find((r) => r.id === resource) || RESOURCES[1];

  const scored = PLATFORMS.map((p) => {
    let s = (p.strength[goal] || 2) * 10;
    const bi = ind.bias.indexOf(p.id);
    if (bi >= 0) s += 18 - bi * 5;
    if (p.effort > res.eff) s -= (p.effort - res.eff) * 9;
    if (!budgetVideo && p.effort >= 4) s -= 14;
    return { ...p, score: s };
  }).sort((a, b) => b.score - a.score);

  const picked = scored.slice(0, res.max).map((p, i) => {
    const fmt = pickFormat(p, goal, res);
    return {
      id: p.id,
      label: p.label,
      format: fmt.id,
      formatLabel: fmt.label,
      rank: i + 1,
      why: whyPlatform(p, goal, ind, res, i),
    };
  });

  const tone =
    goal === "採用" ? "やわらかい・共感"
    : goal === "信頼" ? "専門的・硬め"
    : goal === "販売" ? "断定的・力強い"
    : industry === "health" || industry === "shigyo" ? "丁寧・ですます"
    : "丁寧・ですます";

  const times = Array.from(new Set(picked.flatMap((p) => PLATFORMS.find((x) => x.id === p.id).times))).sort().slice(0, 3);

  return {
    platforms: picked,
    cadence: res.cad,
    times,
    tone,
    struct: goal === "販売" ? "PREP法（結論→理由→例→結論）" : goal === "認知" ? "リスト型（○選）" : "ストーリー型",
    hook: goal === "認知" ? "数字を出す" : goal === "信頼" ? "実績で示す" : goal === "販売" ? "損失を示す" : "疑問形で問う",
    cta: goal === "見込み客" ? "DMで相談" : goal === "販売" ? "LPへ誘導" : goal === "認知" ? "保存を促す" : "プロフィールのリンクへ",
    variants: res.id === "low" ? "3" : "3",
    qa: industry === "health" || industry === "shigyo" || industry === "estate" ? "strict" : "standard",
    pillars: ind.pillars,
    kpi: PLATFORMS.find((x) => x.id === picked[0].id).kpi,
    legal: ind.legal || "",
    reason: `${ind.label}で「${GOALS.find((g) => g.id === goal).label}」を狙う場合、${picked[0].label}が最も効きます。使える時間が${res.note}なので、無理なく続く範囲として${res.max}媒体・${res.cad}を上限にしています。`,
  };
}

function pickFormat(p, goal, res) {
  const f = p.formats;
  if (p.id === "instagram") return goal === "認知" ? f[0] : goal === "販売" ? f[2] : goal === "採用" ? f[1] : f[2];
  if (p.id === "x") return goal === "見込み客" || goal === "信頼" ? f[1] : f[0];
  if (p.id === "note") return f[0];
  if (p.id === "youtube") return res.eff >= 5 ? f[0] : f[2];
  if (p.id === "tiktok") return f[0];
  if (p.id === "yt_shorts") return f[0];
  return f[0];
}

function whyPlatform(p, goal, ind, res, rank) {
  const g = GOALS.find((x) => x.id === goal).label;
  if (rank === 0) return `${ind.label}と「${g}」の相性が最も良く、${p.kpi}で成果を測れます。`;
  if (p.effort <= 2) return `手間が軽いので、主軸の投稿を転用して負担なく広げられます。`;
  return `主軸を補完し、${p.kpi}という別の角度で接点を増やせます。`;
}

/* ===================== アカウント初期設定の生成 ========================= */

function buildProfile({ company, service, target, goal, cta }) {
  const g = GOALS.find((x) => x.id === goal);
  return [
    `${target || "◯◯でお悩みの方"}へ｜${company || "（社名）"}`,
    `${service || "（サービス内容）"}`,
    `▼${g ? g.note : "詳しくはこちら"}`,
    `${cta === "LPへ誘導" ? "リンクからご覧ください" : cta === "DMで相談" ? "DMでお気軽にご相談ください" : "プロフィールのリンクへ"}`,
  ].join("\n");
}

/* =============================== 部品 =================================== */

function Sic({ name, size = 18 }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  const p = {
    send: (<><path d="M21.5 2.5 11 13" {...s} /><path d="M21.5 2.5 15 21.5l-4-8.5-8.5-4z" {...s} /></>),
    loader: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.9 2.9M15.5 15.5l2.9 2.9M18.4 5.6l-2.9 2.9M8.5 15.5l-2.9 2.9" {...s} />,
    spark: (<><path d="M12 3.5 13.9 9.3 19.7 11.2 13.9 13.1 12 18.9 10.1 13.1 4.3 11.2 10.1 9.3Z" {...s} /><path d="M18.5 3.5v3M20 5h-3" {...s} /></>),
    clock: (<><circle cx="12" cy="12" r="9" {...s} /><path d="M12 7v5.3l3.4 2" {...s} /></>),
    check: (<><circle cx="12" cy="12" r="9" {...s} /><path d="m8 12.3 2.8 2.8L16 9.8" {...s} /></>),
    warn: (<><path d="M12 3.6 21.4 20H2.6Z" {...s} /><path d="M12 10v4.2M12 17.4v.1" {...s} /></>),
    trash: (<><path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" {...s} /><path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2A1.5 1.5 0 0 0 16.6 19l.9-12.5" {...s} /></>),
    doc: (<><path d="M6 2.8h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1Z" {...s} /><path d="M14 2.8V7h4M8.5 12h7M8.5 16h5" {...s} /></>),
    image: (<><rect x="3" y="4.5" width="18" height="15" rx="2.6" {...s} /><circle cx="8.6" cy="10" r="1.9" {...s} /><path d="m4 17 4.6-4.4 3.4 3.2 3.4-3.6L20 17" {...s} /></>),
    map: (<><path d="M9 3.5 3.5 6v14.5L9 18l6 2.5 5.5-2.5V3.5L15 6Z" {...s} /><path d="M9 3.5V18M15 6v14.5" {...s} /></>),
    copy: (<><rect x="8.5" y="8.5" width="12" height="12" rx="2.4" {...s} /><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" {...s} /></>),
  };
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>{p[name] || p.check}</svg>;
}

function Field({ label, hint, children, ai }) {
  return (
    <label className="stF">
      <span className="stF__l">
        {label}
        {ai && <em className="stAiTag">AI推奨</em>}
      </span>
      {children}
      {hint && <span className="stF__h">{hint}</span>}
    </label>
  );
}

function Chips({ options, value, onChange, multi }) {
  const on = (o) => {
    if (!multi) return onChange(o);
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  };
  return (
    <div className="stChips">
      {options.map((o) => (
        <button key={o} type="button" className={(multi ? value.includes(o) : value === o) ? "is-on" : ""} onClick={() => on(o)}>{o}</button>
      ))}
    </div>
  );
}

/* =============================== 本体 =================================== */

export default function Studio({ pushLog }) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState("OWNER");
  const [client, setClient] = useState({ name: "", email: "", account: "" });

  /* STEP1 前提 */
  const [ctx, setCtx] = useState({
    company: "", industry: "btob", goal: "見込み客", resource: "mid",
    service: "", target: "", pain: "", strength: "", price: "", ng: "", ref: "", budgetVideo: false, raw: "",
  });
  const [plan, setPlan] = useState(null);
  const [touched, setTouched] = useState({});

  /* STEP2 制作条件 */
  const [pfId, setPfId] = useState("instagram");
  const [fmtId, setFmtId] = useState("carousel");
  const [tone, setTone] = useState("丁寧・ですます");
  const [struct, setStruct] = useState("ストーリー型");
  const [hook, setHook] = useState("疑問形で問う");
  const [person, setPerson] = useState("私");
  const [emoji, setEmoji] = useState("控えめ");
  const [cta, setCta] = useState("プロフィールのリンクへ");
  const [len, setLen] = useState("");
  const [extras, setExtras] = useState(["ハッシュタグ案", "フック案（冒頭）"]);
  const [variants, setVariants] = useState("3");
  const [qa, setQa] = useState("standard");
  const [theme, setTheme] = useState("");
  const [points, setPoints] = useState("");
  const [subTab, setSubTab] = useState("content");
  const [imgDesc, setImgDesc] = useState("");
  const [imgStyle, setImgStyle] = useState("写真風");

  /* STEP3 */
  const [schedule, setSchedule] = useState({ at: "", repeat: "なし" });

  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState(null);
  const [jobs, setJobs] = useState([]);

  const pf = useMemo(() => PLATFORMS.find((p) => p.id === pfId) || PLATFORMS[0], [pfId]);
  const fmt = useMemo(() => pf.formats.find((f) => f.id === fmtId) || pf.formats[0], [pf, fmtId]);
  const ind = INDUSTRIES.find((i) => i.id === ctx.industry);

  const note = useCallback((l) => { if (typeof pushLog === "function") pushLog(l); }, [pushLog]);
  const mark = (k) => setTouched((t) => ({ ...t, [k]: true }));

  /* ---- AI推奨を実行 ---- */
  const runPlan = () => {
    const r = recommend(ctx);
    setPlan(r);
    setTouched({});
    const p0 = r.platforms[0];
    setPfId(p0.id);
    setFmtId(p0.format);
    setTone(r.tone);
    setStruct(r.struct);
    setHook(r.hook);
    setCta(r.cta);
    setVariants(r.variants);
    setQa(r.qa);
    note(`[${new Date().toLocaleTimeString()}] PLAN GENERATED: ${r.platforms.map((p) => p.label).join(" / ")} ／ ${r.cadence}`);
  };

  /* ---- 送信 ---- */
  const buildMessage = (job) => {
    const billing = mode === "OWNER" ? "無料（社内利用）" : "課金対象";
    const L = [`【事業】STUDIO／【JOB】${job}／【課金】${billing}`];

    if (job === "PLAN") {
      L.push(`【依頼】SNS運用設計書の作成`);
      L.push(`【会社】${ctx.company}／【業種】${ind.label}／【目的】${ctx.goal}／【使える時間】${RESOURCES.find((r) => r.id === ctx.resource).note}`);
      L.push(`【商品・サービス】${ctx.service}／【価格帯】${ctx.price}`);
      L.push(`【ターゲット】${ctx.target}／【顧客の悩み】${ctx.pain}／【自社の強み】${ctx.strength}`);
      if (ctx.ref) L.push(`【参考アカウント】${ctx.ref}`);
      if (ctx.ng) L.push(`【NG】${ctx.ng}`);
      if (plan) {
        L.push(`【一次案（社内エンジン）】媒体=${plan.platforms.map((p) => `${p.label}:${p.formatLabel}`).join(" / ")}／頻度=${plan.cadence}／時間帯=${plan.times.join(",")}／柱=${plan.pillars.join(" / ")}`);
      }
      L.push(`【出力してほしいも】媒体ごとの運用方針・プロフィール文案・固定投稿案・30日分の投稿テーマ案・KPIと計測方法・法令上の注意点`);
      if (ind.legal) L.push(`【業種特有の注意】${ind.legal}`);
      if (ctx.raw) L.push(`【原文依頼】${ctx.raw.replace(/\n/g, " ")}`);
      return L.join("／");
    }

    L.push(`【媒体】${pf.label}／【形式】${fmt.label}` +
      (fmt.ratio ? `／【比率】${fmt.ratio}` : "") + (fmt.dur ? `／【尺】${fmt.dur}` : "") +
      (fmt.cap ? `／【文字数上限】${fmt.cap}` : "") + (fmt.pages ? `／【枚数・本数】${fmt.pages}` : ""));
    L.push(`【媒体仕様】${fmt.spec}／【勝ち筋】${pf.win}／【KPI】${pf.kpi}／【ハッシュタグ方針】${pf.hashtag}`);
    L.push(`【業種】${ind.label}／【目的】${ctx.goal}／【ターゲット】${ctx.target || "未指定"}`);
    if (ctx.pain) L.push(`【顧客の悩み】${ctx.pain}`);
    if (ctx.strength) L.push(`【自社の強み】${ctx.strength}`);
    L.push(`【トーン】${tone}／【構成】${struct}／【フックの型】${hook}／【一人称】${person}／【絵文字】${emoji}／【CTA】${cta}`);
    if (len) L.push(`【目安文字数】${len}`);
    if (ctx.ng) L.push(`【NG】${ctx.ng}`);
    L.push(`【案数】${variants}案／【検査】${qa === "strict" ? "厳格（薬機法・景表法・著作権まで二重確認）" : "標準"}`);
    if (ind.legal) L.push(`【業種特有の注意】${ind.legal}`);

    if (job === "CONTENT") {
      L.push(`【追加で出す成果物】${extras.join(" / ") || "なし"}`);
      L.push(`【テーマ】${theme}`);
      if (points) L.push(`【伝えたい要点】${points.replace(/\n/g, " ／ ")}`);
    }
    if (job === "IMAGE") {
      L.push(`【画像スタイル】${imgStyle}／【描画内容】${imgDesc}`);
    }
    if (job === "POST") {
      L.push(`【投稿日時】${schedule.at}／【繰り返し】${schedule.repeat}／【本文】${theme}`);
    }
    if (mode === "CLIENT" && client.account) L.push(`【運用アカウント】${client.account}`);
    if (ctx.raw) L.push(`【原文依頼】${ctx.raw.replace(/\n/g, " ")}`);
    return L.join("／");
  };

  const send = async (job, label) => {
    if (sending) return;
    if (mode === "CLIENT" && !client.name.trim()) return setFlash({ ok: false, msg: "お客様名を入力してください。" });
    if (job === "CONTENT" && !theme.trim()) return setFlash({ ok: false, msg: "テーマを入力してください。" });
    if (job === "IMAGE" && !imgDesc.trim()) return setFlash({ ok: false, msg: "画像の内容を入力してください。" });
    if (job === "POST") {
      if (!theme.trim()) return setFlash({ ok: false, msg: "投稿本文を入力してください。" });
      if (!schedule.at) return setFlash({ ok: false, msg: "投稿日時を指定してください。" });
      if (new Date(schedule.at).getTime() < Date.now()) return setFlash({ ok: false, msg: "過去の日時は指定できません。" });
      if (fmt.cap && theme.length > fmt.cap) return setFlash({ ok: false, msg: `上限 ${fmt.cap} 文字を超えています。` });
    }

    setSending(true); setFlash(null);
    const t0 = Date.now();
    const payload = {
      client_name: mode === "OWNER" ? OWNER.name : client.name,
      client_email: mode === "OWNER" ? OWNER.email : client.email || OWNER.email,
      message: buildMessage(job),
    };
    let ok = true;
    if (LIVE_SUBMIT) {
      try {
        const r = await fetch(WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        ok = r.ok;
      } catch (e) { ok = false; }
    }
    await new Promise((r) => setTimeout(r, Math.max(0, 1100 - (Date.now() - t0))));

    const now = new Date();
    setJobs((j) => [{
      id: String(now.getTime()), pf: job === "PLAN" ? "運用設計" : pf.label, tone: job === "PLAN" ? "#7C5CD6" : pf.tone,
      soft: job === "PLAN" ? "#F1EDFC" : pf.soft, kind: label,
      title: (job === "IMAGE" ? imgDesc : job === "PLAN" ? ctx.company || "自社" : theme).slice(0, 40),
      at: job === "POST" ? schedule.at.replace("T", " ") : now.toLocaleString("ja-JP", { hour12: false }).slice(0, 16),
      status: ok ? (job === "POST" ? "予約済み" : "制作中") : "送信失敗",
      billing: mode === "OWNER" ? "無料" : "課金", isPost: job === "POST",
    }, ...j].slice(0, 40));

    note(`[${now.toLocaleTimeString()}] STUDIO ${job} ${ok ? "SUBMITTED" : "FAILED"}`);
    setFlash({ ok, msg: ok ? (job === "POST" ? "予約しました。" : "依頼を送信しました。完成するとメールとGoogle Driveに届きます。") : "送信できませんでした。" });
    if (job === "CONTENT") { setTheme(""); setPoints(""); }
    if (job === "IMAGE") setImgDesc("");
    if (job === "POST") { setTheme(""); setSchedule({ at: "", repeat: "なし" }); }
    setSending(false);
    setTimeout(() => setFlash(null), 7000);
  };

  const scheduled = jobs.filter((j) => j.isPost && j.status === "予約済み");
  const profileText = buildProfile({ company: ctx.company, service: ctx.service, target: ctx.target, goal: ctx.goal, cta });

  return (
    <div className="stRoot" style={{ "--t": pf.tone, "--s": pf.soft }}>
      <style>{CSS}</style>

      <header className="stHead">
        <p className="stHead__en">PRODUCTION STUDIO</p>
        <h1>制作スタジオ</h1>
        <p className="stHead__s">最適な条件をAIが提案し、そこから調整して制作します。</p>
      </header>

      {/* モード */}
      <div className="stMode">
        <div className="stMode__l">
          <button className={mode === "OWNER" ? "is-on" : ""} onClick={() => setMode("OWNER")}>社内利用（無料）</button>
          <button className={mode === "CLIENT" ? "is-on" : ""} onClick={() => setMode("CLIENT")}>お客様の案件</button>
        </div>
        {mode === "OWNER" ? (
          <p className="stMode__n">自社アカウントの運用モードです。案件計上・請求の対象になりません。</p>
        ) : (
          <div className="stMode__c">
            <input type="text" placeholder="お客様名" value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
            <input type="text" placeholder="運用アカウント名" value={client.account} onChange={(e) => setClient({ ...client, account: e.target.value })} />
            <input type="email" placeholder="納品先メール" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} />
          </div>
        )}
      </div>

      {/* ステップ */}
      <div className="stSteps">
        {[
          { n: 1, l: "運用設計", s: "何をどこにどれだけ" },
          { n: 2, l: "制作", s: "条件を詰めて生成" },
          { n: 3, l: "投稿予約", s: "キューに積む" },
        ].map((s) => (
          <button key={s.n} className={`stStep ${step === s.n ? "is-on" : ""} ${step > s.n ? "is-done" : ""}`} onClick={() => setStep(s.n)}>
            <span className="stStep__n">{step > s.n ? <Sic name="check" size={15} /> : s.n}</span>
            <span><b>{s.l}</b><em>{s.s}</em></span>
          </button>
        ))}
      </div>

      <div className="stGrid">
        <section className="stCard">
          {/* ============== STEP 1 ============== */}
          {step === 1 && (
            <>
              <div className="stRow">
                <Field label="会社・屋号">
                  <input type="text" value={ctx.company} onChange={(e) => setCtx({ ...ctx, company: e.target.value })} placeholder="株式会社SASHIWA" />
                </Field>
                <Field label="業種">
                  <select value={ctx.industry} onChange={(e) => setCtx({ ...ctx, industry: e.target.value })}>
                    {INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="いちばんの目的">
                <div className="stCards">
                  {GOALS.map((g) => (
                    <button key={g.id} type="button" className={ctx.goal === g.id ? "is-on" : ""} onClick={() => setCtx({ ...ctx, goal: g.id })}>
                      <b>{g.label}</b><em>{g.note}</em>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="運用に使える時間" hint="無理のない範囲を選んでください。続かない計画は意味がありません">
                <div className="stCards">
                  {RESOURCES.map((r) => (
                    <button key={r.id} type="button" className={ctx.resource === r.id ? "is-on" : ""} onClick={() => setCtx({ ...ctx, resource: r.id })}>
                      <b>{r.label}</b><em>{r.note}</em>
                    </button>
                  ))}
                </div>
              </Field>

              <div className="stRow">
                <Field label="商品・サービス"><input type="text" value={ctx.service} onChange={(e) => setCtx({ ...ctx, service: e.target.value })} placeholder="AI社員構築代行" /></Field>
                <Field label="価格帯"><input type="text" value={ctx.price} onChange={(e) => setCtx({ ...ctx, price: e.target.value })} placeholder="30万円〜" /></Field>
              </div>
              <div className="stRow">
                <Field label="ターゲット"><input type="text" value={ctx.target} onChange={(e) => setCtx({ ...ctx, target: e.target.value })} placeholder="従業員10〜50名の中小企業の経営者" /></Field>
                <Field label="参考にしたいアカウント" hint="任意"><input type="text" value={ctx.ref} onChange={(e) => setCtx({ ...ctx, ref: e.target.value })} placeholder="@example" /></Field>
              </div>
              <Field label="顧客が抱えている悩み"><textarea rows={2} value={ctx.pain} onChange={(e) => setCtx({ ...ctx, pain: e.target.value })} placeholder="人手が足りないが、採用する余裕もない" /></Field>
              <Field label="自社の強み・他と違う点"><textarea rows={2} value={ctx.strength} onChange={(e) => setCtx({ ...ctx, strength: e.target.value })} placeholder="自社の業務を実際に100%AIで回している" /></Field>
              <Field label="NG・避けたい表現"><input type="text" value={ctx.ng} onChange={(e) => setCtx({ ...ctx, ng: e.target.value })} placeholder="煽り表現、効果の断定" /></Field>
              <label className="stCheck">
                <input type="checkbox" checked={ctx.budgetVideo} onChange={(e) => setCtx({ ...ctx, budgetVideo: e.target.checked })} />
                <span>動画制作もできる（撮影・編集の手が確保できる）</span>
              </label>
              <Field label="依頼文をそのまま貼り付け" hint="任意。メールやチャットの原文をそのまま入れて構いません">
                <textarea rows={3} value={ctx.raw} onChange={(e) => setCtx({ ...ctx, raw: e.target.value })} placeholder="お客様からいただいたご要望をそのまま貼り付けてください。" />
              </Field>

              <button className="stBig" onClick={runPlan}>
                <Sic name="spark" size={17} />
                AIに最適な運用プランを提案させる
              </button>

              {plan && (
                <div className="stPlan">
                  <p className="stPlan__k"><Sic name="spark" size={14} />AIの提案</p>
                  <p className="stPlan__r">{plan.reason}</p>

                  <div className="stPlan__pf">
                    {plan.platforms.map((p) => {
                      const P = PLATFORMS.find((x) => x.id === p.id);
                      return (
                        <div className="stPlan__c" key={p.id} style={{ "--t": P.tone, "--s": P.soft }}>
                          <div className="stPlan__ch">
                            <span className="stPlan__rank">{p.rank === 1 ? "主軸" : `第${p.rank}`}</span>
                            <b>{p.label}</b>
                            <em>{p.formatLabel}</em>
                          </div>
                          <p>{p.why}</p>
                          <button className="stPlan__use" onClick={() => { setPfId(p.id); setFmtId(p.format); setStep(2); }}>
                            この媒体で制作する →
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="stPlan__g">
                    <Field label="投稿頻度" ai={!touched.cad}>
                      <input type="text" value={plan.cadence} onChange={(e) => { setPlan({ ...plan, cadence: e.target.value }); mark("cad"); }} />
                    </Field>
                    <Field label="投稿する時間帯" ai={!touched.times}>
                      <input type="text" value={plan.times.join(", ")} onChange={(e) => { setPlan({ ...plan, times: e.target.value.split(",").map((x) => x.trim()) }); mark("times"); }} />
                    </Field>
                  </div>

                  <Field label="コンテンツの柱" ai={!touched.pillars} hint="この3本を軸に投稿を作り分けます。書き換えられます">
                    <textarea rows={3} value={plan.pillars.join("\n")} onChange={(e) => { setPlan({ ...plan, pillars: e.target.value.split("\n") }); mark("pillars"); }} />
                  </Field>

                  <Field label="プロフィール文案" hint="そのままコピーして使えます">
                    <textarea rows={4} value={profileText} readOnly />
                  </Field>

                  {plan.legal && (
                    <div className="stWarn">
                      <Sic name="warn" size={17} />
                      <p><b>{ind.label}の広告規制について</b>{plan.legal}</p>
                    </div>
                  )}

                  <div className="stPlan__f">
                    <button className="stSend" onClick={() => send("PLAN", "運用設計書")} disabled={sending}>
                      <span className={sending ? "stSpin" : ""}><Sic name={sending ? "loader" : "map"} size={16} /></span>
                      {sending ? "送信中..." : "詳細な運用設計書をAIに作らせる"}
                    </button>
                    <button className="stNext" onClick={() => setStep(2)}>この条件で制作に進む →</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ============== STEP 2 ============== */}
          {step === 2 && (
            <>
              <div className="stPf">
                {PLATFORMS.map((p) => (
                  <button key={p.id} className={`stPf__b ${pfId === p.id ? "is-on" : ""}`} style={{ "--t": p.tone, "--s": p.soft }}
                    onClick={() => { setPfId(p.id); setFmtId(p.formats[0].id); }}>
                    <span className="stPf__d" /><b>{p.label}</b>
                    {plan && plan.platforms.some((x) => x.id === p.id) && <em className="stAiTag">推奨</em>}
                  </button>
                ))}
              </div>

              <Field label="形式">
                <div className="stChips">
                  {pf.formats.map((f) => (
                    <button key={f.id} type="button" className={fmtId === f.id ? "is-on" : ""} onClick={() => setFmtId(f.id)}>{f.label}</button>
                  ))}
                </div>
              </Field>

              <div className="stTabs">
                {[{ id: "content", label: "コンテンツ", ic: "doc" }, { id: "image", label: "画像・サムネ", ic: "image" }].map((t) => (
                  <button key={t.id} className={subTab === t.id ? "is-on" : ""} onClick={() => { setSubTab(t.id); setFlash(null); }}>
                    <Sic name={t.ic} size={15} />{t.label}
                  </button>
                ))}
              </div>

              {subTab === "content" ? (
                <>
                  <Field label="テーマ" hint="何について発信するか。1行で">
                    <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="問い合わせ対応を自動化したら何時間浮いたか" />
                  </Field>
                  <Field label="伝えたい要点" hint="1行ずつ。構成に反映されます">
                    <textarea rows={4} value={points} onChange={(e) => setPoints(e.target.value)} placeholder={"深夜の問い合わせにも即返信\n担当者の確認は朝1回だけ\n月20時間が浮いた"} />
                  </Field>

                  <div className="stDetail">
                    <p className="stDetail__k">細かい条件</p>
                    <Field label="トーン" ai={plan && !touched.tone}><Chips options={TONES} value={tone} onChange={(v) => { setTone(v); mark("tone"); }} /></Field>
                    <Field label="構成の型" ai={plan && !touched.struct}><Chips options={STRUCTS} value={struct} onChange={(v) => { setStruct(v); mark("struct"); }} /></Field>
                    <Field label="冒頭フックの型" ai={plan && !touched.hook}><Chips options={HOOKS} value={hook} onChange={(v) => { setHook(v); mark("hook"); }} /></Field>
                    <div className="stRow">
                      <Field label="一人称"><Chips options={PERSONS} value={person} onChange={setPerson} /></Field>
                      <Field label="絵文字"><Chips options={EMOJI} value={emoji} onChange={setEmoji} /></Field>
                    </div>
                    <Field label="CTA（読後にしてほしいこと）" ai={plan && !touched.cta}><Chips options={CTAS} value={cta} onChange={(v) => { setCta(v); mark("cta"); }} /></Field>
                    <div className="stRow">
                      <Field label="目安文字数" hint={fmt.cap ? `上限 ${fmt.cap} 文字` : "指定なし"}>
                        <input type="text" value={len} onChange={(e) => setLen(e.target.value)} placeholder={fmt.cap ? String(Math.round(fmt.cap * 0.6)) : "800"} />
                      </Field>
                      <Field label="一緒に出す成果物"><Chips options={EXTRAS} value={extras} onChange={setExtras} multi /></Field>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Field label="スタイル"><Chips options={["写真風", "イラスト", "フラットデザイン", "図解・ダイアグラム", "文字主体"]} value={imgStyle} onChange={setImgStyle} /></Field>
                  <Field label="描いてほしい内容" hint="被写体・構図・色味・雰囲気を具体的に">
                    <textarea rows={4} value={imgDesc} onChange={(e) => setImgDesc(e.target.value)} placeholder="朝のオフィス。誰もいないデスクでモニターだけが光っている。俯瞰気味、寒色系。" />
                  </Field>
                  <div className="stWarn">
                    <Sic name="warn" size={17} />
                    <p>実在の人物・キャラクター・企業ロゴは指定できません。納品前に、生成物が既存の作品に似すぎていないか必ず目視で確認してください。</p>
                  </div>
                </>
              )}

              <div className="stQ">
                <p className="stQ__k">品質オプション</p>
                <div className="stQ__g">
                  <div>
                    <span className="stQ__l">生成する案の数{plan && !touched.var && <em className="stAiTag">AI推奨</em>}</span>
                    <div className="stSeg">
                      {VARIANTS.map((v) => <button key={v.id} className={variants === v.id ? "is-on" : ""} onClick={() => { setVariants(v.id); mark("var"); }}>{v.label}</button>)}
                    </div>
                    <span className="stQ__n">{VARIANTS.find((v) => v.id === variants).note}</span>
                  </div>
                  <div>
                    <span className="stQ__l">検査レベル{plan && !touched.qa && <em className="stAiTag">AI推奨</em>}</span>
                    <div className="stSeg">
                      {QA_LEVELS.map((q) => <button key={q.id} className={qa === q.id ? "is-on" : ""} onClick={() => { setQa(q.id); mark("qa"); }}>{q.label}</button>)}
                    </div>
                    <span className="stQ__n">{QA_LEVELS.find((q) => q.id === qa).note}</span>
                  </div>
                </div>
              </div>

              <div className="stFoot">
                <p className="stFoot__c"><span>納品前</span>{qa === "strict" ? "QA_Ethics_AIが二重検査します" : "QA_Ethics_AIが一次検査します"}</p>
                <button className="stSend" onClick={() => send(subTab === "content" ? "CONTENT" : "IMAGE", subTab === "content" ? `${fmt.label}・${variants}案` : "画像")} disabled={sending}>
                  <span className={sending ? "stSpin" : ""}><Sic name={sending ? "loader" : "send"} size={16} /></span>
                  {sending ? "送信中..." : subTab === "content" ? `${variants}案の制作を依頼` : "画像の制作を依頼"}
                </button>
              </div>
            </>
          )}

          {/* ============== STEP 3 ============== */}
          {step === 3 && (
            <>
              <Field label="投稿先">
                <div className="stChips">
                  {PLATFORMS.map((p) => (
                    <button key={p.id} type="button" className={pfId === p.id ? "is-on" : ""} onClick={() => { setPfId(p.id); setFmtId(p.formats[0].id); }}>{p.label}</button>
                  ))}
                </div>
              </Field>
              <Field label="投稿本文">
                <textarea rows={6} value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="投稿する本文をそのまま入力してください。" />
              </Field>
              {fmt.cap > 0 && <p className={`stCount ${theme.length > fmt.cap ? "is-over" : ""}`}>{theme.length} / {fmt.cap} 文字</p>}
              <div className="stRow">
                <Field label="投稿日時"><input type="datetime-local" value={schedule.at} onChange={(e) => setSchedule({ ...schedule, at: e.target.value })} /></Field>
                <Field label="繰り返し">
                  <select value={schedule.repeat} onChange={(e) => setSchedule({ ...schedule, repeat: e.target.value })}>
                    <option>なし</option><option>毎日</option><option>平日のみ</option><option>毎週</option>
                  </select>
                </Field>
              </div>
              <div className="stWarn">
                <Sic name="warn" size={17} />
                <p>各SNSの自動投稿に関する規約は変更されることがあります。運用開始前と規約改定時には必ずご確認ください。</p>
              </div>
              <div className="stFoot">
                <p className="stFoot__c"><span>配信</span>指定時刻の直近の配信タイミングで投稿されます</p>
                <button className="stSend" onClick={() => send("POST", "予約投稿")} disabled={sending}>
                  <span className={sending ? "stSpin" : ""}><Sic name={sending ? "loader" : "clock"} size={16} /></span>
                  {sending ? "送信中..." : "予約する"}
                </button>
              </div>
            </>
          )}

          {flash && <p className={`stFlash ${flash.ok ? "" : "is-ng"}`}>{flash.msg}</p>}
        </section>

        {/* ---------- 右カラム ---------- */}
        <aside className="stSide">
          {step !== 1 && (
            <section className="stCard stCard--sm stSpec">
              <h2 className="stCardT">{pf.label} ／ {fmt.label}<em>SPEC</em></h2>
              <dl className="stSpec__l">
                {fmt.ratio && <div><dt>比率</dt><dd>{fmt.ratio}</dd></div>}
                {fmt.dur && <div><dt>尺</dt><dd>{fmt.dur}</dd></div>}
                {fmt.pages && <div><dt>枚数・本数</dt><dd>{fmt.pages}</dd></div>}
                {fmt.cap > 0 && <div><dt>文字数上限</dt><dd>{fmt.cap}</dd></div>}
                <div><dt>ハッシュタグ</dt><dd>{pf.hashtag}</dd></div>
                <div><dt>狙い目の時間</dt><dd>{pf.times.join(" / ")}</dd></div>
                <div><dt>KPI</dt><dd>{pf.kpi}</dd></div>
              </dl>
              <p className="stSpec__s"><b>制作ルール</b>{fmt.spec}</p>
              <p className="stSpec__w"><b>この媒体の勝ち筋</b>{pf.win}</p>
            </section>
          )}

          {plan && (
            <section className="stCard stCard--sm">
              <h2 className="stCardT">現在のプラン<em>PLAN</em></h2>
              <ul className="stMini">
                <li><span>媒体</span>{plan.platforms.map((p) => p.label).join(" / ")}</li>
                <li><span>頻度</span>{plan.cadence}</li>
                <li><span>時間帯</span>{plan.times.join(" / ")}</li>
                <li><span>KPI</span>{plan.kpi}</li>
              </ul>
            </section>
          )}

          <section className="stCard stCard--sm">
            <h2 className="stCardT">予約中の投稿<em>{scheduled.length}</em></h2>
            {scheduled.length === 0 ? <p className="stEmpty">予約された投稿はありません。</p> : (
              <ul className="stSch">
                {scheduled.map((j) => (
                  <li key={j.id}>
                    <span className="stSch__t"><Sic name="clock" size={13} />{j.at}</span>
                    <span className="stSch__d">{j.pf}／{j.title}</span>
                    <button className="stSch__x" aria-label="取り消す" onClick={() => setJobs((v) => v.filter((x) => x.id !== j.id))}><Sic name="trash" size={13} /></button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="stCard stCard--sm">
            <h2 className="stCardT">送信した依頼<em>{jobs.length}</em></h2>
            {jobs.length === 0 ? <p className="stEmpty">まだ依頼がありません。</p> : (
              <ul className="stJobs">
                {jobs.map((j) => (
                  <li key={j.id} style={{ "--t": j.tone, "--s": j.soft }}>
                    <div className="stJobs__h"><em className="stJobs__k">{j.pf}</em><span className={`stJobs__s ${j.status === "送信失敗" ? "is-ng" : ""}`}>{j.status}</span></div>
                    <p className="stJobs__t">{j.kind}／{j.title}</p>
                    <p className="stJobs__m">{j.at}<span>{j.billing}</span></p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ================================ CSS ================================== */

const CSS = `
.stRoot{--bg:#F4F6F9;--white:#fff;--ink:#1A2233;--muted:#616B7D;--line:#E2E6EC;--sig:#E0402F;--ai:#7C5CD6;
  --sans:'Noto Sans JP',"Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;
  --mono:'JetBrains Mono',ui-monospace,Menlo,monospace;font-family:var(--sans);color:var(--ink);}
.stRoot *,.stRoot *::before,.stRoot *::after{box-sizing:border-box;}
.stRoot h1,.stRoot h2,.stRoot p,.stRoot ul,.stRoot li,.stRoot dl,.stRoot dd,.stRoot dt{margin:0;padding:0;}
.stRoot ul{list-style:none;}
.stRoot button{font:inherit;color:inherit;background:none;border:none;cursor:pointer;text-align:left;}
.stRoot :focus-visible{outline:2px solid var(--t);outline-offset:2px;}
.stSpin{display:inline-flex;animation:stSpin 1s linear infinite;}
@keyframes stSpin{to{transform:rotate(360deg);}}
.stAiTag{font-style:normal;font-size:9px;font-weight:700;color:#fff;background:var(--ai);border-radius:999px;padding:2px 7px;margin-left:7px;letter-spacing:.04em;}

.stHead{margin-bottom:20px;}
.stHead__en{font-family:var(--mono);font-size:10px;letter-spacing:.2em;color:var(--t);font-weight:700;margin-bottom:8px;}
.stHead h1{font-size:clamp(23px,3vw,31px);font-weight:900;line-height:1.35;}
.stHead__s{font-size:13.5px;color:var(--muted);margin-top:8px;}

.stMode{background:var(--white);border:1px solid var(--line);border-radius:16px;padding:14px 16px;margin-bottom:14px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
.stMode__l{display:flex;gap:5px;background:var(--bg);border-radius:999px;padding:4px;}
.stMode__l button{font-size:12.5px;font-weight:700;padding:8px 17px;border-radius:999px;color:var(--muted);transition:all .2s;}
.stMode__l button.is-on{background:var(--ink);color:#fff;}
.stMode__n{font-size:12px;color:var(--muted);}
.stMode__c{display:flex;gap:8px;flex:1;min-width:280px;flex-wrap:wrap;}
.stMode__c input{flex:1;min-width:130px;background:var(--bg);border:1.5px solid transparent;border-radius:10px;padding:10px 12px;font:inherit;font-size:13px;}
.stMode__c input:focus{outline:none;border-color:var(--t);background:var(--white);}

/* ステップ */
.stSteps{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;}
.stStep{display:flex;align-items:center;gap:11px;background:var(--white);border:1.5px solid var(--line);border-radius:16px;padding:13px 16px;transition:all .2s;}
.stStep:hover{border-color:var(--ai);}
.stStep.is-on{border-color:var(--ai);background:#F5F1FE;}
.stStep__n{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:var(--bg);color:var(--muted);font-family:var(--mono);font-size:13px;font-weight:700;flex-shrink:0;}
.stStep.is-on .stStep__n{background:var(--ai);color:#fff;}
.stStep.is-done .stStep__n{background:#E8F7F0;color:#0E9F73;}
.stStep b{display:block;font-size:13.5px;font-weight:700;}
.stStep em{font-style:normal;font-size:10.5px;color:var(--muted);}
@media (max-width:760px){.stSteps{grid-template-columns:1fr;}}

.stGrid{display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start;}
@media (max-width:1150px){.stGrid{grid-template-columns:1fr;}}
.stCard{background:var(--white);border:1px solid var(--line);border-radius:20px;padding:22px;}
.stCard--sm{padding:18px;margin-bottom:13px;}
.stCardT{font-size:13px;font-weight:700;margin-bottom:13px;display:flex;align-items:center;gap:8px;}
.stCardT em{font-style:normal;font-family:var(--mono);font-size:9px;color:var(--t);background:var(--s);border-radius:999px;padding:2px 9px;margin-left:auto;}

.stF{display:block;margin-bottom:17px;}
.stF__l{display:flex;align-items:center;font-size:12px;font-weight:700;margin-bottom:8px;}
.stF__h{display:block;font-size:11px;color:var(--muted);margin-top:6px;line-height:1.7;}
.stRoot input[type=text],.stRoot input[type=email],.stRoot input[type=datetime-local],.stRoot textarea,.stRoot select{
  width:100%;background:var(--bg);border:1.5px solid transparent;border-radius:12px;padding:12px 14px;
  font-family:var(--sans);font-size:14px;line-height:1.8;color:var(--ink);resize:vertical;transition:all .2s;}
.stRoot textarea::placeholder,.stRoot input::placeholder{color:#9BA3B1;}
.stRoot input:focus,.stRoot textarea:focus,.stRoot select:focus{outline:none;background:var(--white);border-color:var(--t);box-shadow:0 0 0 4px var(--s);}
.stRow{display:grid;grid-template-columns:1fr 1fr;gap:13px;}
@media (max-width:640px){.stRow{grid-template-columns:1fr;}}

.stChips{display:flex;flex-wrap:wrap;gap:7px;}
.stChips button{font-size:12.5px;border:1.5px solid var(--line);border-radius:999px;padding:7px 15px;color:var(--muted);transition:all .2s;}
.stChips button:hover{border-color:var(--t);color:var(--t);}
.stChips button.is-on{background:var(--t);border-color:var(--t);color:#fff;font-weight:700;}

.stCards{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:8px;}
.stCards button{border:1.5px solid var(--line);border-radius:13px;padding:12px 14px;transition:all .2s;}
.stCards button:hover{border-color:var(--ai);}
.stCards button.is-on{border-color:var(--ai);background:#F5F1FE;}
.stCards b{display:block;font-size:13px;font-weight:700;margin-bottom:2px;}
.stCards em{font-style:normal;font-size:11px;color:var(--muted);}

.stCheck{display:flex;align-items:center;gap:10px;font-size:13.5px;margin-bottom:17px;cursor:pointer;}
.stCheck input{width:18px;height:18px;accent-color:var(--ai);}
.stCount{font-family:var(--mono);font-size:11.5px;color:var(--muted);text-align:right;margin:-9px 0 17px !important;}
.stCount.is-over{color:var(--sig);font-weight:700;}
.stWarn{display:flex;gap:11px;align-items:flex-start;background:#FFF7E8;border:1px solid #F2DCAE;border-radius:12px;padding:13px 15px;margin-bottom:17px;}
.stWarn svg{color:#B47C10;margin-top:3px;}
.stWarn p{font-size:12px;line-height:1.9;color:#7A5A12;}
.stWarn b{display:block;margin-bottom:3px;}

/* 大ボタン */
.stBig{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:var(--ai);color:#fff;font-size:14.5px;font-weight:700;border-radius:14px;padding:16px;transition:all .2s;box-shadow:0 14px 28px -16px rgba(124,92,214,.85);}
.stBig:hover{filter:brightness(.94);transform:translateY(-1px);}

/* 提案 */
.stPlan{margin-top:20px;padding-top:20px;border-top:2px dashed var(--line);}
.stPlan__k{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--ai);margin-bottom:10px;}
.stPlan__r{font-size:13px;line-height:1.95;color:var(--muted);background:#F5F1FE;border-radius:12px;padding:14px 16px;margin-bottom:16px;}
.stPlan__pf{display:grid;gap:10px;margin-bottom:18px;}
.stPlan__c{border:1.5px solid var(--line);border-left:3px solid var(--t);border-radius:12px;padding:14px 16px;}
.stPlan__ch{display:flex;align-items:center;gap:9px;margin-bottom:6px;flex-wrap:wrap;}
.stPlan__rank{font-size:9.5px;font-weight:700;color:#fff;background:var(--t);border-radius:999px;padding:2px 9px;}
.stPlan__ch b{font-size:14px;font-weight:700;}
.stPlan__ch em{font-style:normal;font-size:11.5px;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:2px 9px;}
.stPlan__c p{font-size:12.5px;line-height:1.85;color:var(--muted);margin-bottom:8px;}
.stPlan__use{font-size:12px;font-weight:700;color:var(--t);}
.stPlan__g{display:grid;grid-template-columns:1fr 1fr;gap:13px;}
@media (max-width:640px){.stPlan__g{grid-template-columns:1fr;}}
.stPlan__f{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:6px;}
.stNext{font-size:13px;font-weight:700;color:var(--ai);padding:12px 18px;border:1.5px solid var(--ai);border-radius:999px;transition:all .2s;}
.stNext:hover{background:var(--ai);color:#fff;}

/* 詳細条件 */
.stDetail{background:var(--bg);border-radius:14px;padding:16px;margin-bottom:18px;}
.stDetail__k{font-family:var(--mono);font-size:9.5px;letter-spacing:.16em;color:var(--muted);margin-bottom:13px;}
.stDetail .stF:last-child{margin-bottom:0;}

.stPf{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:16px;}
.stPf__b{display:flex;align-items:center;gap:8px;background:var(--white);border:1.5px solid var(--line);border-radius:999px;padding:9px 16px;white-space:nowrap;transition:all .2s;}
.stPf__b:hover{border-color:var(--t);}
.stPf__b.is-on{border-color:var(--t);background:var(--s);}
.stPf__d{width:8px;height:8px;border-radius:50%;background:var(--t);}
.stPf__b b{font-size:13px;font-weight:700;}
.stPf::-webkit-scrollbar{height:5px;}
.stPf::-webkit-scrollbar-thumb{background:#CBD2DC;border-radius:6px;}

.stTabs{display:flex;gap:6px;background:var(--bg);border-radius:12px;padding:4px;margin-bottom:20px;}
.stTabs button{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;font-size:12.5px;font-weight:700;padding:10px;border-radius:9px;color:var(--muted);transition:all .2s;}
.stTabs button.is-on{background:var(--white);color:var(--t);box-shadow:0 1px 4px rgba(26,34,51,.1);}

.stQ{background:var(--bg);border-radius:14px;padding:16px;margin-bottom:18px;}
.stQ__k{font-family:var(--mono);font-size:9.5px;letter-spacing:.16em;color:var(--muted);margin-bottom:12px;}
.stQ__g{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
.stQ__l{display:flex;align-items:center;font-size:11.5px;font-weight:700;margin-bottom:8px;}
.stQ__n{display:block;font-size:11px;color:var(--muted);margin-top:7px;line-height:1.7;}
.stSeg{display:flex;gap:5px;flex-wrap:wrap;}
.stSeg button{font-size:12px;font-weight:700;border:1.5px solid var(--line);background:var(--white);border-radius:999px;padding:7px 14px;color:var(--muted);transition:all .2s;}
.stSeg button.is-on{background:var(--t);border-color:var(--t);color:#fff;}
@media (max-width:640px){.stQ__g{grid-template-columns:1fr;}}

.stFoot{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;padding-top:17px;border-top:1px solid var(--line);}
.stFoot__c{font-size:12.5px;color:var(--muted);display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.stFoot__c span{font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;border:1px solid var(--line);border-radius:999px;padding:3px 9px;}
.stSend{display:inline-flex;align-items:center;gap:9px;background:var(--t);color:#fff;font-size:13.5px;font-weight:700;border-radius:999px;padding:13px 26px;transition:all .2s;}
.stSend:hover:not(:disabled){filter:brightness(.92);transform:translateY(-1px);}
.stSend:disabled{opacity:.45;cursor:not-allowed;transform:none;}
.stFlash{margin-top:13px;font-size:12.5px;line-height:1.85;color:var(--t);background:var(--s);border-radius:10px;padding:12px 15px;}
.stFlash.is-ng{color:var(--sig);background:#FDECEA;}

.stSpec{border-top:3px solid var(--t);}
.stSpec__l > div{display:grid;grid-template-columns:88px 1fr;gap:10px;padding:8px 0;align-items:baseline;}
.stSpec__l > div + div{border-top:1px solid var(--line);}
.stSpec__l dt{font-size:11px;color:var(--muted);}
.stSpec__l dd{font-size:12.5px;font-weight:500;line-height:1.7;}
.stSpec__s,.stSpec__w{font-size:12px;line-height:1.9;color:var(--muted);background:var(--bg);border-radius:11px;padding:12px 14px;margin-top:12px;}
.stSpec__w{background:var(--s);color:var(--ink);}
.stSpec__s b,.stSpec__w b{display:block;font-size:10px;font-weight:700;color:var(--t);margin-bottom:5px;letter-spacing:.06em;}

.stMini li{display:grid;grid-template-columns:66px 1fr;gap:10px;padding:7px 0;font-size:12.5px;align-items:baseline;}
.stMini li + li{border-top:1px solid var(--line);}
.stMini li span{font-size:10.5px;color:var(--muted);}

.stEmpty{font-size:12.5px;color:var(--muted);background:var(--bg);border-radius:12px;padding:16px;text-align:center;}
.stSch li{display:grid;grid-template-columns:1fr auto;gap:4px 10px;padding:11px 0;align-items:center;}
.stSch li + li{border-top:1px solid var(--line);}
.stSch__t{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10.5px;color:var(--t);font-weight:700;}
.stSch__d{grid-column:1;font-size:12.5px;line-height:1.6;}
.stSch__x{grid-row:1/3;grid-column:2;color:#B9C0CB;padding:6px;border-radius:8px;transition:all .2s;}
.stSch__x:hover{color:var(--sig);background:#FDECEA;}

.stJobs li{border-left:2px solid var(--t);padding:9px 0 9px 11px;margin-bottom:9px;background:linear-gradient(90deg,var(--s),transparent 62%);border-radius:0 10px 10px 0;}
.stJobs__h{display:flex;align-items:center;gap:8px;margin-bottom:5px;}
.stJobs__k{font-style:normal;font-size:9.5px;font-weight:700;color:#fff;background:var(--t);border-radius:999px;padding:2px 9px;}
.stJobs__s{font-size:11px;color:var(--muted);margin-left:auto;}
.stJobs__s.is-ng{color:var(--sig);font-weight:700;}
.stJobs__t{font-size:12.5px;line-height:1.65;margin-bottom:4px;}
.stJobs__m{font-family:var(--mono);font-size:10px;color:var(--muted);display:flex;gap:8px;align-items:center;}
.stJobs__m span{border:1px solid var(--line);border-radius:999px;padding:1px 7px;}
`;
