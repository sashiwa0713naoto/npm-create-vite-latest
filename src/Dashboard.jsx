import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ============================================================================
   株式会社SASHIWA — コントロールダッシュボード（統合版）
   配置：src/Dashboard.jsx  ← このファイル1つだけで完結します

   ■ 収録内容
     1. アカウント管理     … 投稿先アカウントの登録・編集
     2. 接続設定           … Google Apps Script との接続
     3. 成果物ライブラリ   … 作ったものを探して開く
     4. 制作スタジオ       … 運用設計 → 制作 → 投稿予約
     5. 全社ダッシュボード … 稼働状況・処理履歴・コンソール

   ■ なぜ1ファイルなのか
   分割すると、GitHubのブラウザ編集では「先に作る側」を間違えたときに
   ビルドが失敗します。1ファイルにまとめることで、この事故が起きません。
   App.jsx が import するのはこのファイルだけです。

   ■ 以前に作った Accounts.jsx / Library.jsx / Studio.jsx について
   このファイルに統合済みなので、リポジトリに残っていても使われません。
   削除しても、そのまま置いておいても問題ありません。
   ============================================================================ */



/* ======================= 1. アカウント管理・接続設定 ======================= */

/* ============================================================================
   株式会社SASHIWA — アカウント管理
   配置：src/Accounts.jsx

   ■ 役割
   「どのアカウントに投稿するか」を一元管理します。制作スタジオはここに登録した
   アカウントから選ぶ形になるため、投稿先の取り違えが起きません。

   ■ 保存場所
   ブラウザのローカルストレージに保存します（このPCのこのブラウザのみ）。
   別の端末でも使う場合は、右上の「書き出し」でJSONを保存し、
   別端末で「読み込み」してください。
   ============================================================================ */

const KEY = "sashiwa.accounts.v1";

const PLATFORM_META = {
  x: { label: "X（旧Twitter）", tone: "#1A2233", soft: "#ECEEF2", cap: 140 },
  instagram: { label: "Instagram", tone: "#C13584", soft: "#FBEAF4", cap: 2200 },
  threads: { label: "Threads", tone: "#3B4252", soft: "#EDEFF3", cap: 500 },
  tiktok: { label: "TikTok", tone: "#E0402F", soft: "#FDECEA", cap: 2200 },
  youtube: { label: "YouTube", tone: "#B3181C", soft: "#FBE9E9", cap: 5000 },
  yt_shorts: { label: "YouTube Shorts", tone: "#D3241C", soft: "#FCEAE9", cap: 100 },
  note: { label: "note", tone: "#0E9F73", soft: "#E7F6F1", cap: 8000 },
};

const SEED = [
  {
    id: "seed-own-x",
    name: "SASHIWA 公式X",
    platform: "x",
    handle: "sashiwa_ai",
    ownerType: "own",
    owner: "自社",
    purpose: "認知",
    tone: "丁寧・ですます",
    cadence: "毎日1本",
    status: "運用中",
    email: "",
    note: "AI社員構築代行の認知獲得。実際の稼働ログを出す。",
  },
];

/* ------------------------------------------------------------- ストア */

function load() {
  if (typeof window === "undefined" || !window.localStorage) return SEED;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return SEED;
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : SEED;
  } catch (e) {
    return SEED;
  }
}

function persist(list) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    /* 保存できない環境では無視（表示は継続） */
  }
}

function useAccounts() {
  const [accounts, setAccounts] = useState(SEED);

  useEffect(() => {
    setAccounts(load());
  }, []);

  const commit = useCallback((next) => {
    setAccounts(next);
    persist(next);
  }, []);

  const add = useCallback(
    (a) => commit([...load(), { ...a, id: `a-${Date.now()}` }]),
    [commit]
  );
  const update = useCallback(
    (id, patch) => commit(load().map((a) => (a.id === id ? { ...a, ...patch } : a))),
    [commit]
  );
  const remove = useCallback((id) => commit(load().filter((a) => a.id !== id)), [commit]);
  const replaceAll = useCallback((list) => commit(list), [commit]);

  return { accounts, add, update, remove, replaceAll };
}

/* ------------------------------------------------------------- 部品 */

function Ac({ name, size = 18 }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  const p = {
    plus: <path d="M12 5v14M5 12h14" {...s} />,
    edit: (<><path d="M16.8 3.4a2.3 2.3 0 0 1 3.3 3.3L8.4 18.4l-4.4 1.2 1.2-4.4Z" {...s} /><path d="m15 5.2 3.3 3.3" {...s} /></>),
    trash: (<><path d="M4.5 6.5h15M9.5 6.5V4.8a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" {...s} /><path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2A1.5 1.5 0 0 0 16.6 19l.9-12.5" {...s} /></>),
    down: (<><path d="M12 3.5v12M7.5 11l4.5 4.5 4.5-4.5" {...s} /><path d="M4 20.5h16" {...s} /></>),
    up: (<><path d="M12 15.5v-12M7.5 8 12 3.5 16.5 8" {...s} /><path d="M4 20.5h16" {...s} /></>),
    user: (<><circle cx="12" cy="8" r="3.6" {...s} /><path d="M5.5 20.4a6.5 6.5 0 0 1 13 0" {...s} /></>),
    x: <path d="M6 6l12 12M18 6L6 18" {...s} />,
    check: (<><circle cx="12" cy="12" r="9" {...s} /><path d="m8 12.3 2.8 2.8L16 9.8" {...s} /></>),
  };
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>{p[name] || p.check}</svg>;
}

const EMPTY = {
  name: "", platform: "x", handle: "", ownerType: "own", owner: "自社",
  purpose: "認知", tone: "丁寧・ですます", cadence: "毎日1本", status: "運用中", email: "", note: "",
};

/* ------------------------------------------------------------- 本体 */

function AccountsView({ pushLog }) {
  const { accounts, add, update, remove, replaceAll } = useAccounts();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [filter, setFilter] = useState("all");
  const [msg, setMsg] = useState("");

  const note = useCallback((l) => { if (typeof pushLog === "function") pushLog(l); }, [pushLog]);

  const openNew = () => { setForm(EMPTY); setEditing("new"); };
  const openEdit = (a) => { setForm(a); setEditing(a.id); };
  const close = () => { setEditing(null); setForm(EMPTY); };

  const save = () => {
    if (!form.name.trim()) return setMsg("アカウント名を入力してください。");
    if (form.ownerType === "client" && !form.owner.trim()) return setMsg("お客様名を入力してください。");
    const clean = { ...form, owner: form.ownerType === "own" ? "自社" : form.owner };
    if (editing === "new") { add(clean); note(`[${new Date().toLocaleTimeString()}] ACCOUNT ADDED: ${clean.name}`); }
    else { update(editing, clean); note(`[${new Date().toLocaleTimeString()}] ACCOUNT UPDATED: ${clean.name}`); }
    setMsg("");
    close();
  };

  const del = (a) => {
    if (typeof window !== "undefined" && !window.confirm(`「${a.name}」を削除します。よろしいですか？`)) return;
    remove(a.id);
    note(`[${new Date().toLocaleTimeString()}] ACCOUNT REMOVED: ${a.name}`);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(accounts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sashiwa_accounts_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const v = JSON.parse(String(r.result));
        if (!Array.isArray(v)) throw new Error();
        replaceAll(v);
        setMsg(`${v.length}件を読み込みました。`);
        setTimeout(() => setMsg(""), 4000);
      } catch (err) {
        setMsg("読み込めませんでした。書き出したJSONファイルを選んでください。");
      }
    };
    r.readAsText(f);
    e.target.value = "";
  };

  const shown = accounts.filter((a) =>
    filter === "all" ? true : filter === "own" ? a.ownerType === "own" : a.ownerType === "client"
  );
  const groups = shown.reduce((m, a) => {
    const k = a.ownerType === "own" ? "自社" : a.owner || "（お客様名未設定）";
    (m[k] = m[k] || []).push(a);
    return m;
  }, {});

  const active = accounts.filter((a) => a.status === "運用中").length;

  return (
    <div className="acRoot">
      <style>{CSS_ACCOUNTS}</style>

      <header className="acHead">
        <div>
          <p className="acHead__en">ACCOUNTS</p>
          <h1>アカウント管理</h1>
          <p className="acHead__s">投稿先をここで管理します。制作スタジオはこの一覧から選ぶ形になります。</p>
        </div>
        <div className="acHead__b">
          <button className="acGhost" onClick={exportJson}><Ac name="down" size={15} />書き出し</button>
          <label className="acGhost">
            <Ac name="up" size={15} />読み込み
            <input type="file" accept="application/json" onChange={importJson} hidden />
          </label>
          <button className="acAdd" onClick={openNew}><Ac name="plus" size={16} />アカウントを追加</button>
        </div>
      </header>

      <div className="acBar">
        <div className="acFilter">
          {[
            { id: "all", label: `すべて ${accounts.length}` },
            { id: "own", label: `自社 ${accounts.filter((a) => a.ownerType === "own").length}` },
            { id: "client", label: `お客様 ${accounts.filter((a) => a.ownerType === "client").length}` },
          ].map((f) => (
            <button key={f.id} className={filter === f.id ? "is-on" : ""} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
        <p className="acBar__n">運用中 {active} 件 ／ 停止中 {accounts.length - active} 件</p>
      </div>

      {msg && <p className="acMsg">{msg}</p>}

      {Object.keys(groups).length === 0 ? (
        <div className="acEmpty">
          <Ac name="user" size={30} />
          <h2>アカウントがまだありません</h2>
          <p>投稿先のアカウントを登録すると、制作スタジオから選べるようになります。</p>
          <button className="acAdd" onClick={openNew}><Ac name="plus" size={16} />最初のアカウントを追加</button>
        </div>
      ) : (
        Object.entries(groups).map(([owner, list]) => (
          <section className="acGroup" key={owner}>
            <h2 className="acGroup__t">
              <Ac name="user" size={15} />
              {owner}
              <em>{list.length}</em>
            </h2>
            <div className="acGrid">
              {list.map((a) => {
                const m = PLATFORM_META[a.platform] || PLATFORM_META.x;
                return (
                  <article className={`acCard ${a.status === "停止中" ? "is-off" : ""}`} key={a.id} style={{ "--t": m.tone, "--s": m.soft }}>
                    <div className="acCard__h">
                      <span className="acCard__pf">{m.label}</span>
                      <span className={`acCard__st ${a.status === "運用中" ? "is-on" : ""}`}>{a.status}</span>
                    </div>
                    <p className="acCard__n">{a.name}</p>
                    {a.handle && <p className="acCard__hd">@{a.handle}</p>}
                    <dl className="acCard__m">
                      <div><dt>目的</dt><dd>{a.purpose}</dd></div>
                      <div><dt>頻度</dt><dd>{a.cadence}</dd></div>
                      <div><dt>トーン</dt><dd>{a.tone}</dd></div>
                    </dl>
                    {a.note && <p className="acCard__note">{a.note}</p>}
                    <div className="acCard__f">
                      <button onClick={() => update(a.id, { status: a.status === "運用中" ? "停止中" : "運用中" })}>
                        {a.status === "運用中" ? "停止する" : "運用を再開"}
                      </button>
                      <button onClick={() => openEdit(a)}><Ac name="edit" size={14} />編集</button>
                      <button className="acCard__del" onClick={() => del(a)}><Ac name="trash" size={14} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}

      {editing && (
        <div className="acModal" onClick={close}>
          <div className="acModal__b" onClick={(e) => e.stopPropagation()}>
            <div className="acModal__h">
              <h2>{editing === "new" ? "アカウントを追加" : "アカウントを編集"}</h2>
              <button onClick={close} aria-label="閉じる"><Ac name="x" size={18} /></button>
            </div>

            <div className="acForm">
              <label><span>アカウント名</span>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="SASHIWA 公式X" />
              </label>
              <div className="acForm__r">
                <label><span>プラットフォーム</span>
                  <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                    {Object.entries(PLATFORM_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </label>
                <label><span>ハンドル（@なし）</span>
                  <input type="text" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} placeholder="sashiwa_ai" />
                </label>
              </div>

              <label><span>持ち主</span>
                <div className="acSeg">
                  <button className={form.ownerType === "own" ? "is-on" : ""} onClick={() => setForm({ ...form, ownerType: "own", owner: "自社" })}>自社（無料）</button>
                  <button className={form.ownerType === "client" ? "is-on" : ""} onClick={() => setForm({ ...form, ownerType: "client", owner: form.owner === "自社" ? "" : form.owner })}>お客様（課金）</button>
                </div>
              </label>

              {form.ownerType === "client" && (
                <div className="acForm__r">
                  <label><span>お客様名</span>
                    <input type="text" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="株式会社◯◯" />
                  </label>
                  <label><span>納品先メール</span>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@example.com" />
                  </label>
                </div>
              )}

              <div className="acForm__r">
                <label><span>目的</span>
                  <select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
                    {["認知", "見込み客", "販売", "採用", "信頼"].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </label>
                <label><span>投稿頻度</span>
                  <select value={form.cadence} onChange={(e) => setForm({ ...form, cadence: e.target.value })}>
                    {["毎日1本", "毎日2本", "週3本", "週2本", "週1本"].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </label>
              </div>

              <div className="acForm__r">
                <label><span>トーン</span>
                  <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}>
                    {["丁寧・ですます", "フランク", "断定的・力強い", "専門的・硬め", "やわらかい・共感"].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </label>
                <label><span>状態</span>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option>運用中</option><option>停止中</option>
                  </select>
                </label>
              </div>

              <label><span>メモ・運用方針</span>
                <textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="このアカウントで何を発信するか。制作時にAIへ渡されます。" />
              </label>
            </div>

            {msg && <p className="acMsg acMsg--in">{msg}</p>}

            <div className="acModal__f">
              <button className="acGhost" onClick={close}>キャンセル</button>
              <button className="acAdd" onClick={save}><Ac name="check" size={16} />保存する</button>
            </div>
          </div>
        </div>
      )}

      <p className="acFoot">
        アカウント情報はこのブラウザ内に保存されます。別の端末でも使う場合は「書き出し」でJSONを保存し、移行先で「読み込み」してください。
      </p>
    </div>
  );
}

/* ================================ CSS_ACCOUNTS ================================== */

const CSS_ACCOUNTS = `
.acRoot{--bg:#F4F6F9;--white:#fff;--ink:#1A2233;--muted:#616B7D;--line:#E2E6EC;--sig:#E0402F;--ai:#7C5CD6;--t:#1A2233;--s:#ECEEF2;
  --sans:'Noto Sans JP',"Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;
  --mono:'JetBrains Mono',ui-monospace,Menlo,monospace;font-family:var(--sans);color:var(--ink);}
.acRoot *,.acRoot *::before,.acRoot *::after{box-sizing:border-box;}
.acRoot h1,.acRoot h2,.acRoot p,.acRoot ul,.acRoot li,.acRoot dl,.acRoot dd,.acRoot dt{margin:0;padding:0;}
.acRoot button{font:inherit;color:inherit;background:none;border:none;cursor:pointer;text-align:left;}
.acRoot a{color:inherit;text-decoration:none;}
.acRoot :focus-visible{outline:2px solid var(--ai);outline-offset:2px;}

.acHead{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;flex-wrap:wrap;margin-bottom:18px;}
.acHead__en{font-family:var(--mono);font-size:10px;letter-spacing:.2em;color:var(--ai);font-weight:700;margin-bottom:8px;}
.acHead h1{font-size:clamp(23px,3vw,31px);font-weight:900;line-height:1.35;}
.acHead__s{font-size:13.5px;color:var(--muted);margin-top:8px;}
.acHead__b{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
.acGhost{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;color:var(--muted);background:var(--white);border:1.5px solid var(--line);border-radius:999px;padding:10px 18px;cursor:pointer;transition:all .2s;}
.acGhost:hover{border-color:var(--ink);color:var(--ink);}
.acAdd{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#fff;background:var(--ai);border-radius:999px;padding:11px 22px;transition:all .2s;box-shadow:0 12px 24px -14px rgba(124,92,214,.9);}
.acAdd:hover{filter:brightness(.93);transform:translateY(-1px);}

.acBar{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:16px;}
.acFilter{display:flex;gap:5px;background:var(--bg);border-radius:999px;padding:4px;}
.acFilter button{font-size:12.5px;font-weight:700;padding:8px 17px;border-radius:999px;color:var(--muted);transition:all .2s;}
.acFilter button.is-on{background:var(--ink);color:#fff;}
.acBar__n{font-size:12px;color:var(--muted);}
.acMsg{font-size:12.5px;color:var(--ai);background:#F5F1FE;border-radius:10px;padding:11px 15px;margin-bottom:14px;}
.acMsg--in{margin:0 22px 12px;}

.acEmpty{background:var(--white);border:1px dashed var(--line);border-radius:20px;padding:52px 28px;text-align:center;color:var(--muted);}
.acEmpty svg{margin:0 auto 16px;color:var(--ai);}
.acEmpty h2{font-size:18px;font-weight:900;color:var(--ink);margin-bottom:8px;}
.acEmpty p{font-size:13px;margin-bottom:22px;}

.acGroup{margin-bottom:26px;}
.acGroup__t{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;margin-bottom:12px;color:var(--muted);}
.acGroup__t em{font-style:normal;font-family:var(--mono);font-size:10px;color:var(--ai);background:#F1EDFC;border-radius:999px;padding:2px 9px;}
.acGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:13px;}

.acCard{background:var(--white);border:1px solid var(--line);border-top:3px solid var(--t);border-radius:18px;padding:18px 20px;transition:transform .25s,box-shadow .25s;}
.acCard:hover{transform:translateY(-3px);box-shadow:0 22px 42px -30px rgba(26,34,51,.5);}
.acCard.is-off{opacity:.55;}
.acCard__h{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.acCard__pf{font-size:10.5px;font-weight:700;color:var(--t);background:var(--s);border-radius:999px;padding:3px 10px;}
.acCard__st{margin-left:auto;font-size:10.5px;font-weight:700;color:var(--muted);background:var(--bg);border-radius:999px;padding:3px 10px;}
.acCard__st.is-on{color:#0E9F73;background:#E6F7F0;}
.acCard__n{font-size:15px;font-weight:900;line-height:1.5;}
.acCard__hd{font-family:var(--mono);font-size:11.5px;color:var(--muted);margin-bottom:12px;}
.acCard__m{display:flex;gap:16px;flex-wrap:wrap;padding:11px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
.acCard__m dt{font-size:9.5px;color:var(--muted);margin-bottom:2px;}
.acCard__m dd{font-size:12px;font-weight:500;}
.acCard__note{font-size:11.5px;line-height:1.8;color:var(--muted);margin-top:10px;}
.acCard__f{display:flex;gap:6px;align-items:center;margin-top:14px;}
.acCard__f button{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:7px 13px;transition:all .2s;}
.acCard__f button:hover{border-color:var(--ink);color:var(--ink);}
.acCard__del{margin-left:auto;padding:7px 10px !important;}
.acCard__del:hover{color:var(--sig) !important;border-color:var(--sig) !important;background:#FDECEA;}

.acModal{position:fixed;inset:0;background:rgba(10,14,22,.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;}
.acModal__b{background:var(--white);border-radius:22px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;box-shadow:0 40px 80px -40px rgba(0,0,0,.5);}
.acModal__h{display:flex;align-items:center;justify-content:space-between;padding:20px 22px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--white);z-index:2;}
.acModal__h h2{font-size:16px;font-weight:900;}
.acModal__h button{color:var(--muted);padding:6px;border-radius:8px;}
.acModal__h button:hover{background:var(--bg);color:var(--ink);}
.acForm{padding:20px 22px;}
.acForm label{display:block;margin-bottom:15px;}
.acForm label > span{display:block;font-size:12px;font-weight:700;margin-bottom:7px;}
.acForm__r{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media (max-width:560px){.acForm__r{grid-template-columns:1fr;}}
.acRoot input[type=text],.acRoot input[type=email],.acRoot select,.acRoot textarea{
  width:100%;background:var(--bg);border:1.5px solid transparent;border-radius:11px;padding:11px 13px;
  font-family:var(--sans);font-size:13.5px;line-height:1.75;color:var(--ink);resize:vertical;transition:all .2s;}
.acRoot input:focus,.acRoot select:focus,.acRoot textarea:focus{outline:none;background:var(--white);border-color:var(--ai);box-shadow:0 0 0 4px #F1EDFC;}
.acSeg{display:flex;gap:6px;}
.acSeg button{flex:1;text-align:center;font-size:12.5px;font-weight:700;border:1.5px solid var(--line);border-radius:11px;padding:11px;color:var(--muted);transition:all .2s;}
.acSeg button.is-on{background:var(--ai);border-color:var(--ai);color:#fff;}
.acModal__f{display:flex;justify-content:flex-end;gap:9px;padding:16px 22px;border-top:1px solid var(--line);position:sticky;bottom:0;background:var(--white);}

.acFoot{font-size:11.5px;line-height:1.9;color:var(--muted);background:var(--bg);border-radius:12px;padding:13px 16px;margin-top:24px;}

.acConn{display:flex;align-items:center;gap:13px;background:var(--white);border:1px solid var(--line);border-left:4px solid #9BA3B1;border-radius:16px;padding:16px 18px;margin-bottom:16px;}
.acConn.is-on{border-left-color:#0E9F73;}
.acConn__d{width:10px;height:10px;border-radius:50%;background:#9BA3B1;flex-shrink:0;}
.acConn.is-on .acConn__d{background:#0E9F73;box-shadow:0 0 0 4px rgba(14,159,115,.18);}
.acConn b{display:block;font-size:14px;font-weight:700;margin-bottom:3px;}
.acConn em{font-style:normal;font-size:12px;color:var(--muted);line-height:1.75;}
.acPanel{background:var(--white);border:1px solid var(--line);border-radius:18px;padding:22px;margin-bottom:14px;}
.acPanel__f{display:block;}
.acPanel__f > span{display:block;font-size:12px;font-weight:700;margin-bottom:8px;}
.acPanel__f > em{display:block;font-style:normal;font-size:11.5px;color:var(--muted);margin-top:7px;line-height:1.75;}
.acPanel__b{display:flex;gap:9px;margin-top:16px;flex-wrap:wrap;}
.acResult{font-size:12.5px;line-height:1.85;border-radius:11px;padding:12px 15px;margin-top:14px;}
.acResult.is-ok{color:#0E9F73;background:#E6F7F0;}
.acResult.is-ng{color:var(--sig);background:#FDECEA;}
.acPanel--guide h2{font-size:14px;font-weight:900;margin-bottom:14px;}
.acSteps{counter-reset:s;display:grid;gap:11px;}
.acSteps li{counter-increment:s;position:relative;padding-left:34px;font-size:13px;line-height:1.9;color:var(--muted);}
.acSteps li::before{content:counter(s);position:absolute;left:0;top:2px;width:23px;height:23px;border-radius:50%;background:var(--ai);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;}
.acSteps b{color:var(--ink);font-weight:700;}
.acNote{font-size:11.5px;line-height:1.9;color:var(--muted);background:var(--bg);border-radius:11px;padding:12px 15px;margin-top:16px;}

.acDiagBar{display:flex;align-items:center;gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid var(--line);flex-wrap:wrap;}
.acDiagBar span{font-size:11.5px;color:var(--muted);line-height:1.75;}
.acDiag{background:var(--bg);border-radius:14px;padding:16px;margin-top:14px;}
.acDiag__v{font-size:12px;color:var(--muted);margin-bottom:12px;display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
.acDiag__v b{font-family:var(--mono);color:var(--ink);}
.acDiag__v em{font-style:normal;font-size:11px;color:#fff;background:var(--sig);border-radius:999px;padding:3px 10px;}
.acDiag__l{display:grid;gap:7px;list-style:none;padding:0;margin:0;}
.acDiag__l li{display:flex;align-items:center;gap:10px;font-size:12.5px;flex-wrap:wrap;background:var(--white);border-radius:10px;padding:10px 13px;}
.acDiag__m{font-family:var(--mono);font-size:10px;font-weight:700;border-radius:999px;padding:3px 9px;flex-shrink:0;}
.acDiag__l li.is-ok .acDiag__m{color:#0E9F73;background:#E6F7F0;}
.acDiag__l li.is-ng .acDiag__m{color:var(--sig);background:#FDECEA;}
.acDiag__l li.is-opt{opacity:.72;}
.acDiag__l li.is-opt .acDiag__m{color:var(--muted);background:var(--line);}
.acDiag__l li em{font-style:normal;font-size:11.5px;color:var(--muted);flex:1;min-width:160px;}
.acDiag__n{font-size:11.5px;color:var(--muted);margin-top:12px;}
.acDiag__n b{color:var(--ink);}
.acDiag__w{margin-top:12px;background:#FDECEA;border-radius:11px;padding:12px 14px;}
.acDiag__w > p:first-child{font-size:11.5px;font-weight:700;color:var(--sig);margin-bottom:7px;}
.acDiag__job{font-size:11.5px;line-height:1.8;color:#8C2A22;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;margin-bottom:5px;}
.acDiag__job em{font-style:normal;font-size:10px;font-weight:700;background:var(--sig);color:#fff;border-radius:999px;padding:2px 8px;}
.acDiag__job.is-hold{color:#7A5A12;}
.acDiag__job.is-hold em{background:#B47C10;}
.acDiag__job span{width:100%;font-family:var(--mono);font-size:10.5px;opacity:.85;}
`;


/* ============================================================================
   接続設定（GASのURLなど）
   GitHubを触らずに、ダッシュボード上で設定できるようにするための仕組みです。
   ============================================================================ */

const SKEY = "sashiwa.settings.v1";

const DEFAULT_SETTINGS = {
  gasUrl: "",
  makeUrl: "https://hook.us2.make.com/umnotcrw2pg8twacx68irmjcnnzyjmwv",
  useGas: true,
  liveSubmit: true,
};

function loadSettings() {
  if (typeof window === "undefined" || !window.localStorage) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SKEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  useEffect(() => { setSettings(loadSettings()); }, []);
  const save = useCallback((patch) => {
    const next = { ...loadSettings(), ...patch };
    setSettings(next);
    if (typeof window !== "undefined" && window.localStorage) {
      try { window.localStorage.setItem(SKEY, JSON.stringify(next)); } catch (e) {}
    }
    return next;
  }, []);
  return { settings, save };
}

/** 送信先URLと、プリフライトを避けるContent-Typeを返します */
function resolveEndpoint(settings) {
  const useGas = settings.useGas && settings.gasUrl;
  return {
    url: useGas ? settings.gasUrl : settings.makeUrl,
    contentType: useGas ? "text/plain;charset=utf-8" : "application/json",
    isGas: !!useGas,
  };
}

function SettingsView({ pushLog }) {
  const { settings, save } = useSettings();
  const [gasUrl, setGasUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { setGasUrl(settings.gasUrl || ""); }, [settings.gasUrl]);

  const test = async () => {
    const u = gasUrl.trim();
    if (!u) return setResult({ ok: false, msg: "URLを入力してください。" });
    if (u.indexOf("script.google.com") < 0 || u.indexOf("/exec") < 0) {
      return setResult({ ok: false, msg: "GASのウェブアプリURLは script.google.com で始まり /exec で終わります。デプロイ画面のURLをそのまま貼ってください。" });
    }
    setTesting(true);
    setResult(null);
    try {
      const r = await fetch(u, { method: "GET" });
      const t = await r.text();
      if (t.indexOf("SASHIWA") >= 0) {
        save({ gasUrl: u, useGas: true });
        setResult({ ok: true, msg: "接続できました。保存しました。これ以降の依頼はこちらで処理されます。" });
        if (typeof pushLog === "function") pushLog(`[${new Date().toLocaleTimeString()}] BACKEND CONNECTED: Google Apps Script`);
      } else {
        setResult({ ok: false, msg: "応答はありましたが、SASHIWAのバックエンドではないようです。URLをご確認ください。" });
      }
    } catch (e) {
      setResult({ ok: false, msg: "接続できませんでした。デプロイ時の「アクセスできるユーザー」が『全員』になっているかご確認ください。" });
    } finally {
      setTesting(false);
    }
  };

  const [diag, setDiag] = useState(null);
  const [diagging, setDiagging] = useState(false);

  const runDiag = async () => {
    const u = (gasUrl || settings.gasUrl || "").trim();
    if (!u) return setResult({ ok: false, msg: "先にURLを入力して接続してください。" });
    setDiagging(true);
    setDiag(null);
    try {
      const r = await fetch(`${u}?action=diag`);
      const d = await r.json();
      if (d && d.diag) setDiag(d.diag);
      else setResult({ ok: false, msg: "古いバージョンが公開されています。Apps Scriptでコードを貼り直したあと、「デプロイを管理」→編集→バージョン「新バージョン」→デプロイを行ってください。" });
    } catch (e) {
      setResult({ ok: false, msg: "状態を取得できませんでした。デプロイの「アクセスできるユーザー」が『全員』かご確認ください。" });
    } finally {
      setDiagging(false);
    }
  };

  const [running, setRunning] = useState(false);

  const runNow = async () => {
    const u = (gasUrl || settings.gasUrl || "").trim();
    if (!u) return setResult({ ok: false, msg: "先にURLを入力して接続してください。" });
    setRunning(true);
    setResult(null);
    try {
      const r = await fetch(`${u}?action=run`);
      const d = await r.json();
      if (d && d.ran) {
        if (d.diag) setDiag(d.diag);
        setResult({ ok: true, msg: "処理を実行しました。数十秒後にメールが届きます。届かない場合は下の状態表示をご確認ください。" });
        if (typeof pushLog === "function") pushLog(`[${new Date().toLocaleTimeString()}] MANUAL RUN EXECUTED`);
      } else {
        setResult({ ok: false, msg: "古いバージョンが公開されています。Apps Scriptでコードを貼り直し、「デプロイを管理」→編集→バージョン「新バージョン」→デプロイを行ってください。" });
      }
    } catch (e) {
      setResult({ ok: false, msg: "実行できませんでした。デプロイの「アクセスできるユーザー」が『全員』かご確認ください。" });
    } finally {
      setRunning(false);
    }
  };

  const runRetry = async () => {
    const u = (gasUrl || settings.gasUrl || "").trim();
    if (!u) return setResult({ ok: false, msg: "先にURLを入力して接続してください。" });
    setRunning(true);
    setResult(null);
    try {
      const r = await fetch(`${u}?action=retry`);
      const d = await r.json();
      if (d && typeof d.retried === "number") {
        if (d.diag) setDiag(d.diag);
        setResult({
          ok: true,
          msg:
            d.retried > 0
              ? `${d.retried} 件を再実行しました。数十秒後にメールが届きます。`
              : "再実行が必要な依頼はありませんでした。",
        });
        if (typeof pushLog === "function") pushLog(`[${new Date().toLocaleTimeString()}] RETRY: ${d.retried} jobs`);
      } else {
        setResult({ ok: false, msg: "古いバージョンが公開されています。コードを貼り直し、デプロイを新バージョンで更新してください。" });
      }
    } catch (e) {
      setResult({ ok: false, msg: "実行できませんでした。デプロイ設定をご確認ください。" });
    } finally {
      setRunning(false);
    }
  };

  const disconnect = () => {
    save({ gasUrl: "", useGas: false });
    setGasUrl("");
    setResult({ ok: true, msg: "接続を解除しました。以降はMakeに送信されます。" });
  };

  const connected = !!settings.gasUrl && settings.useGas;

  return (
    <div className="acRoot">
      <style>{CSS_ACCOUNTS}</style>

      <header className="acHead">
        <div>
          <p className="acHead__en">SETTINGS</p>
          <h1>接続設定</h1>
          <p className="acHead__s">制作の依頼をどこで処理するかを設定します。GitHubを触る必要はありません。</p>
        </div>
      </header>

      <div className={`acConn ${connected ? "is-on" : ""}`}>
        <span className="acConn__d" />
        <div>
          <b>{connected ? "Google Apps Script に接続中" : "未接続（Makeに送信中）"}</b>
          <em>
            {connected
              ? "文章の生成・保存・納品・予約配信まで自動で処理されます。"
              : "現在はMakeへ送信しています。成果物の保存と納品は行われません。"}
          </em>
        </div>
      </div>

      <section className="acPanel">
        <label className="acPanel__f">
          <span>ウェブアプリのURL</span>
          <input
            type="text"
            value={gasUrl}
            onChange={(e) => setGasUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycb.../exec"
          />
          <em>Apps Scriptの「デプロイ」で発行されたURLをそのまま貼り付けてください。</em>
        </label>

        <div className="acPanel__b">
          <button className="acAdd" onClick={test} disabled={testing}>
            {testing ? "接続を確認中..." : "接続して保存"}
          </button>
          {connected && <button className="acGhost" onClick={disconnect}>接続を解除</button>}
        </div>

        {result && <p className={`acResult ${result.ok ? "is-ok" : "is-ng"}`}>{result.msg}</p>}

        <div className="acDiagBar">
          <button className="acGhost" onClick={runDiag} disabled={diagging}>
            {diagging ? "確認中..." : "バックエンドの状態を確認"}
          </button>
          <button className="acAdd" onClick={runNow} disabled={running}>
            {running ? "処理中..." : "今すぐ処理する"}
          </button>
          <button className="acGhost" onClick={runRetry} disabled={running}>
            失敗した依頼を再実行
          </button>
          <span>生成されない・メールが来ないときは、まずここを押してください。</span>
        </div>

        {diag && (
          <div className="acDiag">
            <p className="acDiag__v">
              バージョン <b>{diag.version || "不明"}</b>
              {diag.version !== "3.0" && <em>古いデプロイが公開されています</em>}
            </p>
            <ul className="acDiag__l">
              {[
                {
                  label: "制作キー（Dify）",
                  ok: diag["キー"] && diag["キー"]["制作"],
                  need: true,
                  hint: 'Apps Scriptの冒頭 KEY_CREATIVE = "" に、Creative_PR_AI のAPIキー（app-…）を貼って保存してください',
                },
                { label: "検査キー（Dify）", ok: diag["キー"] && diag["キー"]["検査"], need: false, hint: "入れると品質・法令の二重検査が働きます" },
                { label: "画像キー（OpenAI）", ok: diag["キー"] && diag["キー"]["画像"], need: false, hint: "画像を作る場合のみ必要です" },
                { label: "動画キー（JSON2Video）", ok: diag["キー"] && diag["キー"]["動画"], need: false, hint: "動画を作る場合のみ必要です" },
                { label: "自動実行トリガー", ok: diag["トリガー"] && diag["トリガー"].length > 0, need: true, hint: "setup を実行すると登録されます" },
                { label: "シートの準備", ok: diag["シート"] && diag["シート"]["ジョブ"], need: true, hint: "setup を実行すると作られます" },
              ].map((it) => (
                <li key={it.label} className={it.ok ? "is-ok" : it.need ? "is-ng" : "is-opt"}>
                  <span className="acDiag__m">{it.ok ? "OK" : it.need ? "要対応" : "任意"}</span>
                  <b>{it.label}</b>
                  {!it.ok && <em>{it.hint}</em>}
                </li>
              ))}
            </ul>
            <p className="acDiag__n">
              通知先：<b>{diag["通知先"] || "未設定"}</b> ／ 記録件数：{(diag["シート"] && diag["シート"]["件数"]) || 0} 件
            </p>
            {diag["未処理"] && diag["未処理"].length > 0 && (
              <div className="acDiag__w">
                <p>未処理・エラーの案件</p>
                {diag["未処理"].map((w) => (
                  <p key={w.id} className={`acDiag__job ${w["状態"] === "保留" ? "is-hold" : ""}`}>
                    <em>{w["状態"]}</em>
                    {w.id}
                    <span>{w["備考"]}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="acPanel acPanel--guide">
        <h2>接続までの手順</h2>
        <ol className="acSteps">
          <li><b>スプレッドシートを新規作成</b>して、名前を「SASHIWA_制作バックエンド」にします。</li>
          <li>メニューの<b>「拡張機能」→「Apps Script」</b>を開きます。</li>
          <li>最初のコードを全部消し、<b>SASHIWA_Backend.gs の中身を貼り付け</b>て保存します。</li>
          <li>関数選択で <b>setup</b> を選んで実行。ダイアログにDifyのキーを貼るだけで、シートもトリガーも自動で用意されます。</li>
          <li><b>「デプロイ」→「新しいデプロイ」→ ウェブアプリ</b>。アクセスできるユーザーを<b>「全員」</b>にしてデプロイ。</li>
          <li>表示されたURLを<b>上の欄に貼って「接続して保存」</b>。以上で完了です。</li>
        </ol>
        <p className="acNote">
          設定はこのブラウザに保存されます。別の端末でも使う場合は、同じURLをその端末でも貼り付けてください。
        </p>
      </section>
    </div>
  );
}

/* ========================== 2. 成果物ライブラリ ========================== */

/* ============================================================================
   株式会社SASHIWA — 成果物ライブラリ
   配置：src/Library.jsx

   ■ 役割
   作った文章・画像・動画・運用設計を、あとから探して開ける場所です。
   Google Apps Script から直接取得するため、スプレッドシートを一般公開する
   必要がありません（顧客名が含まれるため、公開は避ける設計にしています）。
   ============================================================================ */

const SERVICE_META = {
  AGENT: { label: "AI社員構築代行", tone: "#E0402F", soft: "#FDECEA" },
  STUDIO: { label: "文書・動画 自動制作", tone: "#2456C8", soft: "#E8EEFB" },
  SOCIAL: { label: "SNSアカウント運用", tone: "#7C5CD6", soft: "#F1EDFC" },
};

const KIND_META = {
  コンテンツ: { icon: "doc", tone: "#2456C8", soft: "#E8EEFB" },
  画像: { icon: "image", tone: "#0E9F73", soft: "#E7F6F1" },
  動画: { icon: "film", tone: "#E08A1F", soft: "#FBF2E1" },
  運用設計: { icon: "map", tone: "#7C5CD6", soft: "#F1EDFC" },
  予約投稿: { icon: "clock", tone: "#7C5CD6", soft: "#F1EDFC" },
  問い合わせ: { icon: "mail", tone: "#E0402F", soft: "#FDECEA" },
};

/* デモ用。GAS未接続のときに表示します。 */
const DEMO_JOBS = [
  {
    job_id: "J1786200000001",
    受信日時: "2026-08-06 22:00",
    種別: "コンテンツ",
    投稿先アカウント: "SASHIWA 公式X（X（旧Twitter） @sashiwa_ai）",
    持ち主: "自社",
    媒体: "X（旧Twitter）",
    状態: "完了",
    指示内容:
      "【事業】STUDIO／【JOB】CONTENT／【課金】無料（社内利用）／【媒体】X（旧Twitter）／【形式】単発投稿／【文字数上限】140／【媒体仕様】1行目で完結。改行で余白を作る。／【勝ち筋】1行目だけで価値が伝わること。／【目的】見込み客／【ターゲット】従業員10〜50名の中小企業の経営者／【トーン】丁寧・ですます／【構成】PREP法／【フックの型】数字を出す／【案数】3案／【検査】厳格／【テーマ】問い合わせ対応を自動化したら何時間浮いたか",
    成果物URL: "",
    完了日時: "2026-08-06 22:03",
  },
  {
    job_id: "J1786200000002",
    受信日時: "2026-08-06 05:30",
    種別: "運用設計",
    投稿先アカウント: "SASHIWA 公式X",
    持ち主: "自社",
    媒体: "X（旧Twitter）",
    状態: "完了",
    指示内容:
      "【事業】STUDIO／【JOB】PLAN／【依頼】SNS運用設計書の作成／【会社】株式会社SASHIWA／【業種】BtoBサービス／【目的】見込み客／【使える時間】週2〜3時間／【ターゲット】中小企業の経営者",
    成果物URL: "",
    完了日時: "2026-08-06 05:34",
  },
];

/* ------------------------------------------------------------- 解析 */

/** 「【キー】値／【キー】値」の形を配列に分解します */
function parseInstruction(text) {
  const out = [];
  String(text || "")
    .split("／")
    .forEach((chunk) => {
      const m = chunk.match(/^\s*【([^】]+)】([\s\S]*)$/);
      if (m) out.push({ k: m[1].trim(), v: m[2].trim() });
      else if (chunk.trim()) {
        if (out.length) out[out.length - 1].v += "／" + chunk.trim();
      }
    });
  return out;
}

/** 一覧に出す短いタイトルを作ります */
function jobTitle(job) {
  const p = parseInstruction(job.指示内容);
  const find = (k) => (p.find((x) => x.k === k) || {}).v;
  return (
    find("テーマ") ||
    find("本文") ||
    find("描画内容") ||
    find("依頼") ||
    find("内容") ||
    job.種別 ||
    "（内容なし）"
  );
}

/* ------------------------------------------------------------- 部品 */

function Li({ name, size = 18 }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  const p = {
    doc: (<><path d="M6 2.8h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.8a1 1 0 0 1 1-1Z" {...s} /><path d="M14 2.8V7h4M8.5 12h7M8.5 16h5" {...s} /></>),
    image: (<><rect x="3" y="4.5" width="18" height="15" rx="2.6" {...s} /><circle cx="8.6" cy="10" r="1.9" {...s} /><path d="m4 17 4.6-4.4 3.4 3.2 3.4-3.6L20 17" {...s} /></>),
    film: (<><rect x="2.5" y="4.5" width="19" height="15" rx="2.6" {...s} /><path d="M7.5 4.5v15M16.5 4.5v15" {...s} opacity=".4" /><path d="m10.8 9.4 3.4 2.1-3.4 2.1z" {...s} /></>),
    map: (<><path d="M9 3.5 3.5 6v14.5L9 18l6 2.5 5.5-2.5V3.5L15 6Z" {...s} /><path d="M9 3.5V18M15 6v14.5" {...s} /></>),
    clock: (<><circle cx="12" cy="12" r="9" {...s} /><path d="M12 7v5.3l3.4 2" {...s} /></>),
    mail: (<><rect x="2.5" y="5" width="19" height="14" rx="2.4" {...s} /><path d="m3.5 7 8.5 6 8.5-6" {...s} /></>),
    open: (<><path d="M14 4.5h5.5V10" {...s} /><path d="M19.5 4.5 11 13" {...s} /><path d="M18 14.5v4a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" {...s} /></>),
    x: <path d="M6 6l12 12M18 6L6 18" {...s} />,
    search: (<><circle cx="10.8" cy="10.8" r="6.8" {...s} /><path d="m15.8 15.8 4.4 4.4" {...s} /></>),
    refresh: (<><path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" {...s} /><path d="M20.5 4.5V10H15" {...s} /></>),
    copy: (<><rect x="8.5" y="8.5" width="12" height="12" rx="2.4" {...s} /><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" {...s} /></>),
    box: (<><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5Z" {...s} /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" {...s} /></>),
  };
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>{p[name] || p.doc}</svg>;
}

/* ------------------------------------------------------------- 詳細 */

function JobDetail({ job, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!job) return null;
  const pairs = parseInstruction(job.指示内容);
  const km = KIND_META[job.種別] || KIND_META.コンテンツ;
  const svc = (pairs.find((x) => x.k === "事業") || {}).v;
  const sm = SERVICE_META[svc] || null;

  const HIDE = ["事業", "JOB"];
  const shown = pairs.filter((p) => HIDE.indexOf(p.k) < 0);

  return (
    <div className="lbModal" onClick={onClose}>
      <style>{CSS_LIBRARY}</style>
      <div className="lbModal__b" onClick={(e) => e.stopPropagation()} style={{ "--t": km.tone, "--s": km.soft }}>
        <div className="lbModal__h">
          <span className="lbModal__ic"><Li name={km.icon} size={20} /></span>
          <div className="lbModal__ht">
            <p className="lbModal__k">
              {job.種別}
              {sm && <em style={{ background: sm.soft, color: sm.tone }}>{sm.label}</em>}
              <span className={`lbSt lbSt--${job.状態}`}>{job.状態}</span>
            </p>
            <h2>{jobTitle(job)}</h2>
          </div>
          <button className="lbModal__x" onClick={onClose} aria-label="閉じる"><Li name="x" size={18} /></button>
        </div>

        <div className="lbModal__body">
          <dl className="lbMeta">
            <div><dt>受信日時</dt><dd className="lbMono">{job.受信日時 || "—"}</dd></div>
            <div><dt>完了日時</dt><dd className="lbMono">{job.完了日時 || "—"}</dd></div>
            <div><dt>投稿先</dt><dd>{job.投稿先アカウント || "—"}</dd></div>
            <div><dt>持ち主</dt><dd>{job.持ち主 || "—"}</dd></div>
            <div><dt>媒体</dt><dd>{job.媒体 || "—"}</dd></div>
            <div><dt>ジョブID</dt><dd className="lbMono">{job.job_id}</dd></div>
          </dl>

          {job.成果物URL && String(job.成果物URL).indexOf("http") === 0 ? (
            <a className="lbOpen" href={job.成果物URL} target="_blank" rel="noopener noreferrer">
              <Li name="open" size={17} />
              成果物を開く
            </a>
          ) : (
            <p className="lbNone">
              {job.状態 === "完了"
                ? "この案件には成果物ファイルが紐づいていません。"
                : job.状態 === "エラー"
                ? "処理中にエラーが発生しました。理由は下記のとおりです。"
                : "処理が完了すると、ここに成果物へのリンクが表示されます。"}
              {job.状態 === "エラー" && job.成果物URL && <span className="lbErr">{job.成果物URL}</span>}
            </p>
          )}

          <div className="lbSpecH">
            <h3>制作条件</h3>
            <button
              className="lbCopy"
              onClick={() => {
                try {
                  navigator.clipboard.writeText(String(job.指示内容 || ""));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch (e) {}
              }}
            >
              <Li name="copy" size={13} />
              {copied ? "コピーしました" : "条件をコピー"}
            </button>
          </div>

          {shown.length === 0 ? (
            <p className="lbNone">条件の記録がありません。</p>
          ) : (
            <dl className="lbSpec">
              {shown.map((p, i) => (
                <div key={`${p.k}-${i}`}>
                  <dt>{p.k}</dt>
                  <dd>{p.v || "—"}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- 本体 */

function LibraryView({ pushLog, initialFilter }) {
  const { settings } = useSettings();
  const [jobs, setJobs] = useState(DEMO_JOBS);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [svc, setSvc] = useState(initialFilter || "all");
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("works");
  const [queue, setQueue] = useState([]);
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => { if (initialFilter) setSvc(initialFilter); }, [initialFilter]);

  const load = useCallback(async () => {
    if (!settings.gasUrl) return;
    setLoading(true);
    setErr("");
    try {
      const r = await fetch(`${settings.gasUrl}?action=jobs`);
      const data = await r.json();
      try {
        const rq = await fetch(`${settings.gasUrl}?action=queue`);
        const dq = await rq.json();
        if (dq && dq.ok && Array.isArray(dq.queue)) setQueue(dq.queue);
      } catch (e2) { /* 予約が取れなくても本体は表示します */ }
      if (data && data.ok && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
        setLive(true);
        if (typeof pushLog === "function") pushLog(`[${new Date().toLocaleTimeString()}] LIBRARY SYNCED: ${data.jobs.length} records`);
      } else {
        throw new Error("形式が違います");
      }
    } catch (e) {
      setLive(false);
      setErr("取得できませんでした。接続設定をご確認ください。デモデータを表示しています。");
    } finally {
      setLoading(false);
    }
  }, [settings.gasUrl, pushLog]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (kind !== "all" && j.種別 !== kind) return false;
      if (svc !== "all") {
        const p = parseInstruction(j.指示内容);
        const s = (p.find((x) => x.k === "事業") || {}).v || "AGENT";
        if (s !== svc) return false;
      }
      if (q.trim()) {
        const hay = `${j.投稿先アカウント} ${j.持ち主} ${j.媒体} ${j.指示内容}`.toLowerCase();
        if (hay.indexOf(q.trim().toLowerCase()) < 0) return false;
      }
      return true;
    });
  }, [jobs, kind, svc, q]);

  const kinds = useMemo(() => {
    const set = {};
    jobs.forEach((j) => { set[j.種別] = (set[j.種別] || 0) + 1; });
    return set;
  }, [jobs]);

  return (
    <div className="lbRoot">
      <style>{CSS_LIBRARY}</style>

      <header className="lbHead">
        <div>
          <p className="lbHead__en">LIBRARY</p>
          <h1>成果物ライブラリ</h1>
          <p className="lbHead__s">これまでに作ったものを、条件つきで探して開けます。</p>
        </div>
        <button className="lbRe" onClick={load} disabled={loading || !settings.gasUrl}>
          <span className={loading ? "lbSpin" : ""}><Li name="refresh" size={15} /></span>
          {settings.gasUrl ? (loading ? "取得中..." : "再取得") : "未接続"}
        </button>
      </header>

      <div className={`lbSync ${live ? "is-live" : ""}`}>
        <span className="lbSync__d" />
        {live ? `実データを表示中（${jobs.length}件）` : "デモデータを表示中｜接続設定でGoogle Apps Scriptを接続すると実データになります"}
      </div>
      {err && <p className="lbErrBar">{err}</p>}

      <div className="lbTabs">
        <button className={tab === "works" ? "is-on" : ""} onClick={() => setTab("works")}>成果物</button>
        <button className={tab === "queue" ? "is-on" : ""} onClick={() => setTab("queue")}>
          予約投稿<em>{queue.filter((q) => q.状態 === "予約").length}</em>
        </button>
      </div>

      {tab === "queue" ? (
        queue.length === 0 ? (
          <div className="lbEmpty">
            <Li name="clock" size={30} />
            <h2>予約された投稿はありません</h2>
            <p>制作スタジオのSTEP3から予約すると、ここに並びます。</p>
          </div>
        ) : (
          <div className="lbQueue">
            {queue.map((q) => (
              <article className={`lbQ lbQ--${q.状態}`} key={q.post_id}>
                <div className="lbQ__l">
                  <span className="lbMono lbQ__t">{q.予定日時}</span>
                  <span className={`lbSt lbSt--${q.状態}`}>{q.状態}</span>
                </div>
                <div className="lbQ__m">
                  <p className="lbQ__h">
                    {q.アカウント}
                    <em>{q.媒体}</em>
                    {q.繰り返し && q.繰り返し !== "なし" && <em>{q.繰り返し}</em>}
                  </p>
                  <p className="lbQ__b">{q.本文}</p>
                  <div className="lbQ__f">
                    {q.投稿リンク && (
                      <a className="lbQ__go" href={q.投稿リンク} target="_blank" rel="noopener noreferrer">
                        <Li name="open" size={14} />
                        投稿画面を開く
                      </a>
                    )}
                    <button
                      className="lbQ__cp"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(String(q.本文 || ""));
                          setCopiedId(q.post_id);
                          setTimeout(() => setCopiedId(""), 2000);
                        } catch (e) {}
                      }}
                    >
                      <Li name="copy" size={13} />
                      {copiedId === q.post_id ? "コピーしました" : "本文をコピー"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
      <>
      <div className="lbFilters">
        <div className="lbSeg">
          {[["all", "すべて"], ["AGENT", "AI社員構築"], ["STUDIO", "文書・動画"], ["SOCIAL", "SNS運用"]].map(([id, label]) => (
            <button key={id} className={svc === id ? "is-on" : ""} onClick={() => setSvc(id)}>{label}</button>
          ))}
        </div>
        <div className="lbSeg lbSeg--sub">
          <button className={kind === "all" ? "is-on" : ""} onClick={() => setKind("all")}>全種別</button>
          {Object.keys(kinds).map((k) => (
            <button key={k} className={kind === k ? "is-on" : ""} onClick={() => setKind(k)}>{k} {kinds[k]}</button>
          ))}
        </div>
        <label className="lbSearch">
          <Li name="search" size={15} />
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="アカウント名・内容で検索" />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="lbEmpty">
          <Li name="box" size={30} />
          <h2>該当する成果物がありません</h2>
          <p>条件を変えるか、制作スタジオから新しく作ってみてください。</p>
        </div>
      ) : (
        <div className="lbGrid">
          {filtered.map((j) => {
            const km = KIND_META[j.種別] || KIND_META.コンテンツ;
            const p = parseInstruction(j.指示内容);
            const s = (p.find((x) => x.k === "事業") || {}).v || "AGENT";
            const sm = SERVICE_META[s];
            const hasFile = j.成果物URL && String(j.成果物URL).indexOf("http") === 0;
            return (
              <article key={j.job_id} className="lbCard" style={{ "--t": km.tone, "--s": km.soft }} onClick={() => setSel(j)}>
                <div className="lbCard__h">
                  <span className="lbCard__ic"><Li name={km.icon} size={17} /></span>
                  <span className="lbCard__k">{j.種別}</span>
                  {sm && <span className="lbCard__s" style={{ background: sm.soft, color: sm.tone }}>{s}</span>}
                  <span className={`lbSt lbSt--${j.状態}`}>{j.状態}</span>
                </div>
                <p className="lbCard__t">{jobTitle(j)}</p>
                <p className="lbCard__m">
                  <span className="lbMono">{j.受信日時}</span>
                  {j.媒体 && j.媒体 !== "-" && <em>{j.媒体}</em>}
                </p>
                <p className="lbCard__a">{j.投稿先アカウント || j.持ち主 || "—"}</p>
                <div className="lbCard__f">
                  <span className="lbCard__more">詳細を見る →</span>
                  {hasFile && (
                    <a href={j.成果物URL} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      <Li name="open" size={14} />開く
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      </>
      )}

      <JobDetail job={sel} onClose={() => setSel(null)} />
    </div>
  );
}

/* ================================ CSS_LIBRARY ================================== */

const CSS_LIBRARY = `
.lbRoot,.lbModal{--bg:#F4F6F9;--white:#fff;--ink:#1A2233;--muted:#616B7D;--line:#E2E6EC;--sig:#E0402F;--ai:#7C5CD6;--t:#2456C8;--s:#E8EEFB;
  --sans:'Noto Sans JP',"Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;
  --mono:'JetBrains Mono',ui-monospace,Menlo,monospace;font-family:var(--sans);color:var(--ink);}
.lbRoot *,.lbRoot *::before,.lbRoot *::after,.lbModal *,.lbModal *::before,.lbModal *::after{box-sizing:border-box;}
.lbRoot h1,.lbRoot h2,.lbRoot p,.lbRoot dl,.lbRoot dd,.lbRoot dt,.lbModal h2,.lbModal h3,.lbModal p,.lbModal dl,.lbModal dd,.lbModal dt{margin:0;padding:0;}
.lbRoot button,.lbModal button{font:inherit;color:inherit;background:none;border:none;cursor:pointer;text-align:left;}
.lbRoot a,.lbModal a{color:inherit;text-decoration:none;}
.lbMono{font-family:var(--mono);}
.lbSpin{display:inline-flex;animation:lbSpin 1s linear infinite;}
@keyframes lbSpin{to{transform:rotate(360deg);}}

.lbHead{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:14px;}
.lbHead__en{font-family:var(--mono);font-size:10px;letter-spacing:.2em;color:var(--ai);font-weight:700;margin-bottom:8px;}
.lbHead h1{font-size:clamp(23px,3vw,31px);font-weight:900;line-height:1.35;}
.lbHead__s{font-size:13.5px;color:var(--muted);margin-top:8px;}
.lbRe{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;color:var(--muted);background:var(--white);border:1.5px solid var(--line);border-radius:999px;padding:10px 18px;transition:all .2s;}
.lbRe:hover:not(:disabled){border-color:var(--ink);color:var(--ink);}
.lbRe:disabled{opacity:.5;cursor:default;}

.lbSync{display:flex;align-items:center;gap:9px;font-size:12px;color:var(--muted);background:var(--white);border:1px solid var(--line);border-radius:12px;padding:11px 15px;margin-bottom:12px;}
.lbSync__d{width:8px;height:8px;border-radius:50%;background:#9BA3B1;flex-shrink:0;}
.lbSync.is-live .lbSync__d{background:#0E9F73;box-shadow:0 0 0 3px rgba(14,159,115,.2);}
.lbErrBar{font-size:12px;color:var(--sig);background:#FDECEA;border-radius:11px;padding:11px 15px;margin-bottom:12px;line-height:1.8;}

.lbFilters{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-bottom:16px;}
.lbSeg{display:flex;gap:4px;background:var(--bg);border-radius:999px;padding:4px;flex-wrap:wrap;}
.lbSeg button{font-size:12.5px;font-weight:700;padding:8px 16px;border-radius:999px;color:var(--muted);transition:all .2s;white-space:nowrap;}
.lbSeg button.is-on{background:var(--ink);color:#fff;}
.lbSeg--sub button.is-on{background:var(--ai);}
.lbSearch{display:flex;align-items:center;gap:8px;background:var(--white);border:1.5px solid var(--line);border-radius:999px;padding:9px 16px;flex:1;min-width:200px;}
.lbSearch svg{color:var(--muted);}
.lbSearch input{flex:1;border:none;background:none;font:inherit;font-size:13px;outline:none;color:var(--ink);}

.lbGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:13px;}
.lbCard{background:var(--white);border:1px solid var(--line);border-top:3px solid var(--t);border-radius:18px;padding:18px 20px;cursor:pointer;transition:transform .25s,box-shadow .25s,border-color .25s;}
.lbCard:hover{transform:translateY(-3px);box-shadow:0 24px 44px -30px rgba(26,34,51,.5);}
.lbCard__h{display:flex;align-items:center;gap:7px;margin-bottom:11px;flex-wrap:wrap;}
.lbCard__ic{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;background:var(--s);color:var(--t);}
.lbCard__k{font-size:11.5px;font-weight:700;}
.lbCard__s{font-family:var(--mono);font-size:9px;font-weight:700;border-radius:999px;padding:3px 8px;letter-spacing:.06em;}
.lbSt{margin-left:auto;font-size:10.5px;font-weight:700;color:var(--muted);background:var(--bg);border-radius:999px;padding:3px 10px;white-space:nowrap;}
.lbSt--完了{color:#0E9F73;background:#E6F7F0;}
.lbSt--制作中{color:#B47C10;background:#FFF4DE;}
.lbSt--エラー{color:var(--sig);background:#FDECEA;}
.lbCard__t{font-size:14px;font-weight:700;line-height:1.65;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.lbCard__m{display:flex;align-items:center;gap:9px;font-size:10.5px;color:var(--muted);margin-bottom:5px;}
.lbCard__m em{font-style:normal;border:1px solid var(--line);border-radius:999px;padding:2px 8px;}
.lbCard__a{font-size:11.5px;color:var(--muted);margin-bottom:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.lbCard__f{display:flex;align-items:center;gap:10px;padding-top:11px;border-top:1px solid var(--line);}
.lbCard__more{font-size:12px;font-weight:700;color:var(--t);}
.lbCard__f a{display:inline-flex;align-items:center;gap:5px;margin-left:auto;font-size:11.5px;font-weight:700;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:6px 12px;transition:all .2s;}
.lbCard__f a:hover{border-color:var(--t);color:var(--t);}

.lbEmpty{background:var(--white);border:1px dashed var(--line);border-radius:20px;padding:52px 28px;text-align:center;color:var(--muted);}
.lbEmpty svg{margin:0 auto 16px;color:var(--ai);}
.lbEmpty h2{font-size:17px;font-weight:900;color:var(--ink);margin-bottom:8px;}
.lbEmpty p{font-size:13px;}

/* 詳細モーダル */
.lbModal{position:fixed;inset:0;background:rgba(10,14,22,.5);z-index:220;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;}
.lbModal__b{background:var(--white);border-radius:22px;width:100%;max-width:640px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 40px 80px -40px rgba(0,0,0,.5);}
.lbModal__h{display:flex;align-items:flex-start;gap:12px;padding:20px 22px;border-bottom:1px solid var(--line);}
.lbModal__ic{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:var(--s);color:var(--t);flex-shrink:0;}
.lbModal__ht{flex:1;min-width:0;}
.lbModal__k{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:5px;flex-wrap:wrap;}
.lbModal__k em{font-style:normal;font-size:9.5px;border-radius:999px;padding:2px 8px;}
.lbModal__ht h2{font-size:17px;font-weight:900;line-height:1.55;}
.lbModal__x{color:var(--muted);padding:6px;border-radius:8px;flex-shrink:0;}
.lbModal__x:hover{background:var(--bg);color:var(--ink);}
.lbModal__body{padding:20px 22px;overflow-y:auto;}

.lbMeta{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-bottom:16px;}
.lbMeta > div{background:var(--white);padding:11px 14px;}
.lbMeta dt{font-size:10px;color:var(--muted);margin-bottom:3px;}
.lbMeta dd{font-size:12.5px;font-weight:500;line-height:1.6;word-break:break-all;}
@media (max-width:560px){.lbMeta{grid-template-columns:1fr;}}

.lbOpen{display:flex;align-items:center;justify-content:center;gap:9px;background:var(--t);color:#fff;font-size:13.5px;font-weight:700;border-radius:999px;padding:14px;margin-bottom:18px;transition:filter .2s,transform .2s;}
.lbOpen:hover{filter:brightness(.92);transform:translateY(-1px);}
.lbNone{font-size:12.5px;line-height:1.85;color:var(--muted);background:var(--bg);border-radius:12px;padding:14px 16px;margin-bottom:18px;}
.lbErr{display:block;font-family:var(--mono);font-size:11px;color:var(--sig);margin-top:8px;word-break:break-all;}

.lbSpecH{display:flex;align-items:center;gap:10px;margin-bottom:11px;}
.lbSpecH h3{font-size:13px;font-weight:700;}
.lbCopy{display:inline-flex;align-items:center;gap:6px;margin-left:auto;font-size:11.5px;font-weight:700;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:6px 13px;transition:all .2s;}
.lbCopy:hover{border-color:var(--t);color:var(--t);}
.lbSpec{display:grid;gap:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;}
.lbSpec > div{display:grid;grid-template-columns:130px 1fr;gap:12px;padding:10px 14px;align-items:baseline;}
.lbSpec > div:nth-child(odd){background:var(--bg);}
.lbSpec dt{font-size:11px;font-weight:700;color:var(--muted);}
.lbSpec dd{font-size:12.5px;line-height:1.85;word-break:break-word;}
@media (max-width:560px){.lbSpec > div{grid-template-columns:1fr;gap:3px;}}

.lbTabs{display:flex;gap:5px;background:var(--bg);border-radius:999px;padding:4px;margin-bottom:14px;width:fit-content;}
.lbTabs button{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;padding:9px 20px;border-radius:999px;color:var(--muted);transition:all .2s;}
.lbTabs button.is-on{background:var(--ink);color:#fff;}
.lbTabs em{font-style:normal;font-family:var(--mono);font-size:10px;background:var(--ai);color:#fff;border-radius:999px;padding:1px 7px;}
.lbQueue{display:grid;gap:10px;}
.lbQ{display:grid;grid-template-columns:150px 1fr;gap:16px;background:var(--white);border:1px solid var(--line);border-left:3px solid var(--ai);border-radius:16px;padding:16px 18px;}
.lbQ--投稿済み,.lbQ--配信済み{border-left-color:#0E9F73;opacity:.72;}
.lbQ--エラー{border-left-color:var(--sig);}
.lbQ__l{display:flex;flex-direction:column;gap:7px;align-items:flex-start;}
.lbQ__t{font-size:12px;font-weight:700;color:var(--ai);}
.lbQ__l .lbSt{margin-left:0;}
.lbQ__h{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;margin-bottom:6px;flex-wrap:wrap;}
.lbQ__h em{font-style:normal;font-size:10.5px;font-weight:400;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:2px 9px;}
.lbQ__b{font-size:12.5px;line-height:1.85;color:var(--muted);white-space:pre-wrap;}
.lbSt--予約{color:var(--ai);background:#F1EDFC;}
.lbSt--投稿済み,.lbSt--配信済み{color:#0E9F73;background:#E6F7F0;}
@media (max-width:640px){.lbQ{grid-template-columns:1fr;gap:9px;}.lbQ__l{flex-direction:row;align-items:center;}}

.lbQ__f{display:flex;gap:8px;margin-top:11px;flex-wrap:wrap;}
.lbQ__go{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#fff;background:var(--ai);border-radius:999px;padding:8px 16px;transition:filter .2s;}
.lbQ__go:hover{filter:brightness(.92);}
.lbQ__cp{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:8px 15px;transition:all .2s;}
.lbQ__cp:hover{border-color:var(--ink);color:var(--ink);}
`;

/* ============================ 3. 制作スタジオ ============================ */

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

/* 送信先は「接続設定」画面で切り替えます。コードを書き換える必要はありません。 */
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



/* ============ お手本から、制作条件を自動で決める ============ */

const EMOJI_RE2 = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}]/gu;

/**
 * お手本の文章から、トーン・構成・フック・一人称・絵文字・CTAを推定します。
 * 通信は発生しません。ブラウザ内で判定します。
 */
function inferSettings(texts) {
  const arr = (texts || []).filter((t) => String(t).trim().length > 5);
  if (arr.length === 0) return null;
  const all = arr.join("\n");
  const firsts = arr.map((t) => (t.split("\n").find((l) => l.trim()) || "").trim());
  const lasts = arr.map((t) => {
    const ls = t.split("\n").filter((l) => l.trim());
    return ls.length ? ls[ls.length - 1] : "";
  });
  const n = arr.length;
  const cnt = (re) => (all.match(re) || []).length;

  /* 一人称 */
  const persons = [["私", /私(は|が|も|の|たち)/g], ["僕", /僕(は|が|も|の|ら)/g], ["弊社", /弊社/g], ["当社", /当社/g], ["うち", /うち(は|が|も|の)/g]];
  let person = "使わない";
  let pMax = 0;
  persons.forEach(([label, re]) => {
    const c = cnt(re);
    if (c > pMax) { pMax = c; person = label === "うち" ? "私" : label; }
  });

  /* 絵文字 */
  const emo = (all.match(EMOJI_RE2) || []).length / n;
  const emoji = emo < 0.3 ? "使わない" : emo < 1.2 ? "控えめ" : "適度に";

  /* トーン */
  const desu = cnt(/(です|ます)[。、\n！？]/g);
  const dearu = cnt(/(である|だ)[。\n]/g);
  const casual = cnt(/(だよ|だね|かな|よね|しちゃ|めっちゃ|ヤバ|ね[！!]|いこう|しよう|くれてありがとう|〜|ー[！!])/g);
  const soft = cnt(/(一緒に|大丈夫|わかります|寄り添|安心)/g);
  const emoRate = (all.match(EMOJI_RE2) || []).length / n;
  let tone = "丁寧・ですます";
  // 絵文字が多い、または砕けた語尾が目立つ場合はフランクとみなします
  if (casual >= n || emoRate >= 1.5) tone = "フランク";
  else if (soft >= n) tone = "やわらかい・共感";
  else if (dearu > desu) tone = "断定的・力強い";
  else if (cnt(/[ぁ-ん]/g) / Math.max(1, all.length) < 0.32) tone = "専門的・硬め";

  /* フックの型 */
  const fj = firsts.join(" ");
  let hook = "疑問形で問う";
  if (/[?？]/.test(fj)) hook = "疑問形で問う";
  else if (/\d/.test(fj)) hook = "数字を出す";
  else if (/^(まだ|いや|違|そうじゃ|やめ|ダメ|間違)/.test(firsts[0] || "")) hook = "否定から入る";
  else if (/(私|僕|うち|自分)/.test(fj)) hook = "実体験を語る";
  else if (/(実は|意外|知らない|常識)/.test(fj)) hook = "常識を覆す";
  else if (/(損|逃|もったいない|失|risk)/i.test(fj)) hook = "損失を示す";

  /* 構成 */
  const bullets = cnt(/^[\s]*[・●▪◦\-*]/gm);
  let struct = "ストーリー型";
  if (bullets >= n * 2) struct = "リスト型（○選）";
  else if (cnt(/(一方|に対して|より|比べ)/g) >= n) struct = "比較型";
  else if (cnt(/(まず|次に|最後に|手順|ステップ)/g) >= n) struct = "実演・手順型";
  else if (cnt(/[?？]/g) >= n * 2) struct = "Q&A型";
  else if (cnt(/(結論|つまり|要は)/g) >= n) struct = "PREP法（結論→理由→例→結論）";

  /* CTA */
  const lj = lasts.join(" ");
  let cta = "CTAなし";
  if (/DM/i.test(lj)) cta = "DMで相談";
  else if (/(プロフィール|プロフ|固定)/.test(lj)) cta = "プロフィールのリンクへ";
  else if (/保存/.test(lj)) cta = "保存を促す";
  else if (/(コメント|教えて|どう思)/.test(lj)) cta = "コメントを促す";
  else if (/(https?:\/\/|詳細は|続きは)/.test(lj)) cta = "LPへ誘導";

  /* 文字数 */
  const len = Math.round(arr.reduce((a, t) => a + t.replace(/\s/g, "").length, 0) / n);

  return {
    tone: tone,
    struct: struct,
    hook: hook,
    person: person,
    emoji: emoji,
    cta: cta,
    len: String(len),
    from: n,
  };
}


/* ============ 投稿スケジュール ============ */
const DAYS = ["月", "火", "水", "木", "金", "土", "日"];

function emptySlot(time) {
  return { id: "s" + Math.random().toString(36).slice(2, 8), time: time || "07:00", brief: "", images: [], video: "", videoNote: "" };
}

function defaultSchedule(pfId2) {
  const P = PLATFORMS.find((x) => x.id === pfId2);
  const times = (P && P.times) || ["07:00"];
  return { days: ["月", "火", "水", "木", "金"], slots: times.slice(0, 2).map((t) => emptySlot(t)) };
}

/* ============ 媒体ごとの「制作パーツ」定義 ============ */
const PART_DEFS = {
  x: [
    { id: "post", label: "投稿本文", hint: "1投稿目。ここで止められるかが勝負", type: "text" },
    { id: "thread", label: "ツリー（続きの投稿）", hint: "2投稿目以降の展開のしかた", type: "text" },
    { id: "image", label: "添付画像", hint: "投稿に添える画像の雰囲気", type: "media" },
  ],
  note: [
    { id: "title", label: "タイトル", hint: "クリックされる見出しの付け方", type: "text" },
    { id: "thumb", label: "サムネイル画像", hint: "見出し画像の雰囲気・文字の置き方", type: "media" },
    { id: "free", label: "無料枠", hint: "冒頭から有料ラインの手前まで", type: "text" },
    { id: "paid", label: "有料枠", hint: "有料部分の書き方・情報の濃さ", type: "text" },
    { id: "inline", label: "差し込み画像", hint: "記事中に入れる図や写真", type: "media" },
  ],
  instagram: [
    { id: "caption", label: "キャプション本文", hint: "投稿文の書き方", type: "text" },
    { id: "cover", label: "1枚目（表紙）", hint: "表紙のデザインと文字の置き方", type: "media" },
    { id: "pages", label: "2枚目以降", hint: "情報の並べ方", type: "media" },
  ],
  threads: [
    { id: "post", label: "投稿本文", hint: "会話が始まる書き方", type: "text" },
    { id: "thread", label: "連投", hint: "分解のしかた", type: "text" },
  ],
  tiktok: [
    { id: "script", label: "台本・テロップ", hint: "冒頭2秒の掴み方", type: "text" },
    { id: "caption", label: "キャプション", hint: "投稿文の書き方", type: "text" },
    { id: "visual", label: "映像の雰囲気", hint: "画面構成・テロップの見せ方", type: "media" },
  ],
  yt_shorts: [
    { id: "script", label: "台本・テロップ", hint: "ループする構成", type: "text" },
    { id: "visual", label: "映像の雰囲気", hint: "画面構成", type: "media" },
  ],
  youtube: [
    { id: "title", label: "タイトル", hint: "クリック率を左右する見出し", type: "text" },
    { id: "thumb", label: "サムネイル画像", hint: "文字数・配色・構図", type: "media" },
    { id: "desc", label: "説明文", hint: "概要欄。導線とタイムスタンプ", type: "text" },
    { id: "video", label: "動画", hint: "構成・テンポ・テロップの見せ方", type: "media" },
  ],
  other: [{ id: "body", label: "本文", hint: "全体の書き方", type: "text" }],
};

function emptyPartRef() {
  return { texts: [""], images: [], video: "", videoNote: "" };
}

function partFilled(r) {
  if (!r) return false;
  return (r.texts || []).some((t) => String(t).trim().length > 5) || (r.images || []).length > 0 || !!String(r.video || "").trim();
}

/** 画像を縮小してから読み込みます（送信量を抑えるため） */
function readImageSmall(file, cb) {
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 640;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      cb(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => cb(String(r.result));
    img.src = String(r.result);
  };
  r.readAsDataURL(file);
}

/* ===================== お手本の文体を測る（内蔵分析） ==================== */

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}]/gu;

/**
 * 貼り付けられた投稿から、文体の特徴を実測します。
 * 通信もAPI費用も発生しません。数値化した特徴を制作指示に載せます。
 */
function analyzeStyle(samples) {
  const list = (samples || []).map(function (t) { return String(t || "").trim(); }).filter(function (t) { return t.length > 10; });
  if (list.length === 0) return null;

  let chars = 0, lines = 0, sentences = 0, sentLen = 0, emoji = 0, q = 0, num = 0, tags = 0, firstLen = 0, blanks = 0;
  const enders = {};

  list.forEach(function (t) {
    const ls = t.split("\n");
    const body = t.replace(/#[^\s#]+/g, "");
    chars += t.length;
    lines += ls.length;
    blanks += ls.filter(function (l) { return l.trim() === ""; }).length;
    firstLen += (ls[0] || "").length;
    tags += (t.match(/#[^\s#]+/g) || []).length;
    emoji += (t.match(EMOJI_RE) || []).length;
    const ss = body.split(/[。！？\n]+/).filter(function (x) { return x.trim().length > 1; });
    sentences += ss.length;
    ss.forEach(function (x) { sentLen += x.trim().length; });
    if (/[？?]\s*$/.test(t.trim())) q++;
    if (/[0-9０-９]/.test(t)) num++;
    ss.forEach(function (x) {
      const m = x.trim().match(/(です|ます|ました|でした|だ|である|ない|ん|よ|ね|た|る)$/);
      if (m) enders[m[1]] = (enders[m[1]] || 0) + 1;
    });
  });

  const n = list.length;
  const topEnders = Object.keys(enders).sort(function (a, b) { return enders[b] - enders[a]; }).slice(0, 3);

  const level =
    n >= 7 ? { label: "非常に高い", note: "文体の再現度が最も高くなります", pct: 100 }
    : n >= 4 ? { label: "高い", note: "あと3本足すと最高精度になります", pct: 75 }
    : n >= 2 ? { label: "標準", note: "あと2本足すと精度が上がります", pct: 50 }
    : { label: "不足", note: "最低2本は必要です", pct: 22 };

  return {
    count: n,
    level: level,
    avgChars: Math.round(chars / n),
    avgLines: Math.round((lines / n) * 10) / 10,
    avgBlank: Math.round((blanks / n) * 10) / 10,
    avgSentLen: sentences ? Math.round(sentLen / sentences) : 0,
    firstLen: Math.round(firstLen / n),
    emojiPer: Math.round((emoji / n) * 10) / 10,
    questionRate: Math.round((q / n) * 100),
    numberRate: Math.round((num / n) * 100),
    tagsPer: Math.round((tags / n) * 10) / 10,
    enders: topEnders,
  };
}

/** 分析結果を、AIに渡す1行の指示文にまとめます */
function styleToBrief(a) {
  if (!a) return "";
  return [
    "1投稿あたり約" + a.avgChars + "文字",
    "行数は約" + a.avgLines + "行（うち空行" + a.avgBlank + "行）",
    "一文は平均" + a.avgSentLen + "文字と短く保つ",
    "1行目は約" + a.firstLen + "文字",
    "絵文字は1投稿あたり" + a.emojiPer + "個程度",
    a.questionRate >= 40 ? "末尾を問いかけで閉じることが多い" : "断定で閉じることが多い",
    a.numberRate >= 50 ? "具体的な数字を入れる" : "数字は多用しない",
    a.tagsPer >= 1 ? "ハッシュタグは" + a.tagsPer + "個程度" : "ハッシュタグはほぼ使わない",
    a.enders.length ? "よく使う語尾は「" + a.enders.join("」「") + "」" : "",
  ].filter(Boolean).join("／");
}

/* ===================== 画像の指示文を自動で書く ========================= */

const IMG_LIGHT = ["朝の斜光", "曇天のやわらかい拡散光", "窓から差す逆光", "夕方の低い光", "均一なスタジオ照明"];
const IMG_ANGLE = ["やや俯瞰", "目線の高さ", "低い位置から見上げる", "真上からの俯瞰", "斜め45度"];
const IMG_MOOD = {
  認知: "目を引く強いコントラスト",
  見込み客: "落ち着いて信頼感のある静かなトーン",
  販売: "明るく前向きで、手に取りたくなる質感",
  採用: "人の気配が感じられるあたたかい空気",
  信頼: "余白の多い、端正で静かな構成",
};
const IMG_SUBJECT = {
  btob: ["誰もいない朝のオフィスで、モニターだけが淡く光っている机", "積み上がった書類の山が奥に向かって薄れて消えていく様子", "整然と並んだ机と、時計だけが動いている静かな室内"],
  shigyo: ["万年筆と閉じられた書類が置かれた木製のデスク", "窓辺に置かれた分厚い専門書と眼鏡", "整理された書棚と、差し込む午後の光"],
  food: ["湯気の立つ調理場の手元と、仕込み中の食材", "カウンターに並べられた器と、朝の仕込みの風景", "季節の食材が並んだまな板の俯瞰"],
  beauty: ["清潔なサロンの施術台と、整えられた道具", "並べられたケア用品と、やわらかい布の質感", "鏡越しに映る、明るく整った室内"],
  retail: ["棚に整然と並んだ商品と、やわらかい照明", "包装された商品と、開封される直前の様子", "手のひらに乗せた商品の質感を映した接写"],
  school: ["黒板と、書きかけのノートが置かれた机", "並んだ椅子と、朝の教室に差す光", "ノートとペンを俯瞰でとらえた学習の風景"],
  estate: ["朝の光が入る、家具のない部屋", "窓から見える街並みと、室内の余白", "鍵と間取り図が置かれたテーブル"],
  health: ["清潔で明るい待合室の椅子と観葉植物", "整えられた器具と、白を基調とした室内", "窓辺の水差しと、静かな午前の光"],
  creative: ["制作途中の机の上、道具が散らばった手元", "画面に映る作りかけのデザインと、余白のある机", "並べられた色見本とスケッチ"],
  other: ["静かな作業机と、途中まで進んだ仕事の痕跡", "整えられた道具が並ぶ棚", "窓辺の机と、差し込む自然光"],
};

function pickOne(arr, seed) {
  return arr[Math.abs(seed) % arr.length];
}

/**
 * テーマ・業種・目的から、画像の指示文を3案つくります。
 * 通信もAPI費用も発生しません。これを下書きにして、送信後にAIが
 * 英語の詳細プロンプトへ仕上げます（2段階方式）。
 */
function suggestImagePrompts(ctx, style, ratio, theme, seed) {
  const ind = ctx.industry || "other";
  const subjects = IMG_SUBJECT[ind] || IMG_SUBJECT.other;
  const mood = IMG_MOOD[ctx.goal] || IMG_MOOD.認知;
  const t = (theme || "").trim();
  const vertical = String(ratio).indexOf("9:16") >= 0 || String(ratio).indexOf("4:5") >= 0;
  const frame = vertical ? "縦位置。主役を上寄せにして、下半分に文字を載せる余白を残す" : "横位置。中央から右に余白を残す";

  const a = {
    label: "状況を切り取る",
    note: "いちばん外しにくい。実務の空気が伝わります",
    text:
      pickOne(subjects, seed) + "。" +
      pickOne(IMG_ANGLE, seed + 1) + "の構図。" +
      pickOne(IMG_LIGHT, seed + 2) + "。" +
      mood + "。" + frame + "。人物の顔は写さない。",
  };
  const b = {
    label: "たとえで見せる",
    note: "抽象的なテーマ向き。印象に残ります",
    text:
      (t ? "「" + t + "」を象徴する物を1つだけ置いた、" : "テーマを象徴する物を1つだけ置いた、") +
      "余白の多いミニマルな構図。背景は無地に近く、影はやわらかい。" +
      pickOne(IMG_LIGHT, seed + 3) + "。" + mood + "。" + frame + "。文字は入れない。",
  };
  const c = {
    label: "図解にする",
    note: "手順や仕組みの説明向き",
    text:
      (t ? "「" + t + "」の流れを表す、" : "処理の流れを表す、") +
      "3つのブロックが左から右へつながる図。細い線と大きな余白。色は2色まで。" +
      "背景は淡い単色。立体感は付けず、平面的に。" + frame + "。文字は入れない。",
  };

  const arr = [a, b, c];
  if (style === "図解・ダイアグラム") return [c, a, b];
  if (style === "イラスト" || style === "フラットデザイン") return [b, c, a];
  return arr;
}

/* ========================= AI推奨エンジン（内蔵） ======================== */

function recommend({ industry, goal, resource, budgetVideo, want }) {
  const ind = INDUSTRIES.find((i) => i.id === industry) || INDUSTRIES[9];
  const res = RESOURCES.find((r) => r.id === resource) || RESOURCES[1];

  const wish = want && want.length ? want : null;
  const scored = PLATFORMS.map((p) => {
    let s = (p.strength[goal] || 2) * 10;
    if (wish) s += wish.indexOf(p.id) >= 0 ? 60 : -40;
    const bi = ind.bias.indexOf(p.id);
    if (bi >= 0) s += 18 - bi * 5;
    if (p.effort > res.eff) s -= (p.effort - res.eff) * 9;
    if (!budgetVideo && p.effort >= 4) s -= 14;
    return { ...p, score: s };
  }).sort((a, b) => b.score - a.score);

  const limit = wish ? Math.max(res.max, Math.min(wish.length, 4)) : res.max;
  const picked = scored.slice(0, limit).map((p, i) => {
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

function Studio({ pushLog }) {
  const [step, setStep] = useState(1);
  const { accounts } = useAccounts();
  const { settings } = useSettings();
  const endpoint = resolveEndpoint(settings);
  const live = accounts.filter((a) => a.status === "運用中");
  const [acctId, setAcctId] = useState("");
  const acct = live.find((a) => a.id === acctId) || live[0] || null;
  const mode = acct && acct.ownerType === "client" ? "CLIENT" : "OWNER";

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
  const [ideas, setIdeas] = useState([]);
  const [seed, setSeed] = useState(1);
  const [wantPlatforms, setWantPlatforms] = useState([]);
  const [refImages, setRefImages] = useState([]);
  const [refVideo, setRefVideo] = useState("");
  const [refVideoNote, setRefVideoNote] = useState("");
  const [wantImages, setWantImages] = useState(true);
  const [deliverBest, setDeliverBest] = useState(true);
  const [notePaid, setNotePaid] = useState(true);
  const [noteToX, setNoteToX] = useState(true);
  const [watch, setWatch] = useState(null);
  const [refs, setRefs] = useState({});
  const [refPf, setRefPf] = useState("x");
  const [openPart, setOpenPart] = useState("");
  const [autoSet, setAutoSet] = useState(null);
  const [tweak, setTweak] = useState(false);
  const [moreCtx, setMoreCtx] = useState(false);
  const [sched, setSched] = useState({});
  const [schedPf, setSchedPf] = useState("x");
  const [refSlot, setRefSlot] = useState("common");
  const [prodSlot, setProdSlot] = useState("common");
  const [refAcct, setRefAcct] = useState("");
  const [samples, setSamples] = useState(["", ""]);
  const [refPoints, setRefPoints] = useState(["文体・語り口", "テンポ・改行"]);
  const style = useMemo(() => analyzeStyle(samples), [samples]);

  /* STEP3 */
  const [schedule, setSchedule] = useState({ at: "", repeat: "なし" });

  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [copied, setCopied] = useState(false);

  const pf = useMemo(() => PLATFORMS.find((p) => p.id === pfId) || PLATFORMS[0], [pfId]);
  const fmt = useMemo(() => pf.formats.find((f) => f.id === fmtId) || pf.formats[0], [pf, fmtId]);
  const ind = INDUSTRIES.find((i) => i.id === ctx.industry);

  const note = useCallback((l) => { if (typeof pushLog === "function") pushLog(l); }, [pushLog]);
  const mark = (k) => setTouched((t) => ({ ...t, [k]: true }));

  /* ---- AI推奨を実行 ---- */
  const runPlan = () => {
    const r = recommend({ ...ctx, want: wantPlatforms });
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
      if (wantPlatforms.length) L.push(`【運用したい媒体】${wantPlatforms.map((id) => (PLATFORMS.find((x) => x.id === id) || {}).label).join("・")}`);
      L.push(`【会社】${ctx.company}／【業種】${ind.label}／【目的】${ctx.goal}／【使える時間】${RESOURCES.find((r) => r.id === ctx.resource).note}`);
      L.push(`【商品・サービス】${ctx.service}／【価格帯】${ctx.price}`);
      L.push(`【ターゲット】${ctx.target}／【顧客の悩み】${ctx.pain}／【自社の強み】${ctx.strength}`);
      if (ctx.ref) L.push(`【参考アカウント】${ctx.ref}`);
      if (ctx.ng) L.push(`【NG】${ctx.ng}`);
      if (plan) {
        L.push(`【一次案（社内エンジン）】媒体=${plan.platforms.map((p) => `${p.label}:${p.formatLabel}`).join(" / ")}／頻度=${plan.cadence}／時間帯=${plan.times.join(",")}／柱=${plan.pillars.join(" / ")}`);
      }
      L.push(`【出力してほしいもの】媒体ごとの運用方針・プロフィール文案・固定投稿案・30日分の投稿テーマ案・KPIと計測方法・法令上の注意点`);
      if (acct) L.push(`【対象アカウント】${acct.name}（${(PLATFORM_META[acct.platform] || {}).label || acct.platform}）／【現在の方針】${acct.note || "未設定"}`);
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
      // 投稿スケジュール
      const sc2 = getSched(pfId);
      const slot2 = prodSlot !== "common" ? sc2.slots.find((x) => x.id === prodSlot) : null;
      L.push(`【投稿予定】${sc2.days.join("・")}／${sc2.slots.map((x) => x.time).join("・")}（週${sc2.days.length * sc2.slots.length}投稿）`);
      if (slot2) {
        L.push(`【この投稿の時間】${slot2.time}` + (slot2.brief ? `／【この時間に出したい内容】${slot2.brief}` : ""));
        if (slot2.video) L.push(`【この時間の参考動画】${slot2.video}`);
      }

      // お手本（パーツごと）
      const acct2 = (refs[pfId] && refs[pfId].account) || "";
      const parts = PART_DEFS[pfId] || PART_DEFS.other;
      const used = parts.filter((pt) => partFilled(getPartRef(pfId, pt.id, prodSlot)));
      if (acct2 || used.length) {
        L.push(
          `【お手本】${acct2 || "（貼り付けた内容）"}／【お手本の扱い】文体・構成・リズム・見せ方の型のみを抽出して適用すること。` +
            `表現・文章・固有名詞・画像をそのまま流用しないこと。`
        );
        used.forEach((pt) => {
          const r = getPartRef(pfId, pt.id, prodSlot);
          const texts = r.texts.filter((t) => t.trim().length > 5);
          const st2 = analyzeStyle(texts);
          const bits = [];
          if (st2) bits.push(`実測：${styleToBrief(st2)}`);
          if (texts.length) {
            bits.push(
              `見本${texts.length}本：` +
                texts.map((t, i) => `〈${i + 1}〉${t.replace(/\n/g, " ⏎ ")}`).join(" ｜ ").slice(0, 1400)
            );
          }
          if (r.images.length) bits.push(`参考画像${r.images.length}枚（${r.images.map((im) => im.note || "指定なし").join("／")}）`);
          if (r.video) bits.push(`参考動画：${r.video}（${r.videoNote || "指定なし"}）`);
          L.push(`【お手本・${pt.label}】${bits.join("／")}`);
        });
      }
      L.push(`【追加で出す成果物】${extras.join(" / ") || "なし"}`);
      L.push(`【テーマ】${theme}`);
      if (points) L.push(`【伝えたい要点】${points.replace(/\n/g, " ／ ")}`);
      L.push(`【納品パッケージ】${pfId === "note" ? "note一式" : pfId === "x" ? "X一式" : "標準"}`);
      L.push(`【画像生成】${wantImages ? "あり" : "なし"}`);
      if (refImages.length) {
        L.push(
          `【参考画像】${refImages.length}枚（${refImages.map((im) => im.note || "指定なし").join("／")}）` +
            `／【参考画像の扱い】構図・配色・文字の置き方などの型のみ参考にし、複製しないこと`
        );
      }
      if (refVideo) L.push(`【参考動画】${refVideo}／【参考点】${refVideoNote || "指定なし"}`);
      if (deliverBest && variants !== "1") L.push(`【納品形式】ベスト1案（全案を作ったうえで、最も反応が取れる1案を選んで納品）`);
      if (pfId === "note" && notePaid) {
        L.push(
          `【note形式】有料記事／【無料部分】冒頭の導入と、結論の入口まで。読む価値が伝わり切る手前で止める` +
            `／【有料部分】具体的な手順、数値、判断基準、事例／【区切り】有料部分の直前の行に「ここから有料」とだけ書くこと`
        );
      }
      if (pfId === "note" && noteToX) L.push(`【連携投稿】note→X（記事への誘導投稿も作る）`);
      L.push(
        `【出力形式】そのまま投稿できる本文だけを出力すること。講評・解説・前置きは書かない。` +
          `JSONで包まない。複数案は【案1】【案2】で区切る。` +
          (extras.length ? `追加成果物は本文の後に「──」で区切って出す。` : "")
      );
    }
    if (job === "IMAGE") {
      L.push(`【画像スタイル】${imgStyle}／【描画内容】${imgDesc}`);
    }
    if (job === "POST") {
      L.push(`【投稿日時】${schedule.at}／【繰り返し】${schedule.repeat}／【本文】${theme}`);
    }
    if (acct) L.push(`【投稿先アカウント】${acct.name}（${(PLATFORM_META[acct.platform] || {}).label || acct.platform}${acct.handle ? " @" + acct.handle : ""}）／【持ち主】${acct.owner}／【アカウント方針】${acct.note || "指定なし"}`);
    if (ctx.raw) L.push(`【原文依頼】${ctx.raw.replace(/\n/g, " ")}`);
    return L.join("／");
  };



  /* ── 投稿スケジュール ── */
  const getSched = useCallback((pf2) => sched[pf2] || defaultSchedule(pf2), [sched]);

  const setSchedField = useCallback((pf2, key, val) => {
    setSched((prev) => ({ ...prev, [pf2]: { ...(prev[pf2] || defaultSchedule(pf2)), [key]: val } }));
  }, []);

  const toggleDay = useCallback((pf2, d) => {
    setSched((prev) => {
      const cur = prev[pf2] || defaultSchedule(pf2);
      const days = cur.days.indexOf(d) >= 0 ? cur.days.filter((x) => x !== d) : [...cur.days, d];
      return { ...prev, [pf2]: { ...cur, days: DAYS.filter((x) => days.indexOf(x) >= 0) } };
    });
  }, []);

  const updateSlot = useCallback((pf2, slotId, fn) => {
    setSched((prev) => {
      const cur = prev[pf2] || defaultSchedule(pf2);
      return { ...prev, [pf2]: { ...cur, slots: cur.slots.map((sl) => (sl.id === slotId ? fn({ ...sl }) : sl)) } };
    });
  }, []);

  const addSlot = useCallback((pf2) => {
    setSched((prev) => {
      const cur = prev[pf2] || defaultSchedule(pf2);
      if (cur.slots.length >= 5) return prev;
      return { ...prev, [pf2]: { ...cur, slots: [...cur.slots, emptySlot("12:00")] } };
    });
  }, []);

  const removeSlot = useCallback((pf2, slotId) => {
    setSched((prev) => {
      const cur = prev[pf2] || defaultSchedule(pf2);
      if (cur.slots.length <= 1) return prev;
      return { ...prev, [pf2]: { ...cur, slots: cur.slots.filter((sl) => sl.id !== slotId) } };
    });
  }, []);

  const attachSlotImages = useCallback((pf2, slotId, files, done) => {
    Array.from(files || []).slice(0, 2).forEach((f) => {
      readImageSmall(f, (data) => {
        updateSlot(pf2, slotId, (sl) => ({ ...sl, images: [...sl.images, { name: f.name, data: data, note: "" }].slice(0, 2) }));
      });
    });
    if (done) done();
  }, [updateSlot]);

  /* ── お手本（媒体×パーツ）の操作 ── */
  const refTargets = useMemo(() => {
    if (plan && plan.platforms && plan.platforms.length) return plan.platforms.map((p) => p.id);
    if (wantPlatforms.length) return wantPlatforms;
    return ["x"];
  }, [plan, wantPlatforms]);

  useEffect(() => {
    if (refTargets.length && refTargets.indexOf(refPf) < 0) setRefPf(refTargets[0]);
  }, [refTargets, refPf]);

  const getPartRef = useCallback(
    (pf2, partId, slotKey) => {
      const k = slotKey || refSlot;
      const bs = (refs[pf2] && refs[pf2].bySlot) || {};
      const own = (bs[k] && bs[k][partId]) || null;
      if (own && partFilled(own)) return own;
      // 時間ごとの設定が無ければ、共通の設定を使います
      const com = (bs.common && bs.common[partId]) || null;
      return own || com || emptyPartRef();
    },
    [refs, refSlot]
  );

  const updatePart = useCallback((pf2, partId, fn) => {
    setRefs((prev) => {
      const cur = prev[pf2] || {};
      const bs = cur.bySlot || {};
      const slot = bs[refSlot] || {};
      const part = slot[partId] || emptyPartRef();
      return {
        ...prev,
        [pf2]: { ...cur, bySlot: { ...bs, [refSlot]: { ...slot, [partId]: fn({ ...part }) } } },
      };
    });
  }, [refSlot]);

  const setRefField = useCallback((pf2, key, val) => {
    setRefs((prev) => ({ ...prev, [pf2]: { ...(prev[pf2] || {}), [key]: val } }));
  }, []);

  const setPartText = useCallback((pf2, partId, i, val) => {
    updatePart(pf2, partId, (p) => {
      const t = [...p.texts];
      t[i] = val;
      return { ...p, texts: t };
    });
  }, [updatePart]);

  const addPartText = useCallback((pf2, partId) => {
    updatePart(pf2, partId, (p) => ({ ...p, texts: [...p.texts, ""] }));
  }, [updatePart]);

  const removePartText = useCallback((pf2, partId, i) => {
    updatePart(pf2, partId, (p) => ({ ...p, texts: p.texts.filter((_, k) => k !== i) }));
  }, [updatePart]);

  const setPartField = useCallback((pf2, partId, key, val) => {
    updatePart(pf2, partId, (p) => ({ ...p, [key]: val }));
  }, [updatePart]);

  const attachImages = useCallback((pf2, partId, files, done) => {
    Array.from(files || []).slice(0, 3).forEach((f) => {
      if (f.size > 8 * 1024 * 1024) {
        setFlash({ ok: false, msg: `${f.name} は大きすぎます（8MBまで）。` });
        return;
      }
      readImageSmall(f, (data) => {
        updatePart(pf2, partId, (p) => ({ ...p, images: [...p.images, { name: f.name, data: data, note: "" }].slice(0, 3) }));
      });
    });
    if (done) done();
  }, [updatePart]);

  const setImageNote = useCallback((pf2, partId, i, val) => {
    updatePart(pf2, partId, (p) => ({ ...p, images: p.images.map((x, k) => (k === i ? { ...x, note: val } : x)) }));
  }, [updatePart]);

  const removeImage = useCallback((pf2, partId, i) => {
    updatePart(pf2, partId, (p) => ({ ...p, images: p.images.filter((_, k) => k !== i) }));
  }, [updatePart]);

  const platformRefStatus = useCallback(
    (pf2, slotKey) => {
      const parts = PART_DEFS[pf2] || PART_DEFS.other;
      const done = parts.filter((pt) => partFilled(getPartRef(pf2, pt.id, slotKey))).length;
      return { done: done, total: parts.length };
    },
    [getPartRef]
  );

  /** 選んだ時間のお手本・投稿内容を、制作条件に反映します */
  const applySlot = useCallback(
    (pf2, slotKey) => {
      const parts = PART_DEFS[pf2] || PART_DEFS.other;
      const bs = (refs[pf2] && refs[pf2].bySlot) || {};
      const pick = (partId) => {
        const own = (bs[slotKey] && bs[slotKey][partId]) || null;
        const com = (bs.common && bs.common[partId]) || null;
        return own && partFilled(own) ? own : com || emptyPartRef();
      };
      const texts = parts.flatMap((pt) => pick(pt.id).texts).filter((t) => String(t).trim().length > 5);
      const inf = inferSettings(texts);
      if (inf) {
        setTone(inf.tone);
        setStruct(inf.struct);
        setHook(inf.hook);
        setPerson(inf.person);
        setEmoji(inf.emoji);
        setCta(inf.cta);
        setLen(inf.len);
        setAutoSet(inf);
        setTweak(false);
      }
      // その時間に投稿したい内容を、テーマの下書きとして入れます
      if (slotKey !== "common") {
        const sl = getSched(pf2).slots.find((x) => x.id === slotKey);
        if (sl && sl.brief && !theme.trim()) setTheme(sl.brief);
      }
    },
    [refs, getSched, theme]
  );

  /** 依頼したあと、完成するまで状態を追いかけます */
  const watchJob = useCallback(
    (jobId, url) => {
      setWatch({ id: jobId, status: "受付", url: "", tries: 0 });
      let tries = 0;
      const timer = setInterval(async () => {
        tries++;
        if (tries > 40) {
          clearInterval(timer);
          setWatch((w) => (w && w.id === jobId ? { ...w, status: "時間切れ" } : w));
          return;
        }
        try {
          const r = await fetch(`${url}?action=jobs`);
          const d = await r.json();
          const hit = (d.jobs || []).find((j) => j.job_id === jobId);
          if (!hit) return;
          setWatch({ id: jobId, status: hit["状態"], url: hit["成果物URL"] || "", tries: tries });
          if (hit["状態"] === "完了" || hit["状態"] === "エラー") {
            clearInterval(timer);
            if (typeof pushLog === "function") {
              pushLog(`[${new Date().toLocaleTimeString()}] JOB ${hit["状態"] === "完了" ? "DELIVERED" : "FAILED"}: ${jobId}`);
            }
          }
        } catch (e) {
          /* 一時的な失敗は無視して、次の巡回に任せます */
        }
      }, 8000);
    },
    [pushLog]
  );

  const send = async (job, label) => {
    if (sending) return;
    if (!acct) return setFlash({ ok: false, msg: "先にアカウント管理でアカウントを登録してください。" });
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
    const refImagesPayload = [];
    (PART_DEFS[pfId] || PART_DEFS.other).forEach((pt) => {
      const r = getPartRef(pfId, pt.id, prodSlot);
      (r.images || []).slice(0, 2).forEach((im) => {
        if (refImagesPayload.length < 3) {
          refImagesPayload.push({ part: pt.label, note: im.note || "", data: im.data });
        }
      });
    });

    const payload = {
      client_name: acct ? (acct.ownerType === "own" ? `${OWNER.name}／${acct.name}` : `${acct.owner}／${acct.name}`) : OWNER.name,
      client_email: acct && acct.email ? acct.email : OWNER.email,
      message: buildMessage(job),
      ref_images: job === "CONTENT" ? refImagesPayload : [],
    };
    let ok = true;
    let detail = "";
    let newJobId = "";
    if (settings.liveSubmit !== false) {
      try {
        const r = await fetch(endpoint.url, {
          method: "POST",
          headers: { "Content-Type": endpoint.contentType },
          body: JSON.stringify(payload),
        });
        ok = r.ok;
        if (ok && endpoint.isGas) {
          // GASはエラーでもHTTP 200を返すため、中身を確認します
          try {
            const d = JSON.parse(await r.text());
            if (d && d.ok === false) {
              ok = false;
              detail = String(d.error || "").slice(0, 200);
            } else if (d && d.job_id) {
              newJobId = d.job_id;
            }
          } catch (e2) {
            /* 応答が読めなくても、送信自体は届いているとみなします */
          }
        }
      } catch (e) {
        ok = false;
        detail = "通信に失敗しました";
      }
    }
    await new Promise((r) => setTimeout(r, Math.max(0, 1100 - (Date.now() - t0))));

    const now = new Date();
    setJobs((j) => [{
      id: String(now.getTime()), pf: job === "PLAN" ? "運用設計" : pf.label, tone: job === "PLAN" ? "#7C5CD6" : pf.tone,
      soft: job === "PLAN" ? "#F1EDFC" : pf.soft, kind: label,
      title: (job === "IMAGE" ? imgDesc : job === "PLAN" ? ctx.company || "自社" : theme).slice(0, 40),
      at: job === "POST" ? schedule.at.replace("T", " ") : now.toLocaleString("ja-JP", { hour12: false }).slice(0, 16),
      status: ok ? (job === "POST" ? "予約済み" : "制作中") : "送信失敗",
      billing: acct && acct.ownerType === "client" ? "課金" : "無料", isPost: job === "POST",
    }, ...j].slice(0, 40));

    note(`[${now.toLocaleTimeString()}] STUDIO ${job} ${ok ? "SUBMITTED" : "FAILED"}`);
    setFlash({
      ok,
      msg: ok
        ? job === "POST"
          ? "予約しました。予約投稿タブで確認できます。"
          : "依頼を受け付けました。5分以内に処理が始まり、完成するとメールとGoogle Driveに届きます。"
        : "送信できませんでした。" + (detail ? "（" + detail + "）" : "接続設定で状態を確認してください。"),
    });
    if (ok && newJobId && endpoint.isGas && job !== "POST") {
      watchJob(newJobId, endpoint.url);
    }

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
      <style>{CSS_STUDIO}</style>

      <header className="stHead">
        <p className="stHead__en">PRODUCTION STUDIO</p>
        <h1>制作スタジオ</h1>
        <p className="stHead__s">最適な条件をAIが提案し、そこから調整して制作します。</p>
      </header>

      {!endpoint.isGas && (
        <div className="stAlert">
          <Sic name="warn" size={17} />
          <p>
            バックエンドが未接続です。このまま送信しても<b>成果物は保存・納品されません</b>。
            左メニューの「接続設定」からGoogle Apps Scriptを接続してください。
          </p>
        </div>
      )}

      {/* 投稿先アカウント */}
      <div className="stAcct">
        {live.length === 0 ? (
          <div className="stAcct__none">
            <Sic name="warn" size={17} />
            <p>運用中のアカウントがありません。左メニューの<b>「アカウント管理」</b>から登録してください。</p>
          </div>
        ) : (
          <>
            <span className="stAcct__k">投稿先</span>
            <select className="stAcct__s" value={acct ? acct.id : ""} onChange={(e) => setAcctId(e.target.value)}>
              {live.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.owner}／{a.name}（{(PLATFORM_META[a.platform] || {}).label || a.platform}）
                </option>
              ))}
            </select>
            {acct && (
              <span className={`stAcct__b ${acct.ownerType === "own" ? "is-own" : ""}`}>
                {acct.ownerType === "own" ? "社内利用（無料）" : "お客様案件（課金）"}
              </span>
            )}
            {acct && acct.handle && <span className="stAcct__h">@{acct.handle}</span>}
          </>
        )}
      </div>

      {/* ステップ */}
      <div className="stSteps">
        {[
          { n: 1, l: "運用設計", s: "何をどこにどれだけ" },
          { n: 2, l: "お手本分析", s: "文体を読み取る" },
          { n: 3, l: "制作", s: "条件を詰めて生成" },
          { n: 4, l: "投稿予約", s: "キューに積む" },
        ].map((s) => (
          <button
            key={s.n}
            className={`stStep ${step === s.n ? "is-on" : ""} ${step > s.n ? "is-done" : ""} ${!plan && s.n > 1 ? "is-lock" : ""}`}
            onClick={() => {
              if (!plan && s.n > 1) {
                setStep(1);
                setFlash({ ok: false, msg: "先にSTEP1でAIに運用プランを提案させてください。" });
                setTimeout(() => setFlash(null), 4000);
                return;
              }
              setStep(s.n);
            }}
          >
            <span className="stStep__n">{step > s.n ? <Sic name="check" size={15} /> : s.n}</span>
            <span><b>{s.l}</b><em>{s.s}</em></span>
            {!plan && s.n > 1 && <span className="stStep__lock">未</span>}
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

              <Field label="運用したいSNS" hint="決まっていなければ選ばなくて構いません。AIが業種と目的から提案します" ai>
                <div className="stChips">
                  {PLATFORMS.map((pf2) => (
                    <button
                      key={pf2.id}
                      type="button"
                      className={wantPlatforms.indexOf(pf2.id) >= 0 ? "is-on" : ""}
                      onClick={() =>
                        setWantPlatforms(
                          wantPlatforms.indexOf(pf2.id) >= 0
                            ? wantPlatforms.filter((x) => x !== pf2.id)
                            : [...wantPlatforms, pf2.id]
                        )
                      }
                    >
                      {pf2.label}
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

              <button className="stMore" onClick={() => setMoreCtx((v) => !v)}>
                {moreCtx ? "詳しい情報を閉じる" : "＋ 詳しく書く（任意・精度が上がります）"}
              </button>

              <div style={{ display: moreCtx ? "block" : "none" }}>
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

              </div>

              <button className="stBig" onClick={runPlan}>
                <Sic name="spark" size={17} />
                {plan ? "条件を変えて、もう一度提案させる" : "AIに最適な運用プランを提案させる"}
              </button>

              {!plan && (
                <p className="stGate">
                  <Sic name="warn" size={15} />
                  上のボタンでAIに提案させると、次のステップに進めます。
                  {wantPlatforms.length > 0
                    ? `選んだ${wantPlatforms.length}媒体を優先して、形式・頻度・時間帯・トーンを設計します。`
                    : "媒体が未選択の場合は、業種と目的から最適な媒体をAIが選びます。"}
                </p>
              )}

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
                          <button className="stPlan__use" onClick={() => { setPfId(p.id); setFmtId(p.format); setStep(3); }}>
                            この媒体で制作する →
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* 投稿スケジュール（媒体ごと） */}
                  <div className="stSched">
                    <div className="stRefTabs">
                      {plan.platforms.map((pp) => {
                        const P = PLATFORMS.find((x) => x.id === pp.id);
                        const sc = getSched(pp.id);
                        return (
                          <button
                            key={pp.id}
                            className={`stRefTab ${schedPf === pp.id ? "is-on" : ""}`}
                            style={{ "--t": P.tone, "--s": P.soft }}
                            onClick={() => setSchedPf(pp.id)}
                          >
                            <span className="stRefTab__d" />
                            <b>{P.label}</b>
                            <em>週{sc.days.length}日 × {sc.slots.length}回</em>
                          </button>
                        );
                      })}
                    </div>

                    {(() => {
                      const sc = getSched(schedPf);
                      return (
                        <>
                          <Field label="投稿する曜日" hint="クリックで選び直せます。複数選択できます">
                            <div className="stDays">
                              {DAYS.map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  className={`stDay ${sc.days.indexOf(d) >= 0 ? "is-on" : ""} ${d === "土" || d === "日" ? "is-we" : ""}`}
                                  onClick={() => toggleDay(schedPf, d)}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </Field>

                          <p className="stSlots__k">
                            1日の投稿回数と時刻
                            <em>{sc.slots.length}回／日</em>
                          </p>

                          <div className="stSlots">
                            {sc.slots.map((sl, i) => (
                              <div className="stSlot" key={sl.id}>
                                <div className="stSlot__h">
                                  <input
                                    className="stSlot__time"
                                    type="time"
                                    value={sl.time}
                                    onChange={(e) => updateSlot(schedPf, sl.id, (x) => ({ ...x, time: e.target.value }))}
                                  />
                                  <span className="stSlot__n">{i + 1}回目</span>
                                  {sc.slots.length > 1 && (
                                    <button className="stSlot__x" onClick={() => removeSlot(schedPf, sl.id)} aria-label="削除">×</button>
                                  )}
                                </div>
                                <textarea
                                  rows={2}
                                  value={sl.brief}
                                  onChange={(e) => updateSlot(schedPf, sl.id, (x) => ({ ...x, brief: e.target.value }))}
                                  placeholder={`この時間に投稿したい内容（例：朝は挨拶と今日の注目、夜は解説）`}
                                />
                                <div className="stSlot__media">
                                  <label className="stMedia__add">
                                    <Sic name="image" size={14} />
                                    画像
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      hidden
                                      onChange={(e) => attachSlotImages(schedPf, sl.id, e.target.files, () => (e.target.value = ""))}
                                    />
                                  </label>
                                  <input
                                    type="text"
                                    value={sl.video}
                                    onChange={(e) => updateSlot(schedPf, sl.id, (x) => ({ ...x, video: e.target.value }))}
                                    placeholder="参考動画のURL（任意）"
                                  />
                                </div>
                                {sl.images.length > 0 && (
                                  <div className="stSlot__imgs">
                                    {sl.images.map((im, k) => (
                                      <span key={k}>
                                        <img src={im.data} alt="" />
                                        <button
                                          onClick={() =>
                                            updateSlot(schedPf, sl.id, (x) => ({ ...x, images: x.images.filter((_, j) => j !== k) }))
                                          }
                                          aria-label="削除"
                                        >×</button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {sc.slots.length < 5 && (
                            <button className="stPart__add" onClick={() => addSlot(schedPf)}>
                              ＋ 投稿する時間を追加する
                            </button>
                          )}

                          <p className="stSched__sum">
                            {PLATFORMS.find((x) => x.id === schedPf).label}：
                            <b>{sc.days.join("・")}</b> の <b>{sc.slots.map((x) => x.time).join(" / ")}</b>
                            　＝ 週 {sc.days.length * sc.slots.length} 投稿
                          </p>
                        </>
                      );
                    })()}
                  </div>

                  <Field label="コンテンツの柱" ai={!touched.pillars} hint="この3本を軸に投稿を作り分けます。書き換えられます">
                    <textarea rows={3} value={plan.pillars.join("\n")} onChange={(e) => { setPlan({ ...plan, pillars: e.target.value.split("\n") }); mark("pillars"); }} />
                  </Field>

                  <Field label="プロフィール文案" hint="そのままコピーして各SNSのプロフィール欄に貼れます">
                    <textarea rows={4} value={profileText} readOnly />
                  </Field>
                  <button
                    className="stCopy"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(profileText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch (e) {
                        setFlash({ ok: false, msg: "コピーできませんでした。手動で選択してください。" });
                      }
                    }}
                  >
                    <Sic name={copied ? "check" : "copy"} size={14} />
                    {copied ? "コピーしました" : "プロフィール文をコピー"}
                  </button>

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
                    <button className="stNext" onClick={() => setStep(2)}>お手本の設定へ進む →</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ============== STEP 2：お手本分析（媒体・パーツ別） ============== */}
          {step === 2 && (
            <>
              <div className="stHint">
                <Sic name="spark" size={16} />
                <p>
                  制作するパーツごとに、<b>お手本を1つ以上</b>設定してください。文章・画像・動画のいずれでも構いません。
                  文章は文字数や改行のリズムを実測し、画像は内容をAIが読み取って制作条件に反映します。
                </p>
              </div>

              {/* 媒体タブ */}
              <div className="stRefTabs">
                {refTargets.map((id) => {
                  const P = PLATFORMS.find((x) => x.id === id);
                  const st = platformRefStatus(id, "common");
                  return (
                    <button
                      key={id}
                      className={`stRefTab ${refPf === id ? "is-on" : ""} ${st.done === st.total ? "is-ok" : ""}`}
                      style={{ "--t": P.tone, "--s": P.soft }}
                      onClick={() => setRefPf(id)}
                    >
                      <span className="stRefTab__d" />
                      <b>{P.label}</b>
                      <em>
                        {st.done}/{st.total}
                      </em>
                    </button>
                  );
                })}
              </div>

              <Field label="お手本にするアカウント" hint="任意。名前だけでは推測になるため、下の設定が本命です">
                <input
                  type="text"
                  value={(refs[refPf] && refs[refPf].account) || ""}
                  onChange={(e) => setRefField(refPf, "account", e.target.value)}
                  placeholder="@example ／ https://note.com/example"
                />
              </Field>

              {/* 時間ごとのお手本 */}
              <Field label="どの時間の投稿に使うお手本か" hint="共通のまま進めても構いません。時間ごとに変えたいときだけ切り替えてください">
                <div className="stSlotTabs">
                  <button className={refSlot === "common" ? "is-on" : ""} onClick={() => setRefSlot("common")}>
                    すべての時間に共通
                  </button>
                  {getSched(refPf).slots.map((sl) => {
                    const st2 = platformRefStatus(refPf, sl.id);
                    return (
                      <button key={sl.id} className={refSlot === sl.id ? "is-on" : ""} onClick={() => setRefSlot(sl.id)}>
                        {sl.time}
                        <em>{st2.done}/{st2.total}</em>
                      </button>
                    );
                  })}
                </div>
              </Field>

              {refSlot !== "common" && (
                <p className="stSlotNote">
                  {getSched(refPf).slots.find((x) => x.id === refSlot)
                    ? `${getSched(refPf).slots.find((x) => x.id === refSlot).time} の投稿に使うお手本です。設定しなかったパーツは、共通のお手本が使われます。`
                    : ""}
                </p>
              )}

              {/* パーツごとの設定 */}
              <div className="stParts">
                {(PART_DEFS[refPf] || PART_DEFS.other).map((part) => {
                  const r = getPartRef(refPf, part.id);
                  const filled = partFilled(r);
                  const open = openPart === `${refPf}:${part.id}`;
                  const st = analyzeStyle(r.texts);
                  return (
                    <div className={`stPart ${filled ? "is-ok" : ""} ${open ? "is-open" : ""}`} key={part.id}>
                      <button className="stPart__h" onClick={() => setOpenPart(open ? "" : `${refPf}:${part.id}`)}>
                        <span className="stPart__m">{filled ? <Sic name="check" size={14} /> : "必"}</span>
                        <span className="stPart__t">
                          <b>{part.label}</b>
                          <em>{part.hint}</em>
                        </span>
                        <span className="stPart__c">
                          {filled
                            ? `${r.texts.filter((t) => t.trim()).length ? r.texts.filter((t) => t.trim()).length + "本" : ""}${
                                r.images.length ? " 画像" + r.images.length : ""
                              }${r.video ? " 動画" : ""}`
                            : "未設定"}
                        </span>
                        <span className={`stPart__a ${open ? "is-up" : ""}`}><Sic name="chev" size={16} /></span>
                      </button>

                      {open && (
                        <div className="stPart__b">
                          {part.type !== "media" && (
                            <>
                              {r.texts.map((t, i) => (
                                <div className="stPart__row" key={i}>
                                  <span className="stPart__n">{i + 1}</span>
                                  <textarea
                                    rows={i === 0 ? 4 : 3}
                                    value={t}
                                    onChange={(e) => setPartText(refPf, part.id, i, e.target.value)}
                                    placeholder={
                                      i === 0
                                        ? `お手本にしたい${part.label}を、そのまま貼り付けてください。`
                                        : "2本目以降を貼るほど精度が上がります。"
                                    }
                                  />
                                  {r.texts.length > 1 && (
                                    <button className="stPart__x" onClick={() => removePartText(refPf, part.id, i)} aria-label="削除">×</button>
                                  )}
                                </div>
                              ))}
                              <button className="stPart__add" onClick={() => addPartText(refPf, part.id)}>
                                ＋ もう1本追加する
                              </button>

                              {st && (
                                <div className="stPart__stat">
                                  <span className={`stPart__lv lv-${st.level.pct}`}>{st.level.label}</span>
                                  {styleToBrief(st)}
                                </div>
                              )}
                            </>
                          )}

                          <div className="stPart__media">
                            <label className="stMedia__add">
                              <Sic name="image" size={15} />
                              画像を添付
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                hidden
                                onChange={(e) => attachImages(refPf, part.id, e.target.files, () => (e.target.value = ""))}
                              />
                            </label>
                            <input
                              className="stPart__vid"
                              type="text"
                              value={r.video}
                              onChange={(e) => setPartField(refPf, part.id, "video", e.target.value)}
                              placeholder="参考動画のURL（任意）"
                            />
                          </div>

                          {r.images.length > 0 && (
                            <div className="stMedia__l">
                              {r.images.map((im, i) => (
                                <div className="stMedia__i" key={i}>
                                  <img src={im.data} alt="" />
                                  <div>
                                    <p>{im.name}</p>
                                    <input
                                      type="text"
                                      value={im.note}
                                      onChange={(e) => setImageNote(refPf, part.id, i, e.target.value)}
                                      placeholder="この画像のどこを参考にするか（例：文字の置き方、色数の少なさ）"
                                    />
                                  </div>
                                  <button onClick={() => removeImage(refPf, part.id, i)} aria-label="削除">×</button>
                                </div>
                              ))}
                            </div>
                          )}

                          {r.video && (
                            <input
                              className="stPart__vnote"
                              type="text"
                              value={r.videoNote}
                              onChange={(e) => setPartField(refPf, part.id, "videoNote", e.target.value)}
                              placeholder="その動画の、どこを参考にするか（例：冒頭2秒のテロップ、カットの速さ）"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="stWarn">
                <Sic name="warn" size={17} />
                <p>
                  参考にするのは文体や構成の <b>型</b> です。表現や画像をそのまま複製することはしません。
                  貼り付けた文章と画像は、分析のためだけに使われます。
                </p>
              </div>

              <div className="stFoot">
                <p className="stFoot__c">
                  <button className="stBack" onClick={() => setStep(1)}>← 運用設計に戻る</button>
                  <span>進捗</span>
                  {(() => {
                    const a = refTargets.map((id) => platformRefStatus(id));
                    const done = a.reduce((n, x) => n + x.done, 0);
                    const total = a.reduce((n, x) => n + x.total, 0);
                    return `${done} / ${total} パーツ設定済み`;
                  })()}
                </p>
                <button
                  className="stSend"
                  onClick={() => {
                    const st = platformRefStatus(refPf, "common");
                    if (st.done < st.total) {
                      setFlash({ ok: false, msg: `${(PLATFORMS.find((x) => x.id === refPf) || {}).label} の「すべての時間に共通」で未設定のパーツがあります（${st.done}/${st.total}）。` });
                      setTimeout(() => setFlash(null), 5000);
                      return;
                    }
                    setPfId(refPf);
                    setProdSlot("common");
                    const P = PLATFORMS.find((x) => x.id === refPf);
                    if (P) setFmtId(P.formats[0].id);

                    // お手本から制作条件を自動で決めます
                    const allTexts = (PART_DEFS[refPf] || PART_DEFS.other)
                      .flatMap((pt) => getPartRef(refPf, pt.id, "common").texts)
                      .filter((t) => String(t).trim().length > 5);
                    const inf = inferSettings(allTexts);
                    if (inf) {
                      setTone(inf.tone);
                      setStruct(inf.struct);
                      setHook(inf.hook);
                      setPerson(inf.person);
                      setEmoji(inf.emoji);
                      setCta(inf.cta);
                      setLen(inf.len);
                      setAutoSet(inf);
                      setTweak(false);
                      if (typeof pushLog === "function") {
                        pushLog(`[${new Date().toLocaleTimeString()}] STYLE APPLIED: ${inf.tone} / ${inf.struct} / ${inf.hook}`);
                      }
                    }
                    setStep(3);
                  }}
                >
                  <Sic name="send" size={16} />
                  この媒体の制作へ進む
                </button>
              </div>
            </>
          )}

          {/* ============== STEP 3：制作 ============== */}
          {step === 3 && (
            <>
              {!plan && (
                <div className="stHint">
                  <Sic name="spark" size={16} />
                  <p>
                    先に<b>STEP1「運用設計」</b>でAIに提案させると、媒体・トーン・構成・検査レベルが自動で設定されます。
                    このまま手動で指定して進めることもできます。
                  </p>
                  <button onClick={() => setStep(1)}>設計する →</button>
                </div>
              )}
              <div className="stPf">
                {PLATFORMS.filter((p) => refTargets.indexOf(p.id) >= 0).map((p) => (
                  <button key={p.id} className={`stPf__b ${pfId === p.id ? "is-on" : ""}`} style={{ "--t": p.tone, "--s": p.soft }}
                    onClick={() => { setPfId(p.id); setFmtId(p.formats[0].id); setProdSlot("common"); }}>
                    <span className="stPf__d" /><b>{p.label}</b>
                  </button>
                ))}
              </div>

              {getSched(pfId).slots.length > 0 && (
                <Field label="どの時間の投稿をつくるか" hint="時間ごとにお手本や投稿内容を設定していれば、それが反映されます">
                  <div className="stSlotTabs">
                    <button className={prodSlot === "common" ? "is-on" : ""} onClick={() => { setProdSlot("common"); applySlot(pfId, "common"); }}>
                      指定しない
                    </button>
                    {getSched(pfId).slots.map((sl) => (
                      <button key={sl.id} className={prodSlot === sl.id ? "is-on" : ""} onClick={() => { setProdSlot(sl.id); applySlot(pfId, sl.id); }}>
                        {sl.time}
                        {sl.brief && <em>設定あり</em>}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

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

                  {autoSet && !tweak && (
                    <div className="stAuto">
                      <p className="stAuto__k">
                        <Sic name="spark" size={15} />
                        お手本{autoSet.from}本から、制作条件を決めました
                        <button onClick={() => setTweak(true)}>調整する</button>
                      </p>
                      <ul className="stAuto__l">
                        {[
                          ["トーン", tone],
                          ["構成", struct],
                          ["フック", hook],
                          ["一人称", person],
                          ["絵文字", emoji],
                          ["CTA", cta],
                          ["文字数", len + " 字"],
                        ].map(([k, v]) => (
                          <li key={k}>
                            <span>{k}</span>
                            {v}
                          </li>
                        ))}
                      </ul>
                      <p className="stAuto__n">
                        このまま制作を依頼できます。変えたいところがあれば「調整する」を押してください。
                      </p>
                    </div>
                  )}

                  <div className="stDetail" style={{ display: autoSet && !tweak ? "none" : "block" }}>
                    <p className="stDetail__k">
                      細かい条件
                      {autoSet && (
                        <button className="stDetail__back" onClick={() => setTweak(false)}>
                          判定結果に戻す
                        </button>
                      )}
                    </p>
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
                  <div className="stIdeaBar">
                    <button className="stIdeaBtn" onClick={() => { setIdeas(suggestImagePrompts(ctx, imgStyle, fmt.ratio || "1:1", theme, seed)); setSeed(seed + 1); }}>
                      <Sic name="spark" size={15} />
                      {ideas.length ? "別の案を出す" : "AIに指示文を書かせる"}
                    </button>
                    <span className="stIdeaBar__n">
                      テーマ・業種・目的から3案つくります。選んでそのまま送れます。
                    </span>
                  </div>

                  {ideas.length > 0 && (
                    <div className="stIdeas">
                      {ideas.map((it, i) => (
                        <button
                          key={it.label + i}
                          className={`stIdea ${imgDesc === it.text ? "is-on" : ""}`}
                          onClick={() => setImgDesc(it.text)}
                        >
                          <span className="stIdea__h">
                            <b>{it.label}</b>
                            <em>{it.note}</em>
                          </span>
                          <span className="stIdea__t">{it.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <Field label="描いてほしい内容" hint="上の案を選ぶと入ります。そのまま編集できます。送信後、AIが英語の詳細プロンプトに仕上げます">
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

                {variants !== "1" && (
                  <div className="stQ__row">
                    <span className="stQ__l">納品のしかた</span>
                    <div className="stSeg">
                      <button className={deliverBest ? "is-on" : ""} onClick={() => setDeliverBest(true)}>AIが選んだ1案</button>
                      <button className={!deliverBest ? "is-on" : ""} onClick={() => setDeliverBest(false)}>{variants}案すべて</button>
                    </div>
                    <span className="stQ__n">
                      {deliverBest
                        ? `${variants}案つくったうえで、最も反応が取れる1案をAIが選んで先頭に置きます。残りも参考として付きます。`
                        : "すべての案を並べて納品します。自分で選びたいときに。"}
                    </span>
                  </div>
                )}
              </div>

              <div className="stPack">
                <p className="stPack__k">
                  納品パッケージ
                  <em>{pfId === "note" ? "note一式" : pfId === "x" ? "X一式" : "標準"}</em>
                </p>
                <ul className="stPack__l">
                  {(pfId === "note"
                    ? ["記事本文（無料枠・有料枠つき）", "タイトル案5つ", "サムネイル画像", "差し込み画像2枚", "X誘導投稿3案"]
                    : pfId === "x"
                    ? ["投稿本文", "続きのスレッド3〜5投稿", "添付画像1枚"]
                    : ["本文", "ハッシュタグ案・フック案"]
                  ).map((t) => (
                    <li key={t}>
                      <Sic name="check" size={14} />
                      {t}
                    </li>
                  ))}
                </ul>
                <label className="stCheck">
                  <input type="checkbox" checked={wantImages} onChange={(e) => setWantImages(e.target.checked)} />
                  <span>
                    <b>画像も生成する</b>
                    <em>1枚あたり数十円の実費がかかります。文章だけでよければ外してください</em>
                  </span>
                </label>
              </div>

              {pfId === "note" && (
                <div className="stNote">
                  <p className="stNote__k">
                    note の書き方
                    <em>任意</em>
                  </p>
                  <label className="stCheck">
                    <input type="checkbox" checked={notePaid} onChange={(e) => setNotePaid(e.target.checked)} />
                    <span>
                      <b>有料記事の構成にする</b>
                      <em>導入と結論の入口までを無料、具体的な手順・数値・事例を有料部分に。区切り位置も指定されます</em>
                    </span>
                  </label>
                  <label className="stCheck">
                    <input type="checkbox" checked={noteToX} onChange={(e) => setNoteToX(e.target.checked)} />
                    <span>
                      <b>X への誘導投稿もつくる</b>
                      <em>記事公開後にXへ流すための告知文を3案。140字以内・「詳細はnoteへ」つき</em>
                    </span>
                  </label>
                </div>
              )}

              <div className="stFoot">
                <p className="stFoot__c">
                  <button className="stBack" onClick={() => setStep(2)}>← お手本分析に戻る</button>
                  <span>納品前</span>{qa === "strict" ? "QA_Ethics_AIが二重検査します" : "QA_Ethics_AIが一次検査します"}
                  {(pfId === "tiktok" || pfId === "yt_shorts" || pfId === "youtube") && (
                    <em className="stNoteInline">映像は台本→自動書き出し（未設定時は台本のみ納品）</em>
                  )}
                </p>
                <button className="stSend" onClick={() => send(subTab === "content" ? "CONTENT" : "IMAGE", subTab === "content" ? `${fmt.label}・${variants}案` : "画像")} disabled={sending}>
                  <span className={sending ? "stSpin" : ""}><Sic name={sending ? "loader" : "send"} size={16} /></span>
                  {sending ? "送信中..." : subTab === "content" ? `${variants}案の制作を依頼` : "画像の制作を依頼"}
                </button>
              </div>
            </>
          )}

          {/* ============== STEP 3 ============== */}
          {step === 4 && (
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
                <p className="stFoot__c">
                  <button className="stBack" onClick={() => setStep(3)}>← 制作に戻る</button>
                  <span>配信</span>指定時刻の直近の配信タイミングで投稿されます
                </p>
                <button className="stSend" onClick={() => send("POST", "予約投稿")} disabled={sending}>
                  <span className={sending ? "stSpin" : ""}><Sic name={sending ? "loader" : "clock"} size={16} /></span>
                  {sending ? "送信中..." : "予約する"}
                </button>
              </div>
            </>
          )}

          {flash && <p className={`stFlash ${flash.ok ? "" : "is-ng"}`}>{flash.msg}</p>}

          {watch && (
            <div className={`stWatch is-${watch.status}`}>
              <div className="stWatch__bar">
                {["受付", "制作中", "完了"].map((st) => {
                  const order = { 受付: 0, 保留: 0, 制作中: 1, 完了: 2, エラー: 1, 時間切れ: 1 };
                  const cur = order[watch.status] !== undefined ? order[watch.status] : 0;
                  const idx = { 受付: 0, 制作中: 1, 完了: 2 }[st];
                  return (
                    <span key={st} className={`stWatch__s ${idx <= cur ? "is-on" : ""} ${idx === cur ? "is-now" : ""}`}>
                      <em />
                      {st}
                    </span>
                  );
                })}
              </div>
              <p className="stWatch__t">
                {watch.status === "完了" ? (
                  <>
                    納品しました。
                    {watch.url && (
                      <a href={watch.url} target="_blank" rel="noopener noreferrer">
                        成果物を開く →
                      </a>
                    )}
                  </>
                ) : watch.status === "エラー" ? (
                  "処理に失敗しました。接続設定の「バックエンドの状態を確認」で原因をご覧ください。"
                ) : watch.status === "時間切れ" ? (
                  "時間内に完了しませんでした。成果物ライブラリで状態をご確認ください。"
                ) : (
                  "AIが制作しています。このまま少しお待ちください（1〜3分ほど）。"
                )}
                <button className="stWatch__x" onClick={() => setWatch(null)} aria-label="閉じる">×</button>
              </p>
            </div>
          )}
        </section>

        {/* ---------- 右カラム ---------- */}
        <aside className="stSide">
          {step >= 3 && (
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

/* ================================ CSS_STUDIO ================================== */

const CSS_STUDIO = `
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
.stSteps{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:16px;}
@media (max-width:1100px){.stSteps{grid-template-columns:repeat(2,1fr);}}
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

.stCopy{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:var(--ai);border:1.5px solid var(--ai);border-radius:999px;padding:8px 16px;margin:-8px 0 18px;transition:all .2s;}
.stCopy:hover{background:var(--ai);color:#fff;}
.stBack{font-size:12px;font-weight:700;color:var(--muted);padding:6px 12px;border:1px solid var(--line);border-radius:999px;transition:all .2s;}
.stBack:hover{border-color:var(--ink);color:var(--ink);}
.stHint{display:flex;align-items:center;gap:12px;background:#F5F1FE;border:1px solid #DCD0F7;border-radius:14px;padding:14px 16px;margin-bottom:16px;flex-wrap:wrap;}
.stHint svg{color:var(--ai);flex-shrink:0;}
.stHint p{flex:1;min-width:200px;font-size:12.5px;line-height:1.85;color:#4A3A75;}
.stHint b{font-weight:700;}
.stHint button{font-size:12px;font-weight:700;color:#fff;background:var(--ai);border-radius:999px;padding:8px 16px;white-space:nowrap;}

.stAcct{display:flex;align-items:center;gap:11px;background:var(--white);border:1px solid var(--line);border-radius:16px;padding:13px 16px;margin-bottom:14px;flex-wrap:wrap;}
.stAcct__k{font-family:var(--mono);font-size:9.5px;letter-spacing:.16em;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:4px 10px;}
.stAcct__s{flex:1;min-width:220px;background:var(--bg);border:1.5px solid transparent;border-radius:11px;padding:10px 13px;font:inherit;font-size:13.5px;font-weight:700;}
.stAcct__s:focus{outline:none;background:var(--white);border-color:var(--ai);}
.stAcct__b{font-size:11.5px;font-weight:700;color:#fff;background:var(--sig);border-radius:999px;padding:5px 13px;}
.stAcct__b.is-own{background:#0E9F73;}
.stAcct__h{font-family:var(--mono);font-size:12px;color:var(--muted);}
.stAcct__none{display:flex;align-items:center;gap:11px;width:100%;}
.stAcct__none svg{color:#B47C10;flex-shrink:0;}
.stAcct__none p{font-size:12.5px;line-height:1.85;color:#7A5A12;}

.stAlert{display:flex;align-items:center;gap:11px;background:#FDECEA;border:1px solid #F5C4BF;border-radius:14px;padding:13px 16px;margin-bottom:14px;}
.stAlert svg{color:var(--sig);flex-shrink:0;}
.stAlert p{font-size:12.5px;line-height:1.85;color:#8C2A22;}
.stAlert b{font-weight:700;}
`;

/* ========================= 4. コントロール本体 =========================== */

/* ============================================================================
   株式会社SASHIWA — コントロールダッシュボード（社長専用）
   配置：src/Dashboard.jsx
   表示：#/dashboard （App.jsx 側に3行追加。手順は導入ガイド参照）

   依存パッケージなし（React のみ）。lucide-react は使わず SVG を内蔵しています。
   ============================================================================ */

/* ================================ 設定 ================================== */

// ① ダッシュボードの簡易パスコード。必ず変更してください。
//    ※これはフロント側だけの目隠しです。本気の認証ではありません。
const PASSCODE = "sashiwa0713";

// ② 既存 Make の Webhook（App.jsx と同じもの）。指示送信で実際にAI社員が動きます。
const WEBHOOK_URL = "https://hook.us2.make.com/umnotcrw2pg8twacx68irmjcnnzyjmwv";

// ③ 実データ連携。Google スプレッドシートを「ウェブに公開（CSV）」したURLを入れると
//    デモデータではなく実際の処理履歴を表示します。空文字ならデモモード。
//    想定カラム：timestamp, run_id, client_name, agent, status, summary
const SHEET_CSV_URL = "";

// ④ true にすると指示送信で本当に Make が起動します（1回あたり約7オペレーション消費）。
//    無料プランのオペレーション残量に注意。false なら画面上だけのシミュレーション。
const LIVE_COMMAND = true;

/* ================================ データ ================================ */

/* 3事業ブランド。Webhook の message 先頭 【事業】XXX と対応します。 */
const SERVICES = [
  { code: "AGENT", name: "AI社員構築代行", theme: "#E0402F", soft: "#FDECEA" },
  { code: "STUDIO", name: "文書・動画 自動制作", theme: "#2456C8", soft: "#E8EEFB" },
  { code: "SOCIAL", name: "SNSアカウント運用", theme: "#7C5CD6", soft: "#F1EDFC" },
];

const DEPARTMENTS = [
  {
    id: "exec",
    name: "統括室",
    en: "EXECUTIVE",
    theme: "#E0402F",
    soft: "#FDECEA",
    desc: "依頼を読み解き、担当を決め、実行計画を立てる司令塔。",
    agents: [
      {
        id: "ceo",
        name: "CEO_AI",
        role: "統括責任者",
        tier: "高推論",
        difyApp: "SASHIWA_CEO_AI",
        mission: "依頼内容の構造化・担当エージェントの選定・実行計画の策定",
        status: "稼働中",
        currentTask: "受信した依頼の要件を構造化し、担当を選定中",
        skills: ["要件定義", "作業分解", "進行管理", "優先度判定"],
      },
    ],
  },
  {
    id: "creative",
    name: "制作・広報部",
    en: "CREATIVE & PR",
    theme: "#7C5CD6",
    soft: "#F1EDFC",
    desc: "原稿・構成・デザイン方針・広報文をつくる。",
    agents: [
      {
        id: "creative",
        name: "Creative_PR_AI",
        role: "クリエイティブ責任者",
        tier: "高推論",
        difyApp: "Creative_PR_AI",
        mission: "コピー、構成設計、デザイン方針、広報文の作成",
        status: "稼働中",
        currentTask: "コーポレートサイトの改稿案を生成中",
        skills: ["原稿執筆", "構成設計", "広報", "SNS運用"],
      },
    ],
  },
  {
    id: "engineering",
    name: "技術・運用部",
    en: "ENGINEERING",
    theme: "#0E9F73",
    soft: "#E7F6F1",
    desc: "実装・技術調査・稼働監視を担当する。",
    agents: [
      {
        id: "engineer",
        name: "Engineer_DevOps_AI",
        role: "技術responsible",
        tier: "高推論",
        difyApp: "Engineer_DevOps_AI",
        mission: "コード実装、技術調査、稼働監視、障害対応",
        status: "稼働中",
        currentTask: "Make シナリオのタイムアウト設定を点検中",
        skills: ["実装", "技術選定", "運用監視", "自動化設計"],
      },
    ],
  },
  {
    id: "qa",
    name: "品質・倫理部",
    en: "QA & ETHICS",
    theme: "#2F6FD0",
    soft: "#E9F1FC",
    desc: "全成果物を検査し、基準を満たさないものを差し戻す。",
    agents: [
      {
        id: "qa",
        name: "QA_Ethics_AI",
        role: "監査責任者",
        tier: "高推論",
        difyApp: "QA_Ethics_AI",
        mission: "成果物の品質検査、表現・法令上のリスク確認、差戻し判断",
        status: "待機中",
        currentTask: "次の検査対象を待機中",
        skills: ["品質検査", "倫理審査", "リスク評価", "差戻し判断"],
      },
    ],
  },
  {
    id: "finance",
    name: "原価・資源部",
    en: "FINANCE",
    theme: "#D08A16",
    soft: "#FBF2E1",
    desc: "工数とコストを算出し、資源配分を管理する。",
    agents: [
      {
        id: "cfo",
        name: "CFO_Resource_AI",
        role: "原価管理責任者",
        tier: "軽量",
        difyApp: "CFO_Resource_AI",
        mission: "工数の試算、コストの算出、資源配分の提案",
        status: "待機中",
        currentTask: "月次のAPIコスト集計を待機中",
        skills: ["工数見積", "原価計算", "資源配分"],
      },
    ],
  },
];

/* デモ用の処理履歴。SHEET_CSV_URL を設定すると実データに置き換わります。 */
const DEMO_TASKS = [
  {
    service: "SOCIAL",
    timestamp: "2026-08-06 22:00",
    run_id: "s-260806",
    client_name: "自社アカウント",
    agent: "Creative_PR_AI",
    status: "完了",
    summary: "翌日分の投稿5本を生成し、予約配信を設定",
  },
  {
    service: "SOCIAL",
    timestamp: "2026-08-06 05:30",
    run_id: "s-260806a",
    client_name: "自社アカウント",
    agent: "CEO_AI",
    status: "完了",
    summary: "業界ニュースを収集し、投稿テーマ12件を抽出",
  },
  {
    service: "STUDIO",
    timestamp: "2026-08-06 22:00",
    run_id: "w-260806",
    client_name: "サンプル商事",
    agent: "Creative_PR_AI",
    status: "完了",
    summary: "SEO記事「業務自動化の始め方」2,800字を納品",
  },
  {
    service: "STUDIO",
    timestamp: "2026-08-06 22:00",
    run_id: "w-260806",
    client_name: "サンプル商事",
    agent: "QA_Ethics_AI",
    status: "完了",
    summary: "表現検査を通過（薬機法・景表法の抵触なし）",
  },
  {
    service: "AGENT",
    timestamp: "2026-08-05 21:00",
    run_id: "32753b2c",
    client_name: "指輪 直人",
    agent: "CEO_AI",
    status: "完了",
    summary: "問い合わせの要件を構造化し、4体へ展開",
  },
  {
    service: "AGENT",
    timestamp: "2026-08-05 21:00",
    run_id: "32753b2c",
    client_name: "指輪 直人",
    agent: "Creative_PR_AI",
    status: "完了",
    summary: "サイト改稿の構成案を出力",
  },
  {
    service: "AGENT",
    timestamp: "2026-08-05 21:00",
    run_id: "32753b2c",
    client_name: "指輪 直人",
    agent: "Engineer_DevOps_AI",
    status: "完了",
    summary: "実装方針とタイムアウト設定を提案",
  },
  {
    service: "AGENT",
    timestamp: "2026-08-05 21:00",
    run_id: "32753b2c",
    client_name: "指輪 直人",
    agent: "QA_Ethics_AI",
    status: "完了",
    summary: "表現リスクなし。通過判定",
  },
  {
    service: "AGENT",
    timestamp: "2026-08-05 21:00",
    run_id: "32753b2c",
    client_name: "指輪 直人",
    agent: "CFO_Resource_AI",
    status: "完了",
    summary: "想定工数 3.5h / 概算 ¥4,200",
  },
  {
    service: "AGENT",
    timestamp: "2026-08-04 14:22",
    run_id: "a91c4de0",
    client_name: "テスト送信",
    agent: "CEO_AI",
    status: "完了",
    summary: "テスト依頼を受領し解析",
  },
];

const SEED_LOG = [
  "SASHIWA CONTROL CONSOLE v1.0",
  "connecting to orchestration layer ...",
  "dify: 5 apps reachable",
  "make: scenario SASHIWA_Core_Routing = ACTIVE",
  "ready.",
];

/* ================================ 部品 ================================== */

function Ico({ name, size = 18 }) {
  const s = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const p = {
    grid: (
      <>
        <rect x="3" y="3" width="7.5" height="7.5" rx="2" {...s} />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" {...s} />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" {...s} />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" {...s} />
      </>
    ),
    bot: (
      <>
        <rect x="4" y="8" width="16" height="12" rx="4" {...s} />
        <path d="M12 4.6V8" {...s} />
        <circle cx="12" cy="3.2" r="1.4" {...s} />
        <circle cx="9.2" cy="13.6" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="14.8" cy="13.6" r="1.1" fill="currentColor" stroke="none" />
      </>
    ),
    send: (
      <>
        <path d="M21.5 2.5 11 13" {...s} />
        <path d="M21.5 2.5 15 21.5l-4-8.5-8.5-4z" {...s} />
      </>
    ),
    loader: (
      <>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.9 2.9M15.5 15.5l2.9 2.9M18.4 5.6l-2.9 2.9M8.5 15.5l-2.9 2.9" {...s} />
      </>
    ),
    pulse: (
      <>
        <path d="M2.5 12h4l2.5-7 4.5 14 2.5-7h5.5" {...s} />
      </>
    ),
    yen: (
      <>
        <path d="m7.5 5.5 4.5 6.5 4.5-6.5M8 13h8M8 16h8M12 12v6.5" {...s} />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" {...s} />
        <path d="M12 7v5.3l3.4 2" {...s} />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" {...s} />
        <path d="m8 12.3 2.8 2.8L16 9.8" {...s} />
      </>
    ),
    back: <path d="M15 5l-7 7 7 7" {...s} />,
    lock: (
      <>
        <rect x="4.5" y="10.5" width="15" height="10" rx="3" {...s} />
        <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" {...s} />
      </>
    ),
    refresh: (
      <>
        <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" {...s} />
        <path d="M20.5 4.5V10H15" {...s} />
      </>
    ),
    out: (
      <>
        <path d="M14.5 3.5h4a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-4" {...s} />
        <path d="M9.5 16 5.5 12l4-4M5.5 12H15" {...s} />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      {p[name] || p.check}
    </svg>
  );
}

/* かんたんCSVパーサ（引用符・改行対応） */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") cur += c;
  }
  if (cur !== "" || row.length) {
    row.push(cur);
    rows.push(row);
  }
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).filter((r) => r.some((v) => v && v.trim())).map((r) => {
    const o = {};
    head.forEach((h, i) => (o[h] = (r[i] || "").trim()));
    return o;
  });
}

/** 「【キー】値」からタグを取り出します */
/** デモ行を詳細表示できる形に変換します */
function toJob(t) {
  return {
    job_id: t.run_id || "-",
    受信日時: t.timestamp,
    種別: t.agent,
    投稿先アカウント: t.client_name,
    持ち主: t.client_name,
    媒体: "-",
    状態: t.status,
    指示内容: `【事業】${t.service || "AGENT"}／【内容】${t.summary}`,
    成果物URL: "",
    完了日時: t.timestamp,
  };
}

function pickTag(text, key) {
  const m = String(text || "").match(new RegExp("【" + key + "】([^／]*)"));
  return m ? m[1].trim() : "";
}

/* ================================ 認証ゲート ============================ */

function Gate({ onPass }) {
  const [v, setV] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => {
    if (v === PASSCODE) onPass();
    else {
      setErr(true);
      setV("");
    }
  };
  return (
    <div className="dbGate">
      <div className="dbGate__c">
        <svg viewBox="0 0 128 152" className="dbGateRing" aria-hidden="true">
          <path d="M64 8 L80 27 L64 46 L48 27 Z" fill="#FFE3DF" stroke="#E0402F" strokeWidth="3.4" strokeLinejoin="round" />
          <circle cx="64" cy="98" r="38" fill="none" stroke="#E0402F" strokeWidth="17" />
          <circle cx="64" cy="98" r="29.5" fill="#FFFFFF" />
          <circle cx="53" cy="94" r="4.2" fill="#1A2233" />
          <circle cx="75" cy="94" r="4.2" fill="#1A2233" />
          <path d="M56 106 q8 8 16 0" stroke="#1A2233" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        </svg>
        <h1>SASHIWA CONTROL</h1>
        <p>社長専用のコントロールダッシュボードです。</p>
        <input
          type="password"
          value={v}
          placeholder="パスコード"
          onChange={(e) => {
            setV(e.target.value);
            setErr(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
        {err && <p className="dbGate__e">パスコードが違います。</p>}
        <button onClick={submit}>入室する</button>
        <a href="#/">← サイトに戻る</a>
      </div>
    </div>
  );
}

/* ================================ 本体 ================================== */

export default function Dashboard() {
  const [authed, setAuthed] = useState(false);

  /* --- マスターデータを State に移管（UIから書き換え可能にするため） --- */
  const [company, setCompany] = useState(DEPARTMENTS);
  const [tasks, setTasks] = useState(DEMO_TASKS);
  const [logs, setLogs] = useState(SEED_LOG);
  const { settings } = useSettings();
  const gasUrl = settings.gasUrl;
  const [live, setLive] = useState(false); // 実データ取得成功フラグ
  const [loadingData, setLoadingData] = useState(false);

  const [view, setView] = useState("org"); // org | studio | accounts | settings | library
  const [libFilter, setLibFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  const [deptId, setDeptId] = useState(null);
  const [agentId, setAgentId] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  const dept = useMemo(() => company.find((d) => d.id === deptId) || null, [company, deptId]);
  const agent = useMemo(
    () => (dept ? dept.agents.find((a) => a.id === agentId) || null : null),
    [dept, agentId]
  );

  const pushLog = useCallback((line) => {
    setLogs((l) => [...l.slice(-120), line]);
  }, []);

  /* --- 実データ取得 --- */
  const loadData = useCallback(async () => {
    if (!gasUrl) return;
    setLoadingData(true);
    try {
      const r = await fetch(`${gasUrl}?action=jobs`);
      const data = await r.json();
      if (!data || !data.ok || !Array.isArray(data.jobs)) throw new Error("形式が違います");
      const rows = data.jobs.map((j) => ({
        service: pickTag(j.指示内容, "事業") || "AGENT",
        timestamp: j.受信日時,
        run_id: j.job_id,
        client_name: j.持ち主,
        agent: j.種別,
        status: j.状態,
        summary: jobTitle(j),
        raw: j,
      }));
      setTasks(rows);
      setLive(true);
      pushLog(`[${new Date().toLocaleTimeString()}] DATA SYNCED: ${rows.length} records`);
    } catch (e) {
      setLive(false);
      pushLog(`[${new Date().toLocaleTimeString()}] SYNC FAILED — デモデータを表示中`);
    } finally {
      setLoadingData(false);
    }
  }, [gasUrl, pushLog]);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData]);

  useEffect(() => {
    if (typeof document !== "undefined") document.title = "CONTROL｜株式会社SASHIWA";
  }, []);

  /* --- 指示アサイン --- */
  const assign = useCallback(
    async (targetDept, targetAgent, text, priority) => {
      const started = Date.now();
      const payload = {
        client_name: "社長（コントロールダッシュボード）",
        client_email: "control@sashiwa.local",
        message: `【指示先】${targetAgent.name}／【優先度】${priority}／【内容】${text}`,
      };

      let ok = true;
      if (LIVE_COMMAND) {
        try {
          const r = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          ok = r.ok;
        } catch (e) {
          ok = false;
        }
      }

      // 最低1.2秒はローディングを見せる
      const wait = Math.max(0, 1200 - (Date.now() - started));
      await new Promise((res) => setTimeout(res, wait));

      // AI社員のタスクとステータスを書き換え
      setCompany((prev) =>
        prev.map((d) =>
          d.id !== targetDept.id
            ? d
            : {
                ...d,
                agents: d.agents.map((a) =>
                  a.id !== targetAgent.id
                    ? a
                    : { ...a, currentTask: text, status: priority === "High" ? "高負荷" : "稼働中" }
                ),
              }
        )
      );

      const t = new Date().toLocaleTimeString();
      pushLog(`[${t}] COMMAND DEPLOYED: "${text}" (PRIORITY: ${priority})`);
      pushLog(
        ok
          ? `[${t}] → ${targetAgent.name} acknowledged. routing via Make ...`
          : `[${t}] ! webhook unreachable — ローカル反映のみ`
      );

      setTasks((prev) => [
        {
          service: "AGENT",
          timestamp: new Date().toLocaleString("ja-JP", { hour12: false }).slice(0, 16),
          run_id: "manual",
          client_name: "社長",
          agent: targetAgent.name,
          status: ok ? "送信済" : "失敗",
          summary: text.length > 40 ? text.slice(0, 40) + "…" : text,
        },
        ...prev,
      ]);

      return ok;
    },
    [pushLog]
  );

  /* --- KPI --- */
  const kpi = useMemo(() => {
    const all = company.flatMap((d) => d.agents);
    return {
      agents: all.length,
      active: all.filter((a) => a.status !== "待機中").length,
      high: all.filter((a) => a.status === "高負荷").length,
      tasks: tasks.length,
      done: tasks.filter((t) => (t.status || "").includes("完了")).length,
    };
  }, [company, tasks]);

  if (!authed) return (
    <div className="dbRoot">
      <style>{CSS_DASHBOARD}</style>
      <Gate onPass={() => setAuthed(true)} />
    </div>
  );

  const goDept = (id) => {
    setView("org");
    setDeptId(id);
    setAgentId(null);
    setNavOpen(false);
  };
  const goAgent = (dId, aId) => {
    setView("org");
    setDeptId(dId);
    setAgentId(aId);
    setNavOpen(false);
  };

  return (
    <div className="dbRoot">
      <style>{CSS_DASHBOARD}</style>

      <div className="dbShell">
        {/* ---------------- サイドバー ---------------- */}
        <aside className={`dbSide ${navOpen ? "is-open" : ""}`}>
          <div className="dbSide__hd">
            <a className="dbBrand" href="#/">
              <span className="dbBrand__m">
                <svg viewBox="0 0 24 24" width="17" height="17">
                  <path d="M5 18 12 6l7 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                  <circle cx="12" cy="5.4" r="2.3" fill="currentColor" />
                </svg>
              </span>
              <span>
                SASHIWA<em>CONTROL</em>
              </span>
            </a>
          </div>

          <nav className="dbSide__nav">
            <button
              className={`dbNavAll ${view === "org" && !deptId ? "is-cur" : ""}`}
              onClick={() => {
                setView("org");
                goDept(null);
              }}
            >
              <Ico name="grid" size={17} />
              全社ダッシュボード
            </button>
            <button
              className={`dbNavAll dbNavStudio ${view === "accounts" ? "is-cur" : ""}`}
              onClick={() => { setView("accounts"); setNavOpen(false); }}
            >
              <Ico name="bot" size={16} />
              アカウント管理
            </button>
            <button
              className={`dbNavAll ${view === "library" ? "is-cur" : ""}`}
              onClick={() => { setView("library"); setLibFilter("all"); setNavOpen(false); }}
            >
              <Ico name="check" size={16} />
              成果物ライブラリ
            </button>
            <button
              className={`dbNavAll ${view === "settings" ? "is-cur" : ""}`}
              onClick={() => { setView("settings"); setNavOpen(false); }}
            >
              <Ico name="refresh" size={16} />
              接続設定
            </button>
            <button
              className={`dbNavAll dbNavStudio ${view === "studio" ? "is-cur" : ""}`}
              onClick={() => {
                setView("studio");
                setNavOpen(false);
              }}
            >
              <Ico name="send" size={16} />
              制作スタジオ
              <em>NEW</em>
            </button>

            <p className="dbSide__k">部署 / DEPARTMENTS</p>
            {company.map((d) => (
              <div key={d.id} className="dbNavGroup">
                <button
                  className={`dbNavD ${deptId === d.id && !agentId ? "is-cur" : ""}`}
                  onClick={() => goDept(d.id)}
                  style={{ "--t": d.theme }}
                >
                  <span className="dbNavD__dot" />
                  <span className="dbNavD__n">{d.name}</span>
                  <span className="dbNavD__c">{d.agents.length}</span>
                </button>
                {deptId === d.id &&
                  d.agents.map((a) => (
                    <button
                      key={a.id}
                      className={`dbNavA ${agentId === a.id ? "is-cur" : ""}`}
                      onClick={() => goAgent(d.id, a.id)}
                      style={{ "--t": d.theme }}
                    >
                      <span className={`dbSt dbSt--${a.status}`} />
                      {a.name}
                    </button>
                  ))}
              </div>
            ))}
          </nav>

          <div className="dbSide__ft">
            <div className={`dbSync ${live ? "is-live" : ""}`}>
              <span className="dbSync__d" />
              {live ? "実データ連携中" : "デモデータ表示中"}
            </div>
            <div className="dbSide__links">
              <a href="#/" className="dbSide__site">
                <Ico name="grid" size={14} />
                公開サイトを見る
              </a>
              <button className="dbSide__out" onClick={() => setAuthed(false)}>
                <Ico name="out" size={15} />
                退室
              </button>
            </div>
          </div>
        </aside>

        <div className="dbMain">
          {/* ---------------- トップバー ---------------- */}
          <div className="dbTop">
            <button className="dbBurger" onClick={() => setNavOpen((v) => !v)} aria-label="メニュー">
              <span />
              <span />
              <span />
            </button>
            <div className="dbTop__bc">
              {view === "studio" ? (
                <span>制作スタジオ</span>
              ) : view === "accounts" ? (
                <span>アカウント管理</span>
              ) : view === "settings" ? (
                <span>接続設定</span>
              ) : view === "library" ? (
                <span>成果物ライブラリ</span>
              ) : (
                <button onClick={() => goDept(null)}>全社</button>
              )}
              {view === "org" && dept && (
                <>
                  <em>/</em>
                  <button onClick={() => goDept(dept.id)}>{dept.name}</button>
                </>
              )}
              {view === "org" && agent && (
                <>
                  <em>/</em>
                  <span>{agent.name}</span>
                </>
              )}
            </div>
            <button className="dbTop__rf" onClick={loadData} disabled={loadingData || !SHEET_CSV_URL}>
              <span className={loadingData ? "dbSpin" : ""}>
                <Ico name="refresh" size={15} />
              </span>
              {SHEET_CSV_URL ? "再取得" : "デモ"}
            </button>
          </div>

          <div className="dbBody">
            {view === "accounts" && <AccountsView pushLog={pushLog} />}
            {view === "settings" && <SettingsView pushLog={pushLog} />}
            {view === "library" && <LibraryView pushLog={pushLog} initialFilter={libFilter} />}
            {view === "studio" && <Studio pushLog={pushLog} />}
            {view === "org" && !dept && (
              <ViewAll
                company={company}
                kpi={kpi}
                tasks={tasks}
                logs={logs}
                goDept={goDept}
                goAgent={goAgent}
                openLibrary={(f) => { setLibFilter(f); setView("library"); }}
                onSelect={setDetail}
              />
            )}
            {view === "org" && dept && !agent && <ViewDept dept={dept} tasks={tasks} goAgent={goAgent} onSelect={setDetail} />}
            {view === "org" && dept && agent && (
              <ViewAgent dept={dept} agent={agent} tasks={tasks} logs={logs} assign={assign} onSelect={setDetail} />
            )}
          </div>
        </div>
      </div>

      {detail && <JobDetail job={detail.raw || toJob(detail)} onClose={() => setDetail(null)} />}
      {navOpen && <div className="dbScrim" onClick={() => setNavOpen(false)} />}
    </div>
  );
}

/* ============================ View A：全社 ============================== */

function ViewAll({ company, kpi, tasks, logs, goDept, goAgent, openLibrary, onSelect }) {
  return (
    <>
      <header className="dbHead">
        <p className="dbHead__en">EXECUTIVE OVERVIEW</p>
        <h1>全社ダッシュボード</h1>
        <p className="dbHead__s">5部署 / {kpi.agents}体のAI社員が稼働しています。</p>
      </header>

      <div className="dbKpis">
        <Kpi icon="bot" label="稼働中のAI社員" value={kpi.active} unit={`/ ${kpi.agents}体`} />
        <Kpi icon="pulse" label="処理レコード" value={kpi.tasks} unit="件" />
        <Kpi icon="check" label="完了" value={kpi.done} unit="件" />
        <Kpi icon="clock" label="高負荷" value={kpi.high} unit="体" tone={kpi.high ? "warn" : ""} />
      </div>

      <section className="dbSec">
        <h2 className="dbSecT">事業別の稼働</h2>
        <div className="dbSvcs">
          {SERVICES.map((sv) => {
            const rows = tasks.filter((t) => (t.service || "AGENT") === sv.code);
            const done = rows.filter((t) => (t.status || "").includes("完了")).length;
            return (
              <article
                key={sv.code}
                className="dbSvc is-click"
                style={{ "--t": sv.theme, "--s": sv.soft }}
                onClick={() => openLibrary && openLibrary(sv.code)}
              >
                <div className="dbSvc__hd">
                  <span className="dbSvc__dot" />
                  <p className="dbSvc__n">{sv.name}</p>
                  <span className="dbMono dbSvc__c">{sv.code}</span>
                </div>
                <p className="dbMono dbSvc__v">
                  {rows.length}
                  <span>件</span>
                </p>
                <p className="dbSvc__l">うち完了 {done} 件</p>
                <div className="dbSvc__bar">
                  <span style={{ width: rows.length ? `${(done / rows.length) * 100}%` : "0%" }} />
                </div>
                <p className="dbSvc__more">成果物を見る →</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="dbSec">
        <h2 className="dbSecT">部署の稼働状況</h2>
        <div className="dbDepts">
          {company.map((d) => (
            <article key={d.id} className="dbDept" style={{ "--t": d.theme, "--s": d.soft }} onClick={() => goDept(d.id)}>
              <div className="dbDept__hd">
                <span className="dbDept__ic">
                  <Ico name="bot" size={20} />
                </span>
                <div>
                  <p className="dbDept__n">{d.name}</p>
                  <p className="dbDept__en">{d.en}</p>
                </div>
              </div>
              <p className="dbDept__d">{d.desc}</p>
              <div className="dbDept__ags">
                {d.agents.map((a) => (
                  <button
                    key={a.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      goAgent(d.id, a.id);
                    }}
                  >
                    <span className={`dbSt dbSt--${a.status}`} />
                    {a.name}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="dbSplit">
        <section className="dbSec">
          <h2 className="dbSecT">直近の処理履歴</h2>
          <TaskTable tasks={tasks.slice(0, 8)} onSelect={onSelect} />
        </section>
        <section className="dbSec">
          <h2 className="dbSecT">システムログ</h2>
          <ConsoleLog logs={logs} />
        </section>
      </div>
    </>
  );
}

function Kpi({ icon, label, value, unit, tone }) {
  return (
    <div className={`dbKpi ${tone ? "is-" + tone : ""}`}>
      <span className="dbKpi__ic">
        <Ico name={icon} size={18} />
      </span>
      <p className="dbKpi__l">{label}</p>
      <p className="dbKpi__v">
        {value}
        <span>{unit}</span>
      </p>
    </div>
  );
}

/* ============================ View B：部署 ============================== */

function ViewDept({ dept, tasks, goAgent, onSelect }) {
  const rel = tasks.filter((t) => dept.agents.some((a) => a.name === t.agent));
  return (
    <div style={{ "--t": dept.theme, "--s": dept.soft }}>
      <header className="dbHead">
        <p className="dbHead__en" style={{ color: dept.theme }}>
          {dept.en}
        </p>
        <h1>{dept.name}</h1>
        <p className="dbHead__s">{dept.desc}</p>
      </header>

      <section className="dbSec">
        <h2 className="dbSecT">所属するAI社員</h2>
        <div className="dbAgs">
          {dept.agents.map((a) => (
            <article key={a.id} className="dbAg" onClick={() => goAgent(dept.id, a.id)}>
              <div className="dbAg__hd">
                <span className="dbAg__av">
                  <Ico name="bot" size={22} />
                </span>
                <div>
                  <p className="dbAg__n">{a.name}</p>
                  <p className="dbAg__r">{a.role}</p>
                </div>
                <span className={`dbBadge dbBadge--${a.status}`}>{a.status}</span>
              </div>
              <p className="dbAg__k">現在のタスク</p>
              <p className="dbAg__t">{a.currentTask}</p>
              <div className="dbAg__sk">
                {a.skills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dbSec">
        <h2 className="dbSecT">この部署の処理履歴</h2>
        {rel.length ? <TaskTable tasks={rel.slice(0, 10)} onSelect={onSelect} /> : <p className="dbEmpty">まだ記録がありません。</p>}
      </section>
    </div>
  );
}

/* ============================ View C：個別 ============================== */

function ViewAgent({ dept, agent, tasks, logs, assign, onSelect }) {
  const rel = tasks.filter((t) => t.agent === agent.name);
  return (
    <div style={{ "--t": dept.theme, "--s": dept.soft }}>
      <header className="dbHead">
        <p className="dbHead__en" style={{ color: dept.theme }}>
          {dept.name} / {agent.tier}
        </p>
        <h1>{agent.name}</h1>
        <p className="dbHead__s">{agent.mission}</p>
      </header>

      <div className="dbProfile">
        <div className="dbProfile__l">
          <span className="dbProfile__av">
            <Ico name="bot" size={30} />
          </span>
          <div>
            <p className="dbProfile__r">{agent.role}</p>
            <span className={`dbBadge dbBadge--${agent.status}`}>{agent.status}</span>
          </div>
        </div>
        <dl className="dbProfile__m">
          <div>
            <dt>Difyアプリ</dt>
            <dd className="dbMono">{agent.difyApp}</dd>
          </div>
          <div>
            <dt>推論クラス</dt>
            <dd>{agent.tier}</dd>
          </div>
          <div>
            <dt>処理件数</dt>
            <dd>{rel.length} 件</dd>
          </div>
        </dl>
      </div>

      <section className="dbSec">
        <h2 className="dbSecT">現在のタスク</h2>
        <div className="dbCurrent">
          <span className="dbCurrent__d" />
          {agent.currentTask}
        </div>
      </section>

      <div className="dbSplit dbSplit--console">
        <AssignConsole dept={dept} agent={agent} assign={assign} />
        <section className="dbSec">
          <h2 className="dbSecT">Live Console Log</h2>
          <ConsoleLog logs={logs} tall />
        </section>
      </div>

      <section className="dbSec">
        <h2 className="dbSecT">このAI社員の処理履歴</h2>
        {rel.length ? <TaskTable tasks={rel.slice(0, 10)} onSelect={onSelect} /> : <p className="dbEmpty">まだ記録がありません。</p>}
      </section>
    </div>
  );
}

/* ---------------------- タスクアサイン・コンソール ---------------------- */

function AssignConsole({ dept, agent, assign }) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState("");

  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setFlash("");
    const ok = await assign(dept, agent, text.trim(), priority);
    setSending(false);
    setText("");
    setFlash(ok ? "アサインしました。" : "送信に失敗しました（画面上のみ反映）。");
    setTimeout(() => setFlash(""), 4000);
  };

  return (
    <section className="dbAssign">
      <h2 className="dbSecT">タスクをアサイン</h2>
      <div className="dbAssign__c">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="AI社員への新たなプロンプト、または実行命令を入力..."
          rows={5}
          disabled={sending}
        />

        <div className="dbAssign__row">
          <span className="dbAssign__k">優先度</span>
          <div className="dbSeg">
            {["Low", "Medium", "High"].map((p) => (
              <button
                key={p}
                className={priority === p ? "is-on" : ""}
                onClick={() => setPriority(p)}
                disabled={sending}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="dbAssign__ft">
          <p className="dbAssign__n">
            送信すると {agent.name} の現在タスクを書き換え、Make 経由で実行を依頼します。
          </p>
          <button className="dbSend" onClick={submit} disabled={sending || !text.trim()}>
            <span className={sending ? "dbSpin" : ""}>
              <Ico name={sending ? "loader" : "send"} size={16} />
            </span>
            {sending ? "アサイン中..." : "アサインする"}
          </button>
        </div>

        {flash && <p className="dbFlash">{flash}</p>}
      </div>
    </section>
  );
}

/* ---------------------------- 共通パーツ ------------------------------- */

function TaskTable({ tasks, onSelect }) {
  return (
    <div className="dbTable">
      <div className="dbTable__h">
        <span>日時</span>
        <span>事業</span>
        <span>担当</span>
        <span>内容</span>
        <span>状態</span>
      </div>
      {tasks.map((t, i) => (
        <div
          className={`dbTable__r ${onSelect ? "is-click" : ""}`}
          key={`${t.run_id}-${t.agent}-${i}`}
          onClick={() => onSelect && onSelect(t)}
          role={onSelect ? "button" : undefined}
          tabIndex={onSelect ? 0 : undefined}
          onKeyDown={(e) => { if (onSelect && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelect(t); } }}
        >
          <span className="dbMono dbTable__t">{t.timestamp}</span>
          <span>
            <em
              className="dbSvcTag"
              style={{
                "--t":
                  (SERVICES.find((v) => v.code === (t.service || "AGENT")) || SERVICES[0]).theme,
                "--s":
                  (SERVICES.find((v) => v.code === (t.service || "AGENT")) || SERVICES[0]).soft,
              }}
            >
              {t.service || "AGENT"}
            </em>
          </span>
          <span className="dbTable__a">{t.agent}</span>
          <span className="dbTable__s">{t.summary}</span>
          <span>
            <em className={`dbTag dbTag--${(t.status || "").includes("失敗") || (t.status || "").includes("エラー") ? "ng" : "ok"}`}>{t.status}</em>
            {onSelect && <em className="dbTable__go">›</em>}
          </span>
        </div>
      ))}
    </div>
  );
}

function ConsoleLog({ logs, tall }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);
  return (
    <div className={`dbCon ${tall ? "is-tall" : ""}`} ref={ref}>
      {logs.map((l, i) => (
        <p key={i} className={l.includes("COMMAND DEPLOYED") ? "is-cmd" : l.startsWith("[") && l.includes("!") ? "is-err" : ""}>
          <span className="dbCon__p">›</span>
          {l}
        </p>
      ))}
      <p className="dbCon__cur">
        <span className="dbCon__p">›</span>
        <span className="dbCaret" />
      </p>
    </div>
  );
}

/* ================================ CSS_DASHBOARD ================================== */

const CSS_DASHBOARD = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700;900&display=swap');

.dbRoot{
  --bg:#F4F6F9; --white:#fff; --ink:#1A2233; --muted:#616B7D; --line:#E2E6EC;
  --sig:#E0402F; --t:#E0402F; --s:#FDECEA;
  --sans:'Noto Sans JP',"Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;
  --mono:'JetBrains Mono',ui-monospace,Menlo,monospace;
  background:var(--bg);color:var(--ink);font-family:var(--sans);
  font-size:15px;line-height:1.8;min-height:100vh;-webkit-font-smoothing:antialiased;
}
.dbRoot *,.dbRoot *::before,.dbRoot *::after{box-sizing:border-box;}
.dbRoot h1,.dbRoot h2,.dbRoot p,.dbRoot dl,.dbRoot dd,.dbRoot dt{margin:0;padding:0;}
.dbRoot a{color:inherit;text-decoration:none;}
.dbRoot button{font:inherit;color:inherit;background:none;border:none;cursor:pointer;text-align:left;}
.dbRoot :focus-visible{outline:2px solid var(--t);outline-offset:2px;}
.dbMono{font-family:var(--mono);font-feature-settings:"tnum";}
.dbSpin{display:inline-flex;animation:dbSpin 1s linear infinite;}
@keyframes dbSpin{to{transform:rotate(360deg);}}

/* gate */
.dbGate{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
  background:radial-gradient(60% 50% at 50% 0%,rgba(224,64,47,.12),transparent 70%),var(--bg);}
.dbGate__c{background:var(--white);border:1px solid var(--line);border-radius:22px;padding:44px 36px;width:100%;max-width:400px;text-align:center;box-shadow:0 30px 60px -40px rgba(26,34,51,.5);}
.dbGateRing{width:104px;height:auto;display:block;margin:0 auto 14px;animation:dbFloat 4.6s ease-in-out infinite;}
@keyframes dbFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
.dbGate__ic{display:inline-flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:19px;background:var(--s);color:var(--sig);margin-bottom:18px;}
.dbGate__c h1{font-size:19px;font-weight:900;letter-spacing:.1em;margin-bottom:8px;}
.dbGate__c > p{font-size:13px;color:var(--muted);margin-bottom:24px;}
.dbGate__c input{width:100%;background:var(--bg);border:1.5px solid transparent;border-radius:12px;padding:14px 16px;font:inherit;font-family:var(--mono);text-align:center;letter-spacing:.15em;transition:border-color .2s,background .2s;}
.dbGate__c input:focus{outline:none;border-color:var(--sig);background:var(--white);}
.dbGate__e{font-size:12.5px;color:var(--sig);margin-top:10px !important;}
.dbGate__c button{display:block;width:100%;margin-top:16px;background:var(--sig);color:#fff;font-weight:700;font-size:14px;padding:14px;border-radius:999px;text-align:center;transition:background .2s;}
.dbGate__c button:hover{background:#C4342A;}
.dbGate__c a{display:inline-block;margin-top:18px;font-size:12.5px;color:var(--muted);}

/* shell */
.dbShell{display:grid;grid-template-columns:264px 1fr;min-height:100vh;}
.dbSide{background:#0E1626;color:#96A1B2;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;}
.dbSide__hd{padding:22px 20px 14px;border-bottom:1px solid #1E2739;}
.dbBrand{display:flex;align-items:center;gap:9px;font-weight:900;color:#fff;font-size:14px;letter-spacing:.1em;}
.dbBrand__m{color:var(--sig);display:flex;}
.dbBrand em{display:block;font-family:var(--mono);font-style:normal;font-weight:400;font-size:9px;color:#6F7B8B;letter-spacing:.2em;}
.dbSide__nav{flex:1;overflow-y:auto;padding:14px 12px;}
.dbNavAll{display:flex;align-items:center;gap:10px;width:100%;padding:11px 14px;border-radius:11px;font-size:13.5px;font-weight:500;color:#B6C0CE;transition:background .2s,color .2s;}
.dbNavAll:hover{background:#182133;color:#fff;}
.dbNavAll.is-cur{background:#1D283C;color:#fff;}
.dbNavStudio{margin-top:6px;}
.dbNavStudio em{font-style:normal;font-family:var(--mono);font-size:8.5px;letter-spacing:.12em;color:#fff;background:var(--sig);border-radius:999px;padding:2px 7px;margin-left:auto;}
.dbSide__k{font-family:var(--mono);font-size:9px;letter-spacing:.2em;color:#5D6779;padding:20px 14px 8px;}
.dbNavGroup{margin-bottom:2px;}
.dbNavD{display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;border-radius:11px;font-size:13.5px;transition:background .2s,color .2s;}
.dbNavD:hover{background:#182133;color:#fff;}
.dbNavD.is-cur{background:#1D283C;color:#fff;}
.dbNavD__dot{width:7px;height:7px;border-radius:50%;background:var(--t);flex-shrink:0;}
.dbNavD__n{flex:1;}
.dbNavD__c{font-family:var(--mono);font-size:10px;color:#5D6779;}
.dbNavA{display:flex;align-items:center;gap:9px;width:100%;padding:8px 14px 8px 32px;border-radius:10px;font-family:var(--mono);font-size:11px;color:#7C8797;transition:background .2s,color .2s;}
.dbNavA:hover{background:#182133;color:#fff;}
.dbNavA.is-cur{color:var(--t);background:#182133;}
.dbSt{width:6px;height:6px;border-radius:50%;flex-shrink:0;background:#4C5768;}
.dbSt--稼働中{background:#3CCB8E;box-shadow:0 0 0 3px rgba(60,203,142,.18);}
.dbSt--高負荷{background:#E0402F;box-shadow:0 0 0 3px rgba(224,64,47,.2);animation:dbBlink 1.6s ease-in-out infinite;}
.dbSt--待機中{background:#6E7A8C;}
@keyframes dbBlink{50%{opacity:.35;}}
.dbSide__ft{padding:14px;border-top:1px solid #1E2739;display:flex;flex-direction:column;gap:10px;}
.dbSync{display:flex;align-items:center;gap:8px;font-size:11px;color:#7C8797;}
.dbSync__d{width:6px;height:6px;border-radius:50%;background:#6E7A8C;}
.dbSync.is-live .dbSync__d{background:#3CCB8E;box-shadow:0 0 0 3px rgba(60,203,142,.18);}
.dbSide__links{display:flex;flex-direction:column;gap:4px;}
.dbSide__site{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#7C8797;padding:8px 6px;border-radius:9px;transition:color .2s;}
.dbSide__site:hover{color:#fff;}
.dbSide__out{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#7C8797;padding:8px 6px;border-radius:9px;transition:color .2s;}
.dbSide__out:hover{color:#fff;}

/* main */
.dbMain{min-width:0;}
.dbTop{position:sticky;top:0;z-index:20;background:rgba(244,246,249,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);height:62px;display:flex;align-items:center;gap:14px;padding:0 28px;}
.dbTop__bc{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--muted);flex:1;min-width:0;}
.dbTop__bc button:hover{color:var(--ink);}
.dbTop__bc span{color:var(--ink);font-weight:700;}
.dbTop__bc em{font-style:normal;color:#B9C0CB;}
.dbTop__rf{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--muted);border:1px solid var(--line);background:var(--white);border-radius:999px;padding:8px 15px;transition:border-color .2s;}
.dbTop__rf:hover:not(:disabled){border-color:var(--ink);}
.dbTop__rf:disabled{opacity:.55;cursor:default;}
.dbBurger{display:none;flex-direction:column;gap:4px;width:22px;}
.dbBurger span{height:2px;background:var(--ink);border-radius:2px;}
.dbBody{padding:32px 28px 64px;}
.dbScrim{display:none;}
@media (max-width:1000px){
  .dbShell{grid-template-columns:1fr;}
  .dbSide{position:fixed;left:0;top:0;bottom:0;width:264px;z-index:60;transform:translateX(-100%);transition:transform .3s cubic-bezier(.22,1,.36,1);}
  .dbSide.is-open{transform:none;}
  .dbBurger{display:flex;}
  .dbBody{padding:24px 18px 56px;}
  .dbTop{padding:0 18px;}
  .dbScrim{display:block;position:fixed;inset:0;background:rgba(10,14,22,.45);z-index:50;}
}

/* head */
.dbHead{margin-bottom:28px;}
.dbHead__en{font-family:var(--mono);font-size:10px;letter-spacing:.2em;color:var(--sig);font-weight:700;margin-bottom:8px;}
.dbHead h1{font-size:clamp(23px,3vw,31px);font-weight:900;line-height:1.35;}
.dbHead__s{font-size:13.5px;color:var(--muted);margin-top:8px;}

/* kpi */
.dbKpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:34px;}
.dbKpi{background:var(--white);border:1px solid var(--line);border-radius:18px;padding:22px 22px 20px;}
.dbKpi__ic{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:12px;background:var(--bg);color:var(--muted);margin-bottom:14px;}
.dbKpi.is-warn .dbKpi__ic{background:var(--s);color:var(--sig);}
.dbKpi__l{font-size:12px;color:var(--muted);margin-bottom:4px;}
.dbKpi__v{font-family:var(--mono);font-size:30px;font-weight:500;line-height:1.2;}
.dbKpi__v span{font-family:var(--sans);font-size:12px;color:var(--muted);margin-left:6px;font-weight:400;}
@media (max-width:820px){.dbKpis{grid-template-columns:repeat(2,1fr);}}

/* sections */
.dbSec{margin-bottom:32px;min-width:0;}
.dbSecT{font-size:14px;font-weight:700;margin-bottom:14px;}
.dbSplit{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;}
.dbSplit--console{grid-template-columns:1fr 1fr;}
@media (max-width:1100px){.dbSplit{grid-template-columns:1fr;}}
.dbEmpty{background:var(--white);border:1px dashed var(--line);border-radius:16px;padding:26px;font-size:13px;color:var(--muted);text-align:center;}

/* dept cards */
.dbDepts{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.dbDept{background:var(--white);border:1px solid var(--line);border-radius:18px;padding:22px;cursor:pointer;transition:transform .25s,box-shadow .25s,border-color .25s;}
.dbDept:hover{transform:translateY(-3px);box-shadow:0 24px 44px -32px rgba(26,34,51,.5);border-color:var(--t);}
.dbDept__hd{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
.dbDept__ic{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:13px;background:var(--s);color:var(--t);}
.dbDept__n{font-size:15px;font-weight:700;line-height:1.4;}
.dbDept__en{font-family:var(--mono);font-size:9px;letter-spacing:.16em;color:var(--muted);}
.dbDept__d{font-size:12.5px;line-height:1.85;color:var(--muted);margin-bottom:14px;}
.dbDept__ags{display:flex;flex-wrap:wrap;gap:6px;}
.dbDept__ags button{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10.5px;color:var(--muted);background:var(--bg);border-radius:999px;padding:5px 11px;transition:background .2s,color .2s;}
.dbDept__ags button:hover{background:var(--s);color:var(--t);}
@media (max-width:1100px){.dbDepts{grid-template-columns:repeat(2,1fr);}}
@media (max-width:640px){.dbDepts{grid-template-columns:1fr;}}

/* agent cards */
.dbAgs{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
.dbAg{background:var(--white);border:1px solid var(--line);border-radius:18px;padding:22px;cursor:pointer;transition:transform .25s,box-shadow .25s,border-color .25s;}
.dbAg:hover{transform:translateY(-3px);box-shadow:0 24px 44px -32px rgba(26,34,51,.5);border-color:var(--t);}
.dbAg__hd{display:flex;align-items:center;gap:12px;margin-bottom:16px;}
.dbAg__av{display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:14px;background:var(--s);color:var(--t);}
.dbAg__n{font-family:var(--mono);font-size:13px;font-weight:700;}
.dbAg__r{font-size:12px;color:var(--muted);}
.dbAg__hd > span:last-child{margin-left:auto;}
.dbAg__k{font-family:var(--mono);font-size:9px;letter-spacing:.16em;color:var(--muted);margin-bottom:5px;}
.dbAg__t{font-size:13px;line-height:1.85;margin-bottom:14px;}
.dbAg__sk{display:flex;flex-wrap:wrap;gap:6px;}
.dbAg__sk span{font-size:11px;color:var(--muted);background:var(--bg);border-radius:999px;padding:4px 11px;}
@media (max-width:820px){.dbAgs{grid-template-columns:1fr;}}

.dbBadge{font-size:11px;font-weight:700;border-radius:999px;padding:4px 12px;white-space:nowrap;}
.dbBadge--稼働中{background:#E6F7F0;color:#0E9F73;}
.dbBadge--高負荷{background:#FDECEA;color:#E0402F;}
.dbBadge--待機中{background:#EEF0F4;color:#616B7D;}

/* profile */
.dbProfile{background:var(--white);border:1px solid var(--line);border-radius:18px;padding:24px;display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:30px;}
.dbProfile__l{display:flex;align-items:center;gap:16px;}
.dbProfile__av{display:inline-flex;align-items:center;justify-content:center;width:62px;height:62px;border-radius:19px;background:var(--s);color:var(--t);}
.dbProfile__r{font-size:15px;font-weight:700;margin-bottom:6px;}
.dbProfile__m{display:flex;gap:34px;flex-wrap:wrap;}
.dbProfile__m dt{font-family:var(--mono);font-size:9px;letter-spacing:.16em;color:var(--muted);margin-bottom:4px;}
.dbProfile__m dd{font-size:13.5px;font-weight:500;}

.dbCurrent{display:flex;align-items:flex-start;gap:12px;background:var(--white);border:1px solid var(--line);border-left:3px solid var(--t);border-radius:14px;padding:18px 22px;font-size:14px;line-height:1.85;}
.dbCurrent__d{width:8px;height:8px;border-radius:50%;background:var(--t);margin-top:9px;flex-shrink:0;animation:dbBlink 2s ease-in-out infinite;}

/* assign console */
.dbAssign{min-width:0;}
.dbAssign__c{background:var(--white);border:1px solid var(--line);border-radius:22px;padding:22px;box-shadow:0 1px 2px rgba(26,34,51,.04);}
.dbAssign__c textarea{width:100%;background:var(--bg);border:1.5px solid transparent;border-radius:14px;padding:15px 16px;font-family:var(--sans);font-size:14px;line-height:1.85;color:var(--ink);resize:vertical;transition:border-color .2s,box-shadow .2s,background .2s;}
.dbAssign__c textarea::placeholder{color:#9BA3B1;}
.dbAssign__c textarea:focus{outline:none;background:var(--white);border-color:var(--t);box-shadow:0 0 0 4px var(--s);}
.dbAssign__row{display:flex;align-items:center;gap:14px;margin-top:16px;flex-wrap:wrap;}
.dbAssign__k{font-family:var(--mono);font-size:10px;letter-spacing:.16em;color:var(--muted);}
.dbSeg{display:flex;gap:6px;}
.dbSeg button{font-family:var(--mono);font-size:11.5px;font-weight:500;border:1px solid var(--line);border-radius:999px;padding:6px 16px;color:var(--muted);transition:background .2s,color .2s,border-color .2s;}
.dbSeg button:hover:not(.is-on){border-color:var(--t);color:var(--t);}
.dbSeg button.is-on{background:var(--t);border-color:var(--t);color:#fff;}
.dbAssign__ft{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:18px;padding-top:16px;border-top:1px solid var(--line);flex-wrap:wrap;}
.dbAssign__n{font-size:11.5px;line-height:1.8;color:var(--muted);max-width:24em;}
.dbSend{display:inline-flex;align-items:center;gap:9px;background:var(--t);color:#fff;font-size:13.5px;font-weight:700;border-radius:999px;padding:12px 24px;transition:opacity .2s,transform .2s,filter .2s;}
.dbSend:hover:not(:disabled){filter:brightness(.92);transform:translateY(-1px);}
.dbSend:disabled{opacity:.45;cursor:not-allowed;transform:none;}
.dbFlash{margin-top:14px;font-size:12.5px;color:var(--t);background:var(--s);border-radius:10px;padding:10px 14px;}

/* console */
.dbCon{background:#0B121D;border:1px solid #1B2536;border-radius:18px;padding:18px 20px;font-family:var(--mono);font-size:11.5px;line-height:1.95;color:#7EE6B5;max-height:280px;overflow-y:auto;}
.dbCon.is-tall{max-height:342px;}
.dbCon p{display:flex;gap:8px;word-break:break-word;}
.dbCon__p{color:#3C5468;flex-shrink:0;}
.dbCon p.is-cmd{color:#FFD48A;}
.dbCon p.is-err{color:#FF8B7E;}
.dbCaret{display:inline-block;width:7px;height:14px;background:#7EE6B5;animation:dbBlink 1.1s steps(2) infinite;}
.dbCon::-webkit-scrollbar{width:6px;}
.dbCon::-webkit-scrollbar-thumb{background:#243247;border-radius:6px;}

/* table */
.dbTable{background:var(--white);border:1px solid var(--line);border-radius:18px;overflow:hidden;}
.dbTable__h,.dbTable__r{display:grid;grid-template-columns:112px 74px 148px 1fr 78px;gap:14px;padding:12px 20px;align-items:center;}
.dbTable__h{font-size:10.5px;letter-spacing:.1em;color:var(--muted);background:var(--bg);}
.dbTable__r{border-top:1px solid var(--line);font-size:12.5px;}
.dbTable__t{font-size:10.5px;color:var(--muted);}
.dbTable__a{font-family:var(--mono);font-size:11px;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dbTable__s{color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dbTag{font-style:normal;font-size:10.5px;font-weight:700;border-radius:999px;padding:3px 10px;white-space:nowrap;}
.dbTag--ok{background:#E6F7F0;color:#0E9F73;}
.dbTag--ng{background:#FDECEA;color:#E0402F;}
@media (max-width:820px){
  .dbTable__h{display:none;}
  .dbTable__r{grid-template-columns:1fr auto;gap:6px;padding:14px 16px;}
  .dbTable__t{grid-column:1;}
  .dbTable__a{grid-column:1;}
  .dbTable__s{grid-column:1/-1;white-space:normal;}
}

/* 事業別 */
.dbSvcs{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.dbSvc{background:var(--white);border:1px solid var(--line);border-top:3px solid var(--t);border-radius:18px;padding:20px 22px;}
.dbSvc__hd{display:flex;align-items:center;gap:9px;margin-bottom:14px;}
.dbSvc__dot{width:8px;height:8px;border-radius:50%;background:var(--t);}
.dbSvc__n{font-size:14px;font-weight:700;flex:1;}
.dbSvc__c{font-size:9.5px;letter-spacing:.14em;color:var(--t);background:var(--s);border-radius:999px;padding:3px 9px;}
.dbSvc__v{font-size:30px;font-weight:500;line-height:1.1;}
.dbSvc__v span{font-family:var(--sans);font-size:12px;color:var(--muted);margin-left:5px;}
.dbSvc__l{font-size:12px;color:var(--muted);margin-bottom:12px;}
.dbSvc__bar{height:5px;border-radius:999px;background:var(--bg);overflow:hidden;}
.dbSvc__bar span{display:block;height:100%;background:var(--t);border-radius:999px;transition:width .6s cubic-bezier(.22,1,.36,1);}
@media (max-width:900px){.dbSvcs{grid-template-columns:1fr;}}
.dbSvcTag{font-style:normal;font-family:var(--mono);font-size:9.5px;font-weight:700;letter-spacing:.1em;color:var(--t);background:var(--s);border-radius:999px;padding:3px 9px;white-space:nowrap;}

.dbSvc.is-click{cursor:pointer;transition:transform .25s,box-shadow .25s,border-color .25s;}
.dbSvc.is-click:hover{transform:translateY(-3px);box-shadow:0 24px 44px -30px rgba(26,34,51,.5);border-color:var(--t);}
.dbSvc__more{font-size:11.5px;font-weight:700;color:var(--t);margin-top:11px;}
.dbTable__r.is-click{cursor:pointer;transition:background .18s;}
.dbTable__r.is-click:hover{background:var(--bg);}
.dbTable__go{font-style:normal;color:#B9C0CB;margin-left:7px;font-weight:700;}

.stNoteInline{font-style:normal;font-size:11px;color:var(--muted);border:1px dashed var(--line);border-radius:999px;padding:4px 11px;}

.stIdeaBar{display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap;}
.stIdeaBtn{display:inline-flex;align-items:center;gap:8px;background:var(--ai);color:#fff;font-size:12.5px;font-weight:700;border-radius:999px;padding:10px 20px;transition:all .2s;box-shadow:0 10px 20px -12px rgba(124,92,214,.9);}
.stIdeaBtn:hover{filter:brightness(.93);transform:translateY(-1px);}
.stIdeaBar__n{font-size:11.5px;color:var(--muted);line-height:1.75;flex:1;min-width:180px;}
.stIdeas{display:grid;gap:9px;margin-bottom:16px;}
.stIdea{display:block;width:100%;border:1.5px solid var(--line);border-radius:14px;padding:14px 16px;transition:all .2s;}
.stIdea:hover{border-color:var(--ai);}
.stIdea.is-on{border-color:var(--ai);background:#F7F4FE;}
.stIdea__h{display:flex;align-items:baseline;gap:9px;margin-bottom:6px;flex-wrap:wrap;}
.stIdea__h b{font-size:13px;font-weight:700;}
.stIdea__h em{font-style:normal;font-size:11px;color:var(--muted);}
.stIdea__t{display:block;font-size:12.5px;line-height:1.9;color:var(--muted);}
.stIdea.is-on .stIdea__t{color:var(--ink);}

.stRef{background:#F7F4FE;border:1px solid #DCD0F7;border-radius:14px;padding:16px;margin-bottom:18px;}
.stRef__k{display:flex;align-items:center;gap:9px;font-size:12.5px;font-weight:700;margin-bottom:13px;}
.stRef__k em{font-style:normal;font-size:10px;font-weight:700;color:var(--muted);background:var(--white);border-radius:999px;padding:2px 9px;}
.stRef .stWarn{margin-bottom:0;}
.stRef .stF:last-of-type{margin-bottom:14px;}

/* お手本分析ステップ */
.stSam{background:var(--bg);border-radius:14px;padding:16px;margin-bottom:18px;}
.stSam__k{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:700;margin-bottom:12px;}
.stSam__k em{font-style:normal;font-size:10px;font-weight:700;border-radius:999px;padding:3px 9px;}
.stSam__k em.is-ok{color:#0E9F73;background:#E6F7F0;}
.stSam__k em.is-ng{color:var(--sig);background:#FDECEA;}
.stSam__i{display:grid;grid-template-columns:26px 1fr auto;gap:9px;align-items:start;margin-bottom:9px;}
.stSam__n{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--white);border:1px solid var(--line);font-family:var(--mono);font-size:11px;font-weight:700;color:var(--muted);margin-top:8px;}
.stSam__i textarea{background:var(--white);}
.stSam__x{color:#B9C0CB;padding:8px;border-radius:8px;margin-top:6px;transition:all .2s;}
.stSam__x:hover{color:var(--sig);background:#FDECEA;}
.stSam__add{font-size:12.5px;font-weight:700;color:var(--ai);border:1.5px dashed #DCD0F7;border-radius:11px;padding:11px;width:100%;text-align:center;transition:all .2s;}
.stSam__add:hover{background:#F7F4FE;border-style:solid;}

.stAn{background:var(--white);border:1.5px solid var(--ai);border-radius:16px;padding:18px;margin-bottom:18px;}
.stAn__h{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;}
.stAn__t{font-size:13px;font-weight:700;}
.stAn__lv{display:flex;align-items:center;gap:7px;margin-left:auto;font-size:11.5px;font-weight:700;color:var(--ai);}
.stAn__lv em{font-style:normal;font-family:var(--mono);font-size:10px;background:#F1EDFC;border-radius:999px;padding:2px 8px;}
.stAn__lv.lv-22{color:var(--sig);}
.stAn__lv.lv-100{color:#0E9F73;}
.stAn__bar{height:6px;border-radius:999px;background:var(--bg);overflow:hidden;margin-bottom:8px;}
.stAn__bar span{display:block;height:100%;background:var(--ai);border-radius:999px;transition:width .5s cubic-bezier(.22,1,.36,1);}
.stAn__note{font-size:11.5px;color:var(--muted);margin-bottom:14px;}
.stAn__g{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:12px;overflow:hidden;}
.stAn__g > div{background:var(--white);padding:10px 12px;}
.stAn__g dt{font-size:10px;color:var(--muted);margin-bottom:3px;}
.stAn__g dd{font-size:12.5px;font-weight:700;}
@media (max-width:760px){.stAn__g{grid-template-columns:repeat(2,1fr);}}
.stEmptyBox{font-size:12.5px;color:var(--muted);background:var(--bg);border-radius:12px;padding:18px;text-align:center;margin-bottom:18px;}

.stQ__row{margin-top:16px;padding-top:16px;border-top:1px solid var(--line);}
.stNote{background:#E9F7F1;border:1px solid #B9E4D2;border-radius:14px;padding:16px;margin-bottom:18px;}
.stNote__k{display:flex;align-items:center;gap:9px;font-size:12.5px;font-weight:700;margin-bottom:12px;color:#0B7A58;}
.stNote__k em{font-style:normal;font-size:10px;color:var(--muted);background:var(--white);border-radius:999px;padding:2px 9px;}
.stNote .stCheck{align-items:flex-start;margin-bottom:12px;}
.stNote .stCheck:last-child{margin-bottom:0;}
.stNote .stCheck b{display:block;font-size:13px;font-weight:700;}
.stNote .stCheck em{font-style:normal;font-size:11.5px;color:var(--muted);line-height:1.75;}
.stNote input{margin-top:3px;accent-color:#0E9F73;}

.stWatch{margin-top:14px;background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:16px;}
.stWatch.is-完了{background:#E6F7F0;border-color:#B9E4D2;}
.stWatch.is-エラー,.stWatch.is-時間切れ{background:#FDECEA;border-color:#F5C4BF;}
.stWatch__bar{display:flex;align-items:center;gap:0;margin-bottom:12px;}
.stWatch__s{flex:1;display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--muted);position:relative;}
.stWatch__s em{width:11px;height:11px;border-radius:50%;background:var(--line);flex-shrink:0;transition:all .3s;}
.stWatch__s.is-on{color:var(--ink);font-weight:700;}
.stWatch__s.is-on em{background:var(--ai);}
.stWatch__s.is-now em{animation:stPulse 1.4s ease-in-out infinite;box-shadow:0 0 0 4px rgba(124,92,214,.2);}
@keyframes stPulse{50%{opacity:.4;}}
.stWatch__s:not(:last-child)::after{content:"";flex:1;height:2px;background:var(--line);margin-right:8px;}
.stWatch__s.is-on:not(:last-child)::after{background:var(--ai);}
.stWatch__t{font-size:12.5px;line-height:1.85;color:var(--muted);display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.stWatch__t a{font-weight:700;color:#0E9F73;text-decoration:underline;}
.stWatch__x{margin-left:auto;color:#B9C0CB;font-size:16px;padding:2px 8px;border-radius:6px;}
.stWatch__x:hover{background:var(--white);color:var(--ink);}

.stStep.is-lock{opacity:.5;}
.stStep__lock{margin-left:auto;font-size:9.5px;font-weight:700;color:#fff;background:#9BA3B1;border-radius:999px;padding:2px 8px;}
.stGate{display:flex;align-items:flex-start;gap:9px;font-size:12px;line-height:1.85;color:#7A5A12;background:#FFF7E8;border:1px solid #F2DCAE;border-radius:12px;padding:12px 15px;margin-top:12px;}
.stGate svg{color:#B47C10;margin-top:3px;flex-shrink:0;}
.stMedia{background:var(--bg);border-radius:14px;padding:16px;margin-top:16px;}
.stMedia__k{display:flex;align-items:center;gap:9px;font-size:12.5px;font-weight:700;margin-bottom:7px;}
.stMedia__k em{font-style:normal;font-size:10px;font-weight:700;color:var(--muted);background:var(--white);border-radius:999px;padding:2px 9px;}
.stMedia__n{font-size:11.5px;line-height:1.85;color:var(--muted);margin-bottom:13px;}
.stMedia__add{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:var(--ai);background:var(--white);border:1.5px solid var(--ai);border-radius:999px;padding:9px 18px;cursor:pointer;transition:all .2s;}
.stMedia__add:hover{background:var(--ai);color:#fff;}
.stMedia__l{display:grid;gap:9px;margin-top:13px;}
.stMedia__i{display:flex;align-items:center;gap:11px;background:var(--white);border:1px solid var(--line);border-radius:12px;padding:10px 12px;}
.stMedia__i img{width:56px;height:56px;object-fit:cover;border-radius:8px;flex-shrink:0;}
.stMedia__i > div{flex:1;min-width:0;}
.stMedia__i p{font-size:11.5px;font-weight:700;margin-bottom:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.stMedia__i input{width:100%;background:var(--bg);border:1px solid transparent;border-radius:8px;padding:7px 10px;font:inherit;font-size:11.5px;}
.stMedia__i > button{color:#B9C0CB;font-size:16px;padding:4px 8px;border-radius:6px;flex-shrink:0;}
.stMedia__i > button:hover{color:var(--sig);background:#FDECEA;}
.stPack{background:var(--bg);border-radius:14px;padding:16px;margin-bottom:18px;}
.stPack__k{display:flex;align-items:center;gap:9px;font-size:12.5px;font-weight:700;margin-bottom:11px;}
.stPack__k em{font-style:normal;font-size:10px;font-weight:700;color:#fff;background:var(--t);border-radius:999px;padding:2px 10px;}
.stPack__l{display:grid;gap:6px;margin-bottom:13px;}
.stPack__l li{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink);}
.stPack__l svg{color:#0E9F73;flex-shrink:0;}
.stPack .stCheck{align-items:flex-start;margin-bottom:0;}
.stPack .stCheck b{display:block;font-size:12.5px;}
.stPack .stCheck em{font-style:normal;font-size:11px;color:var(--muted);}

/* ==== お手本：媒体タブとパーツ ==== */
.stRefTabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:16px;}
.stRefTab{display:flex;align-items:center;gap:8px;background:var(--white);border:1.5px solid var(--line);border-radius:999px;padding:9px 16px;white-space:nowrap;transition:all .2s;}
.stRefTab:hover{border-color:var(--t);}
.stRefTab.is-on{border-color:var(--t);background:var(--s);}
.stRefTab.is-ok .stRefTab__d{background:#0E9F73;}
.stRefTab__d{width:8px;height:8px;border-radius:50%;background:var(--t);}
.stRefTab b{font-size:13px;font-weight:700;}
.stRefTab em{font-style:normal;font-family:var(--mono);font-size:10.5px;color:var(--muted);}
.stRefTab.is-ok em{color:#0E9F73;font-weight:700;}

.stParts{display:grid;gap:9px;margin-bottom:18px;}
.stPart{border:1.5px solid var(--line);border-radius:14px;overflow:hidden;background:var(--white);}
.stPart.is-ok{border-color:#B9E4D2;}
.stPart.is-open{border-color:var(--ai);}
.stPart__h{display:flex;align-items:center;gap:11px;width:100%;padding:14px 16px;}
.stPart__m{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;font-size:10px;font-weight:700;background:#FDECEA;color:var(--sig);flex-shrink:0;}
.stPart.is-ok .stPart__m{background:#E6F7F0;color:#0E9F73;}
.stPart__t{flex:1;min-width:0;}
.stPart__t b{display:block;font-size:13.5px;font-weight:700;}
.stPart__t em{font-style:normal;font-size:11px;color:var(--muted);}
.stPart__c{font-size:11px;color:var(--muted);white-space:nowrap;}
.stPart.is-ok .stPart__c{color:#0E9F73;font-weight:700;}
.stPart__a{color:var(--muted);transition:transform .25s;}
.stPart__a.is-up{transform:rotate(180deg);}
.stPart__b{padding:0 16px 16px;border-top:1px solid var(--line);padding-top:14px;}
.stPart__row{display:flex;gap:9px;align-items:flex-start;margin-bottom:8px;}
.stPart__n{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--bg);font-size:10.5px;font-weight:700;color:var(--muted);flex-shrink:0;margin-top:8px;}
.stPart__row textarea{flex:1;}
.stPart__x{color:#B9C0CB;font-size:16px;padding:4px 8px;border-radius:6px;margin-top:6px;}
.stPart__x:hover{color:var(--sig);background:#FDECEA;}
.stPart__add{font-size:12px;font-weight:700;color:var(--ai);padding:7px 0;}
.stPart__stat{display:flex;align-items:flex-start;gap:9px;font-size:11.5px;line-height:1.8;color:var(--muted);background:var(--bg);border-radius:11px;padding:11px 13px;margin-top:11px;}
.stPart__lv{font-size:10px;font-weight:700;border-radius:999px;padding:3px 9px;white-space:nowrap;background:#FDECEA;color:var(--sig);}
.stPart__lv.lv-50{background:#FFF4DE;color:#B47C10;}
.stPart__lv.lv-75,.stPart__lv.lv-100{background:#E6F7F0;color:#0E9F73;}
.stPart__media{display:flex;gap:9px;align-items:center;margin-top:12px;flex-wrap:wrap;}
.stPart__vid,.stPart__vnote{flex:1;min-width:190px;}
.stPart__vnote{margin-top:9px;}

.stAuto{background:#F5F1FE;border:1px solid #DCD0F7;border-radius:14px;padding:16px;margin-bottom:18px;}
.stAuto__k{display:flex;align-items:center;gap:9px;font-size:12.5px;font-weight:700;color:#4A3A75;margin-bottom:12px;}
.stAuto__k svg{color:var(--ai);}
.stAuto__k button{margin-left:auto;font-size:11.5px;font-weight:700;color:#fff;background:var(--ai);border-radius:999px;padding:6px 15px;}
.stAuto__l{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;}
.stAuto__l li{background:var(--white);border-radius:10px;padding:9px 12px;font-size:12.5px;font-weight:700;}
.stAuto__l li span{display:block;font-size:9.5px;font-weight:400;color:var(--muted);margin-bottom:3px;}
.stAuto__n{font-size:11.5px;line-height:1.85;color:var(--muted);margin-top:12px;}
.stDetail__k{display:flex;align-items:center;}
.stDetail__back{margin-left:auto;font-size:11px;font-weight:700;color:var(--ai);border:1px solid var(--ai);border-radius:999px;padding:5px 13px;}

.stMore{display:block;width:100%;text-align:center;font-size:12.5px;font-weight:700;color:var(--ai);border:1.5px dashed #DCD0F7;border-radius:12px;padding:12px;margin-bottom:16px;transition:all .2s;}
.stMore:hover{background:#F5F1FE;}

/* ==== 投稿スケジュール ==== */
.stSched{background:var(--bg);border-radius:14px;padding:16px;margin-bottom:16px;}
.stDays{display:flex;gap:6px;flex-wrap:wrap;}
.stDay{width:44px;height:44px;border-radius:12px;border:1.5px solid var(--line);background:var(--white);font-size:14px;font-weight:700;color:var(--muted);display:flex;align-items:center;justify-content:center;transition:all .2s;}
.stDay:hover{border-color:var(--ai);}
.stDay.is-on{background:var(--ai);border-color:var(--ai);color:#fff;}
.stDay.is-we{color:#C4342A;}
.stDay.is-we.is-on{background:#C4342A;border-color:#C4342A;color:#fff;}
.stSlots__k{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:700;margin:16px 0 10px;}
.stSlots__k em{font-style:normal;font-size:10.5px;font-weight:700;color:#fff;background:var(--ai);border-radius:999px;padding:2px 10px;}
.stSlots{display:grid;gap:10px;}
.stSlot{background:var(--white);border:1px solid var(--line);border-radius:12px;padding:12px 14px;}
.stSlot__h{display:flex;align-items:center;gap:10px;margin-bottom:9px;}
.stSlot__time{width:118px !important;font-family:var(--mono);font-weight:700;font-size:15px !important;padding:8px 10px !important;}
.stSlot__n{font-size:11px;color:var(--muted);}
.stSlot__x{margin-left:auto;color:#B9C0CB;font-size:16px;padding:3px 8px;border-radius:6px;}
.stSlot__x:hover{color:var(--sig);background:#FDECEA;}
.stSlot__media{display:flex;gap:8px;align-items:center;margin-top:9px;flex-wrap:wrap;}
.stSlot__media input{flex:1;min-width:170px;font-size:12px !important;padding:9px 12px !important;}
.stSlot__imgs{display:flex;gap:7px;margin-top:9px;flex-wrap:wrap;}
.stSlot__imgs span{position:relative;}
.stSlot__imgs img{width:52px;height:52px;object-fit:cover;border-radius:8px;display:block;}
.stSlot__imgs button{position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--ink);color:#fff;font-size:12px;display:flex;align-items:center;justify-content:center;}
.stSched__sum{font-size:12px;line-height:1.9;color:var(--muted);background:var(--white);border-radius:10px;padding:11px 14px;margin-top:12px;}
.stSched__sum b{color:var(--ink);}

/* ==== 時間スロットのタブ ==== */
.stSlotTabs{display:flex;gap:6px;flex-wrap:wrap;}
.stSlotTabs button{display:flex;align-items:center;gap:7px;font-family:var(--mono);font-size:12.5px;font-weight:700;border:1.5px solid var(--line);background:var(--white);border-radius:999px;padding:8px 16px;color:var(--muted);transition:all .2s;}
.stSlotTabs button:hover{border-color:var(--ai);}
.stSlotTabs button.is-on{background:var(--ai);border-color:var(--ai);color:#fff;}
.stSlotTabs em{font-style:normal;font-family:var(--sans);font-size:10px;font-weight:400;opacity:.75;}
.stSlotNote{font-size:11.5px;line-height:1.85;color:var(--muted);background:var(--bg);border-radius:10px;padding:10px 14px;margin-bottom:16px;}
`;
