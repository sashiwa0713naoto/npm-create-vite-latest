import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

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
        <span className="dbGate__ic">
          <Ico name="lock" size={26} />
        </span>
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
  const [live, setLive] = useState(false); // 実データ取得成功フラグ
  const [loadingData, setLoadingData] = useState(false);

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
    if (!SHEET_CSV_URL) return;
    setLoadingData(true);
    try {
      const r = await fetch(SHEET_CSV_URL);
      if (!r.ok) throw new Error(String(r.status));
      const rows = parseCsv(await r.text());
      if (rows.length) {
        setTasks(rows.reverse());
        setLive(true);
        pushLog(`[${new Date().toLocaleTimeString()}] DATA SYNCED: ${rows.length} records`);
      }
    } catch (e) {
      setLive(false);
      pushLog(`[${new Date().toLocaleTimeString()}] SYNC FAILED — デモデータを表示中`);
    } finally {
      setLoadingData(false);
    }
  }, [pushLog]);

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
      <style>{CSS}</style>
      <Gate onPass={() => setAuthed(true)} />
    </div>
  );

  const goDept = (id) => {
    setDeptId(id);
    setAgentId(null);
    setNavOpen(false);
  };
  const goAgent = (dId, aId) => {
    setDeptId(dId);
    setAgentId(aId);
    setNavOpen(false);
  };

  return (
    <div className="dbRoot">
      <style>{CSS}</style>

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
            <button className={`dbNavAll ${!deptId ? "is-cur" : ""}`} onClick={() => goDept(null)}>
              <Ico name="grid" size={17} />
              全社ダッシュボード
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
            <button className="dbSide__out" onClick={() => setAuthed(false)}>
              <Ico name="out" size={15} />
              退室
            </button>
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
              <button onClick={() => goDept(null)}>全社</button>
              {dept && (
                <>
                  <em>/</em>
                  <button onClick={() => goDept(dept.id)}>{dept.name}</button>
                </>
              )}
              {agent && (
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
            {!dept && <ViewAll company={company} kpi={kpi} tasks={tasks} logs={logs} goDept={goDept} goAgent={goAgent} />}
            {dept && !agent && <ViewDept dept={dept} tasks={tasks} goAgent={goAgent} />}
            {dept && agent && (
              <ViewAgent dept={dept} agent={agent} tasks={tasks} logs={logs} assign={assign} />
            )}
          </div>
        </div>
      </div>

      {navOpen && <div className="dbScrim" onClick={() => setNavOpen(false)} />}
    </div>
  );
}

/* ============================ View A：全社 ============================== */

function ViewAll({ company, kpi, tasks, logs, goDept, goAgent }) {
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
              <article key={sv.code} className="dbSvc" style={{ "--t": sv.theme, "--s": sv.soft }}>
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
          <TaskTable tasks={tasks.slice(0, 8)} />
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

function ViewDept({ dept, tasks, goAgent }) {
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
        {rel.length ? <TaskTable tasks={rel.slice(0, 10)} /> : <p className="dbEmpty">まだ記録がありません。</p>}
      </section>
    </div>
  );
}

/* ============================ View C：個別 ============================== */

function ViewAgent({ dept, agent, tasks, logs, assign }) {
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
        {rel.length ? <TaskTable tasks={rel.slice(0, 10)} /> : <p className="dbEmpty">まだ記録がありません。</p>}
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

function TaskTable({ tasks }) {
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
        <div className="dbTable__r" key={`${t.run_id}-${t.agent}-${i}`}>
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
            <em className={`dbTag dbTag--${(t.status || "").includes("失敗") ? "ng" : "ok"}`}>{t.status}</em>
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

/* ================================ CSS ================================== */

const CSS = `
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
.dbSvcs{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
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
`;
