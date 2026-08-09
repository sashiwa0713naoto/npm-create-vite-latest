import React, { useState, useEffect, useCallback } from "react";

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

export const PLATFORM_META = {
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

export function useAccounts() {
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

export default function AccountsView({ pushLog }) {
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
      <style>{CSS}</style>

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

/* ================================ CSS ================================== */

const CSS = `
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

export function useSettings() {
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
export function resolveEndpoint(settings) {
  const useGas = settings.useGas && settings.gasUrl;
  return {
    url: useGas ? settings.gasUrl : settings.makeUrl,
    contentType: useGas ? "text/plain;charset=utf-8" : "application/json",
    isGas: !!useGas,
  };
}

export function SettingsView({ pushLog }) {
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

  const disconnect = () => {
    save({ gasUrl: "", useGas: false });
    setGasUrl("");
    setResult({ ok: true, msg: "接続を解除しました。以降はMakeに送信されます。" });
  };

  const connected = !!settings.gasUrl && settings.useGas;

  return (
    <div className="acRoot">
      <style>{CSS}</style>

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
