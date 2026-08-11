/**
 * ============================================================================
 * 株式会社SASHIWA — 制作バックエンド（Google Apps Script）
 * ----------------------------------------------------------------------------
 * これ1つで、以下がすべて動きます。Makeの設定は不要です。
 *
 *   1. 制作スタジオからの依頼を受け取る（doPost）
 *   2. スプレッドシートに記録する
 *   3. Difyを呼んで文章を生成する
 *   4. Googleドキュメントを作成して保存する
 *   5. 共有リンクを発行してメールで納品する
 *   6. 予約投稿の時刻が来たら、完成した投稿文をメールで届ける
 *
 * ■ 設定はダイアログに沿って貼るだけ
 *   setup を実行すると、Difyのキーを聞いてきます。貼り付ければ完了です。
 *   通知先メールは自動取得。シートもトリガーも自動生成されます。
 *
 * ■ 費用
 *   Google Apps Scriptは無料です。Difyの従量課金だけが実費になります。
 * ============================================================================
 */

/* このスクリプトのバージョン。ダッシュボードが古いデプロイを検知するのに使います。 */
const SASHIWA_VERSION = "3.0";

/* 通知先が取得できなかった場合の宛先。必要に応じて書き換えてください。 */
const DEFAULT_NOTIFY = "sashiwa0713naoto@gmail.com";

/** 通知先メールアドレスを返します（設定 → ログイン中のアカウント → 既定値の順） */
function notifyEmail() {
  const p = PropertiesService.getScriptProperties().getProperty("NOTIFY_EMAIL");
  if (p) return p;
  let me = "";
  try { me = Session.getActiveUser().getEmail() || ""; } catch (e) {}
  return me || DEFAULT_NOTIFY;
}

/** シートが無ければ作ります（doPostからも呼びます） */
function ensureSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, "ジョブ", [
    "job_id", "受信日時", "種別", "投稿先アカウント", "持ち主",
    "媒体", "状態", "指示内容", "成果物URL", "完了日時", "納品先メール", "備考",
  ]);
  ensureSheet(ss, "投稿キュー", [
    "post_id", "予定日時", "アカウント", "媒体", "本文",
    "画像URL", "繰り返し", "状態", "実行日時",
  ]);
}

/* ========================= ① 最初に1回だけ実行 ========================= */

/**
 * 一番最初に、この setup 関数を実行してください。
 * スプレッドシートのシートと見出し行を自動で作ります。
 */
function setup() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();

  // 1) シートを用意
  ensureSheet(ss, "ジョブ", [
    "job_id", "受信日時", "種別", "投稿先アカウント", "持ち主",
    "媒体", "状態", "指示内容", "成果物URL", "完了日時", "納品先メール", "備考",
  ]);
  ensureSheet(ss, "投稿キュー", [
    "post_id", "予定日時", "アカウント", "媒体", "本文",
    "画像URL", "繰り返し", "状態", "実行日時",
  ]);

  // 2) 制作担当のキーを聞く
  if (!props.getProperty("DIFY_CREATIVE_KEY")) {
    const r = ui.prompt(
      "SASHIWA セットアップ（1/2）",
      "Dify の Creative_PR_AI のAPIキーを貼り付けてください。\n" +
        "（Difyでアプリを開き「アクセスAPI」から取得できる app- で始まる文字列です）",
      ui.ButtonSet.OK_CANCEL
    );
    if (r.getSelectedButton() !== ui.Button.OK) return;
    const key = r.getResponseText().trim();
    if (key.indexOf("app-") !== 0) {
      ui.alert("キーが app- で始まっていません。もう一度 setup を実行してください。");
      return;
    }
    props.setProperty("DIFY_CREATIVE_KEY", key);
  }

  // 3) 検査担当のキーを聞く（任意）
  if (!props.getProperty("DIFY_QA_KEY")) {
    const r2 = ui.prompt(
      "SASHIWA セットアップ（2/2）",
      "Dify の QA_Ethics_AI のAPIキーを貼り付けてください。\n" +
        "検査工程を入れない場合は、空欄のままOKを押してください（あとから追加できます）。",
      ui.ButtonSet.OK_CANCEL
    );
    if (r2.getSelectedButton() === ui.Button.OK) {
      const k2 = r2.getResponseText().trim();
      if (k2.indexOf("app-") === 0) props.setProperty("DIFY_QA_KEY", k2);
    }
  }

  // 3.5) 画像生成用のOpenAIキー（任意）
  if (!props.getProperty("OPENAI_KEY")) {
    const r3 = ui.prompt(
      "SASHIWA セットアップ（画像生成・任意）",
      "画像も生成する場合は、OpenAI の APIキー（sk- で始まる文字列）を貼り付けてください。\n" +
        "画像を使わない場合は、空欄のままOKを押してください。",
      ui.ButtonSet.OK_CANCEL
    );
    if (r3.getSelectedButton() === ui.Button.OK) {
      const k3 = r3.getResponseText().trim();
      if (k3.indexOf("sk-") === 0) props.setProperty("OPENAI_KEY", k3);
    }
  }

  // 3.6) 動画レンダリング用のキー（任意）
  if (!props.getProperty("VIDEO_KEY")) {
    const r4 = ui.prompt(
      "SASHIWA セットアップ（動画・任意）",
      "動画も自動生成する場合は、JSON2Video のAPIキーを貼り付けてください。\n" +
        "（json2video.com に無料登録すると発行されます）\n" +
        "動画を使わない場合は、空欄のままOKを押してください。台本だけが納品されます。",
      ui.ButtonSet.OK_CANCEL
    );
    if (r4.getSelectedButton() === ui.Button.OK) {
      const k4 = r4.getResponseText().trim();
      if (k4.length > 10) props.setProperty("VIDEO_KEY", k4);
    }
  }

  // 4) 通知先。自動取得できなければ入力してもらいます
  if (!props.getProperty("NOTIFY_EMAIL")) {
    let me = "";
    try { me = Session.getActiveUser().getEmail() || ""; } catch (e) {}
    if (!me) {
      const r5 = ui.prompt(
        "SASHIWA セットアップ（通知先）",
        "成果物の納品先メールアドレスを入力してください。\n" +
          "空欄のままOKを押すと " + DEFAULT_NOTIFY + " を使います。",
        ui.ButtonSet.OK_CANCEL
      );
      if (r5.getSelectedButton() === ui.Button.OK) me = r5.getResponseText().trim();
    }
    props.setProperty("NOTIFY_EMAIL", me || DEFAULT_NOTIFY);
  }

  // 5) トリガー
  installTriggers();

  const qa = props.getProperty("DIFY_QA_KEY") ? "あり" : "なし（あとから setup で追加できます）";
  const img = props.getProperty("OPENAI_KEY") ? "あり" : "なし（文章のみ）";
  const vid = props.getProperty("VIDEO_KEY") ? "あり" : "なし（台本のみ納品）";
  ui.alert(
    "セットアップが完了しました。\n\n" +
      "  制作担当のキー：登録済み\n" +
      "  検査担当のキー：" + qa + "\n" +
      "  通知先：" + props.getProperty("NOTIFY_EMAIL") + "\n" +
      "  自動実行：5分ごと（制作）／15分ごと（予約配信）\n\n" +
      "【残り1ステップ】\n" +
      "右上「デプロイ」→「新しいデプロイ」→ 歯車から「ウェブアプリ」を選び、\n" +
      "  実行するユーザー：自分\n" +
      "  アクセスできるユーザー：全員\n" +
      "でデプロイしてください。\n\n" +
      "表示されたURLを、ダッシュボードの「接続設定」に貼れば完了です。\n" +
      "（GitHubを編集する必要はありません）"
  );
}

/** 設定内容の確認用。いつでも実行できます。 */
function showStatus() {
  const d = diagnose();
  const yn = function (b) { return b ? "登録済み" : "未登録"; };
  const trig = d.トリガー.length ? d.トリガー.join(", ") : "なし（setup を実行してください）";
  let msg =
    "SASHIWA バックエンドの状態\n" +
    "────────────────\n" +
    "  バージョン：" + d.version + "\n" +
    "  シート：ジョブ " + (d.シート.ジョブ ? "○" : "×") + " ／ 投稿キュー " + (d.シート.投稿キュー ? "○" : "×") + "\n" +
    "  記録件数：" + d.シート.件数 + " 件\n" +
    "  制作キー：" + yn(d.キー.制作) + "\n" +
    "  検査キー：" + yn(d.キー.検査) + "\n" +
    "  画像キー：" + yn(d.キー.画像) + "\n" +
    "  動画キー：" + yn(d.キー.動画) + "\n" +
    "  X投稿キー：" + yn(d.キー.X投稿) + "\n" +
    "  通知先：" + d.通知先 + "\n" +
    "  トリガー：" + trig + "\n";
  if (d.未処理.length) {
    msg += "\n未処理・エラーの案件\n────────────────\n";
    d.未処理.forEach(function (w) {
      msg += "  " + w.id + "（" + w.状態 + "）\n    " + w.備考 + "\n";
    });
  }
  if (!d.キー.制作) msg += "\n▲ 制作キーが未登録です。setup を実行してください。";
  if (!d.トリガー.length) msg += "\n▲ 自動実行のトリガーがありません。setup を実行してください。";
  SpreadsheetApp.getUi().alert(msg);
}

/** 今すぐ1件だけ処理します（トリガーを待たずに試したいとき） */
function 今すぐ処理() {
  processJobs();
  showStatus();
}

function ensureSheet(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  const first = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  if (first.join("") !== headers.join("")) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#EFF1F4");
    sh.setFrozenRows(1);
  }
  return sh;
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    const f = t.getHandlerFunction();
    if (f === "processJobs" || f === "runSchedule") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("processJobs").timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger("runSchedule").timeBased().everyMinutes(15).create();
}

/* ========================= ② 依頼の受け口 ============================= */

function doPost(e) {
  try {
    ensureSheets();
    const body = JSON.parse(e.postData.contents);
    const msg = String(body.message || "");
    const jobId = "J" + new Date().getTime();

    const isPost = msg.indexOf("【JOB】POST") >= 0;
    const kind =
      msg.indexOf("【JOB】PLAN") >= 0 ? "運用設計"
      : msg.indexOf("【JOB】IMAGE") >= 0 ? "画像"
      : isPost ? "予約投稿"
      : msg.indexOf("【JOB】") < 0 ? "問い合わせ"
      : "コンテンツ";

    const acct = pick(msg, "投稿先アカウント") || pick(msg, "運用アカウント") || "-";
    const owner = pick(msg, "持ち主") || String(body.client_name || "-");
    const media = pick(msg, "媒体") || "-";

    if (isPost) {
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName("投稿キュー").appendRow([
        jobId,
        pick(msg, "投稿日時") || "",
        acct,
        media,
        pick(msg, "本文") || "",
        "",
        pick(msg, "繰り返し") || "なし",
        "予約",
        "",
      ]);
    } else {
      if (kind === "問い合わせ") {
        const notify = PropertiesService.getScriptProperties().getProperty("NOTIFY_EMAIL");
        if (notify) {
          MailApp.sendEmail(
            notify,
            "【SASHIWA】新規のお問い合わせ：" + String(body.client_name || ""),
            "お名前：" + String(body.client_name || "") + "\n" +
              "メール：" + String(body.client_email || "") + "\n\n" +
              msg
          );
        }
      }
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ジョブ").appendRow([
        jobId,
        new Date(),
        kind,
        acct,
        owner,
        media,
        "受付",
        msg,
        "",
        "",
        String(body.client_email || ""),
      ]);
    }

    return json({ ok: true, job_id: jobId, kind: kind, version: SASHIWA_VERSION });
  } catch (err) {
    return json({ ok: false, error: String(err), version: SASHIWA_VERSION });
  }
}

/**
 * ダッシュボードからの読み取り。
 *   ?action=jobs   … 制作履歴（納品先メールは返しません）
 *   ?action=queue  … 予約投稿の一覧
 *   （指定なし）    … 接続確認
 */
function doGet(e) {
  const action = e && e.parameter ? String(e.parameter.action || "") : "";
  try {
    if (action === "jobs") return json({ ok: true, jobs: listJobs() });
    if (action === "queue") return json({ ok: true, queue: listQueue() });
    if (action === "diag") return json({ ok: true, service: "SASHIWA Studio Backend", diag: diagnose() });
    return json({ ok: true, service: "SASHIWA Studio Backend", version: SASHIWA_VERSION });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** 設定の状態をまとめて返します */
function diagnose() {
  const p = PropertiesService.getScriptProperties();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const jobs = ss.getSheetByName("ジョブ");
  const queue = ss.getSheetByName("投稿キュー");
  let triggers = [];
  try {
    triggers = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  } catch (e) {}
  const waiting = [];
  if (jobs && jobs.getLastRow() > 1) {
    const rows = jobs.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      const st = String(rows[i][6] || "");
      if (st === "受付" || st === "制作中" || st === "エラー") {
        waiting.push({ id: String(rows[i][0]), 状態: st, 備考: String(rows[i][11] || rows[i][8] || "").slice(0, 200) });
      }
    }
  }
  return {
    version: SASHIWA_VERSION,
    シート: { ジョブ: !!jobs, 投稿キュー: !!queue, 件数: jobs ? Math.max(0, jobs.getLastRow() - 1) : 0 },
    キー: {
      制作: !!p.getProperty("DIFY_CREATIVE_KEY"),
      検査: !!p.getProperty("DIFY_QA_KEY"),
      画像: !!p.getProperty("OPENAI_KEY"),
      動画: !!p.getProperty("VIDEO_KEY"),
      X投稿: !!p.getProperty("X_CONSUMER_KEY"),
    },
    通知先: notifyEmail(),
    トリガー: triggers,
    未処理: waiting.slice(-5),
  };
}

/** 画面から状態を確認するとき用 */
function 診断() { showStatus(); }

function listJobs() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ジョブ");
  if (!sh || sh.getLastRow() < 2) return [];
  const rows = sh.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    out.push({
      job_id: String(rows[i][0]),
      受信日時: toStr(rows[i][1]),
      種別: String(rows[i][2] || ""),
      投稿先アカウント: String(rows[i][3] || ""),
      持ち主: String(rows[i][4] || ""),
      媒体: String(rows[i][5] || ""),
      状態: String(rows[i][6] || ""),
      指示内容: String(rows[i][7] || ""),
      成果物URL: String(rows[i][8] || ""),
      完了日時: toStr(rows[i][9]),
      // 納品先メールは、URLが漏れた場合に備えて返しません
    });
  }
  return out.reverse().slice(0, 300);
}

function listQueue() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("投稿キュー");
  if (!sh || sh.getLastRow() < 2) return [];
  const rows = sh.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    out.push({
      post_id: String(rows[i][0]),
      予定日時: toStr(rows[i][1]),
      アカウント: String(rows[i][2] || ""),
      媒体: String(rows[i][3] || ""),
      本文: String(rows[i][4] || ""),
      繰り返し: String(rows[i][6] || ""),
      状態: String(rows[i][7] || ""),
      実行日時: toStr(rows[i][8]),
      投稿リンク: intentUrl(String(rows[i][3] || ""), String(rows[i][4] || "")),
    });
  }
  return out.reverse().slice(0, 200);
}

function toStr(v) {
  if (!v) return "";
  if (Object.prototype.toString.call(v) === "[object Date]") return fmt(v, true);
  return String(v);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** 【キー】値／ の形から値を取り出す */
function pick(text, key) {
  const m = String(text).match(new RegExp("【" + key + "】([^／]*)"));
  return m ? m[1].trim() : "";
}

/* ========================= ③ 制作の実行 =============================== */

function processJobs() {
  const props = PropertiesService.getScriptProperties();
  const creativeKey = props.getProperty("DIFY_CREATIVE_KEY");
  const qaKey = props.getProperty("DIFY_QA_KEY");
  const notify = notifyEmail();
  if (!creativeKey) {
    // キーが未登録だと永久に処理されないので、状態に理由を書き残します
    const sh0 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ジョブ");
    if (sh0) {
      const rr = sh0.getDataRange().getValues();
      for (let k = 1; k < rr.length; k++) {
        if (rr[k][6] === "受付") {
          sh0.getRange(k + 1, 7).setValue("エラー");
          sh0.getRange(k + 1, 12).setValue("Difyの制作キーが未登録です。setup を実行して登録してください。");
        }
      }
    }
    return;
  }

  // 先に、レンダリング中の動画が仕上がっていないか確認します
  checkRenders();

  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ジョブ");
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][6] !== "受付") continue;

    // 同時に走らないよう、先に印を付ける
    sh.getRange(i + 1, 7).setValue("制作中");
    SpreadsheetApp.flush();

    const jobId = rows[i][0];
    const kind = rows[i][2];
    const acct = rows[i][3];
    const instruction = String(rows[i][7]);
    const clientEmail = String(rows[i][10] || "");

    try {
      // 種別が「画像」なら、画像生成のルートへ
      if (kind === "画像") {
        const imgKey = props.getProperty("OPENAI_KEY");
        if (!imgKey) throw new Error("画像生成にはOpenAIのAPIキーが必要です。setup を実行して登録してください。");
        // まず制作担当に、画像生成向けの詳しい英語プロンプトを作らせます
        let imgPrompt = "";
        try {
          imgPrompt = callDify(
            creativeKey,
            "あなたは画像生成AI向けのプロンプト設計担当です。以下の条件から、" +
              "画像生成AIに渡す英語のプロンプトを1つだけ出力してください。\n" +
              "・被写体、構図、カメラアングル、レンズ感、光の向きと質、色調、質感、雰囲気を具体的に書くこと\n" +
              "・実在の人物名、キャラクター名、企業名、ロゴ、商標、既存作品の名前は一切含めないこと\n" +
              "・画像内に文字を入れないよう指示を含めること\n" +
              "・説明や前置きは書かず、プロンプト本文だけを英語で出力すること\n\n" +
              "--- 条件 ---\n" + instruction
          );
        } catch (e) {
          imgPrompt = "";
        }
        const url = generateImage(imgKey, instruction, acct, imgPrompt);
        sh.getRange(i + 1, 7).setValue("完了");
        sh.getRange(i + 1, 9).setValue(url);
        sh.getRange(i + 1, 10).setValue(new Date());
        MailApp.sendEmail({
          to: clientEmail || notify,
          cc: clientEmail ? notify : "",
          subject: "【SASHIWA】画像が完成しました（" + acct + "）",
          body: "画像の生成が完了しました。\n\n▼ 画像\n" + url + "\n\n投稿先：" + acct + "\nジョブID：" + jobId + "\n",
        });
        return;
      }

      // 種別が「動画」なら、台本を作ってからレンダリングへ
      if (kind === "動画") {
        const script = callDify(creativeKey, instruction);
        const docUrl = makeDoc("SASHIWA_動画台本_" + acct + "_" + fmt(new Date()), acct, script);
        const videoKey = props.getProperty("VIDEO_KEY");

        if (!videoKey) {
          sh.getRange(i + 1, 7).setValue("完了");
          sh.getRange(i + 1, 9).setValue(docUrl);
          sh.getRange(i + 1, 10).setValue(new Date());
          sh.getRange(i + 1, 12).setValue("動画キー未設定のため台本のみ");
          MailApp.sendEmail({
            to: clientEmail || notify,
            subject: "【SASHIWA】動画の台本が完成しました（" + acct + "）",
            body: "動画の企画・構成・台本が完成しました。\n\n▼ 台本\n" + docUrl +
              "\n\n※映像の書き出しは未設定です。setup を実行して JSON2Video のキーを登録すると、動画まで自動生成されます。\n",
          });
          return;
        }

        const projectId = submitRender(videoKey, instruction, script);
        sh.getRange(i + 1, 7).setValue("レンダリング中");
        sh.getRange(i + 1, 9).setValue(docUrl);
        sh.getRange(i + 1, 12).setValue("PROJECT:" + projectId);
        return;
      }

      const strict = instruction.indexOf("【検査】厳格") >= 0;

      // 1) 厳格モードのときは、先に構成を設計させます
      let outline = "";
      if (strict) {
        outline = callDify(
          creativeKey,
          "あなたは構成設計の担当です。以下の条件で作る成果物の【構成案】だけを出してください。" +
            "本文は書かないでください。見出しの並び、各パートで何を言うか、冒頭のフック、" +
            "締めのCTAを箇条書きで示してください。\n\n--- 条件 ---\n" + instruction
        );
      }

      // 2) 制作
      const draft = callDify(
        creativeKey,
        instruction +
          (outline ? "\n\n--- 先に設計した構成（これに沿って書いてください）---\n" + outline : "") +
          "\n\n--- 出力ルール ---\n" +
          "・前置き、解説、「承知しました」等は一切書かず、成果物の本文だけを出力すること\n" +
          "・JSONやMarkdownの記号で包まず、そのまま貼り付けて使える日本語のテキストで出力すること\n" +
          "・複数案を求められている場合は【案1】【案2】…で区切ること\n" +
          "・指定された文字数上限を絶対に超えないこと"
      );

      // 3) 検査（キーがあれば）
      let checked = draft;
      if (qaKey) {
        const qaPrompt =
          "以下の成果物を検査し、そのまま公開できる状態に仕上げてください。\n" +
          "確認する観点：\n" +
          "・事実として疑わしい記述がないか\n" +
          "・薬機法・景品表示法に触れる表現（効果の断定、最上級表現、根拠のない数値）がないか\n" +
          "・著作権や商標を侵害しうる記述がないか\n" +
          "・指定された文字数上限を超えていないか\n" +
          "・冒頭で読み手の関心をつかめているか\n\n" +
          "問題があれば修正した最終版を、無ければ原文をそのまま出力してください。" +
          "前置きや講評は不要で、最終的な本文だけを返してください。\n\n" +
          "--- 制作条件 ---\n" + instruction +
          "\n\n--- 成果物 ---\n" + draft;
        const qaResult = callDify(qaKey, qaPrompt);
        if (qaResult && qaResult.length > 20) checked = qaResult;
      }

      // 4) ドキュメント化
      const url = makeDoc("SASHIWA_" + kind + "_" + acct + "_" + fmt(new Date()), acct, checked);

      // 4) 記録と通知
      sh.getRange(i + 1, 7).setValue("完了");
      sh.getRange(i + 1, 9).setValue(url);
      sh.getRange(i + 1, 10).setValue(new Date());

      MailApp.sendEmail({
        to: clientEmail || notify,
        cc: clientEmail ? notify : "",
        subject: "【SASHIWA】" + kind + "が完成しました（" + acct + "）",
        body:
          kind + "の制作が完了しました。\n\n" +
          "▼ 成果物\n" + url + "\n\n" +
          "投稿先：" + acct + "\n" +
          "ジョブID：" + jobId + "\n\n" +
          "──────────────\n" +
          "株式会社SASHIWA\n" +
          "https://sashiwa-inc.vercel.app\n",
      });
    } catch (err) {
      sh.getRange(i + 1, 7).setValue("エラー");
      sh.getRange(i + 1, 9).setValue(String(err).slice(0, 300));
      MailApp.sendEmail(notify, "【SASHIWA】制作でエラー（" + jobId + "）", String(err));
    }

    return; // 1回の実行で1件ずつ。実行時間の上限を避けます
  }
}

/**
 * Difyの回答からJSONが返ってきた場合に、人が読める本文だけを取り出します。
 * report_body → answer → text → content の順で探し、無ければ原文を返します。
 */
function extractBody(raw) {
  const t = String(raw || "").trim();
  const m = t.match(/\{[\s\S]*\}/);
  if (!m) return t;
  try {
    const o = JSON.parse(m[0]);
    const keys = ["report_body", "本文", "output", "answer", "text", "content", "body"];
    for (let i = 0; i < keys.length; i++) {
      if (o[keys[i]] && String(o[keys[i]]).length > 20) return String(o[keys[i]]);
    }
    // 配列で複数案が返る形にも対応します
    if (Array.isArray(o.variants) && o.variants.length) {
      return o.variants
        .map(function (v, i) { return "【案" + (i + 1) + "】\n" + (typeof v === "string" ? v : v.text || JSON.stringify(v)); })
        .join("\n\n");
    }
    return t;
  } catch (e) {
    return t;
  }
}

function callDify(appKey, message) {
  const res = UrlFetchApp.fetch("https://api.dify.ai/v1/chat-messages", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + appKey },
    payload: JSON.stringify({
      inputs: { task_description: message },
      query: message,
      response_mode: "blocking",
      user: "sashiwa-studio",
    }),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code !== 200) throw new Error("Dify応答エラー " + code + "：" + text.slice(0, 200));
  const data = JSON.parse(text);
  return extractBody(data.answer || text);
}

/* ========================= 動画の生成 ================================= */

/**
 * 台本から動画のレンダリングを依頼します（JSON2Video）。
 * 返り値はプロジェクトIDで、仕上がりは checkRenders が拾います。
 *
 * ※JSON2Videoのスキーマは更新されることがあります。うまく動かない場合は
 *   https://json2video.com/docs/ を確認して、下のpayloadを調整してください。
 */
function submitRender(apiKey, instruction, script) {
  const ratio = pick(instruction, "比率") || "9:16";
  const vertical = ratio.indexOf("9:16") >= 0 || ratio.indexOf("縦") >= 0;
  const resolution = vertical ? "instagram-story" : "full-hd";

  // 台本を場面に分割します（空行、または「・」「■」の行頭で区切ります）
  const lines = String(script)
    .split(/\n+/)
    .map(function (t) { return t.replace(/^[・■\-\*\d\.\s]+/, "").trim(); })
    .filter(function (t) { return t.length > 4 && t.length < 200; })
    .slice(0, 8);

  const scenes = lines.map(function (line, idx) {
    return {
      "background-color": idx % 2 === 0 ? "#0A0D13" : "#1A2233",
      elements: [
        {
          type: "text",
          text: line,
          style: "003",
          settings: {
            "font-family": "Noto Sans JP",
            "font-size": vertical ? "68px" : "54px",
            "font-weight": "700",
            color: "#FFFFFF",
            "text-align": "center",
          },
          position: "center-center",
          duration: -1,
        },
        {
          type: "voice",
          text: line,
          voice: "ja-JP-NanamiNeural",
          model: "azure",
        },
      ],
    };
  });

  if (scenes.length === 0) throw new Error("台本から場面を作れませんでした。台本の形式をご確認ください。");

  const res = UrlFetchApp.fetch("https://api.json2video.com/v2/movies", {
    method: "post",
    contentType: "application/json",
    headers: { "x-api-key": apiKey },
    payload: JSON.stringify({ resolution: resolution, quality: "high", scenes: scenes }),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code !== 200 && code !== 201) throw new Error("動画APIエラー " + code + "：" + text.slice(0, 250));

  const data = JSON.parse(text);
  const pid = data.project || (data.movie && data.movie.project) || data.id;
  if (!pid) throw new Error("プロジェクトIDが返りませんでした：" + text.slice(0, 200));
  return pid;
}

/** レンダリング中の動画が仕上がっていないか確認します */
function checkRenders() {
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty("VIDEO_KEY");
  const notify = notifyEmail();
  if (!key) return;

  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ジョブ");
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][6] !== "レンダリング中") continue;
    const memo = String(rows[i][11] || "");
    if (memo.indexOf("PROJECT:") !== 0) continue;
    const pid = memo.replace("PROJECT:", "").trim();

    try {
      const res = UrlFetchApp.fetch("https://api.json2video.com/v2/movies?project=" + encodeURIComponent(pid), {
        method: "get",
        headers: { "x-api-key": key },
        muteHttpExceptions: true,
      });
      const data = JSON.parse(res.getContentText());
      const movie = data.movie || data;
      const status = String(movie.status || "");

      if (status === "done" && movie.url) {
        sh.getRange(i + 1, 7).setValue("完了");
        sh.getRange(i + 1, 10).setValue(new Date());
        sh.getRange(i + 1, 12).setValue("動画：" + movie.url);
        MailApp.sendEmail({
          to: String(rows[i][10] || "") || notify,
          cc: rows[i][10] ? notify : "",
          subject: "【SASHIWA】動画が完成しました（" + rows[i][3] + "）",
          body: "動画の書き出しが完了しました。\n\n▼ 動画\n" + movie.url +
            "\n\n▼ 台本\n" + String(rows[i][8] || "") +
            "\n\n※公開前に、内容と音源のライセンスをご確認ください。\n",
        });
      } else if (status === "error") {
        sh.getRange(i + 1, 7).setValue("エラー");
        sh.getRange(i + 1, 12).setValue("動画エラー：" + String(movie.message || "").slice(0, 200));
        if (notify) MailApp.sendEmail(notify, "【SASHIWA】動画の書き出しでエラー", String(movie.message || ""));
      }
    } catch (err) {
      sh.getRange(i + 1, 7).setValue("エラー");
      sh.getRange(i + 1, 12).setValue(String(err).slice(0, 200));
    }
    return; // 1回につき1件
  }
}

/** 文章をGoogleドキュメントにして共有リンクを返します */
function makeDoc(title, account, text) {
  const doc = DocumentApp.create(title);
  const b = doc.getBody();
  b.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  b.appendParagraph("作成日時：" + fmt(new Date(), true));
  b.appendParagraph("投稿先：" + account);
  b.appendHorizontalRule();
  String(text).split("\n").forEach(function (line) { b.appendParagraph(line); });
  b.appendHorizontalRule();
  b.appendParagraph(
    "※本成果物はAIが生成したものです。内容の正確性を保証するものではありません。公開前に必ずご確認ください。"
  ).setItalic(true);
  doc.saveAndClose();
  DriveApp.getFileById(doc.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return doc.getUrl();
}

/* ========================= 画像の生成 ================================= */

/**
 * OpenAI の画像APIで画像を作り、Googleドライブに保存して共有リンクを返します。
 */
function generateImage(apiKey, instruction, account, aiPrompt) {
  const desc = pick(instruction, "描画内容") || pick(instruction, "内容") || "抽象的なビジネスイメージ";
  const style = pick(instruction, "画像スタイル") || "写真風";
  const ratio = pick(instruction, "比率") || pick(instruction, "縦横比") || "1:1";

  let size = "1024x1024";
  if (ratio.indexOf("9:16") >= 0 || ratio.indexOf("4:5") >= 0) size = "1024x1536";
  else if (ratio.indexOf("16:9") >= 0) size = "1536x1024";

  const base =
    aiPrompt && String(aiPrompt).length > 30
      ? String(aiPrompt)
      : desc + "。スタイル：" + style + "。";

  const prompt =
    base +
    " No text, no letters, no logos, no watermarks. " +
    "Do not depict real people, existing characters, brand marks or trademarks. " +
    "Do not imitate any existing artwork.";

  const res = UrlFetchApp.fetch("https://api.openai.com/v1/images/generations", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + apiKey },
    payload: JSON.stringify({ model: "gpt-image-1", prompt: prompt, size: size, n: 1 }),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code !== 200) throw new Error("画像APIエラー " + code + "：" + text.slice(0, 250));

  const data = JSON.parse(text);
  const item = data.data && data.data[0];
  if (!item) throw new Error("画像が返りませんでした：" + text.slice(0, 200));

  let blob;
  if (item.b64_json) {
    blob = Utilities.newBlob(Utilities.base64Decode(item.b64_json), "image/png");
  } else if (item.url) {
    blob = UrlFetchApp.fetch(item.url).getBlob();
  } else {
    throw new Error("画像データの形式が不明です。");
  }

  blob.setName("SASHIWA_画像_" + account + "_" + fmt(new Date()) + ".png");
  const file = DriveApp.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

/* ========================= ④ 予約投稿の配信 =========================== */

/**
 * 予約時刻が来た投稿を処理します。
 *
 * 【動作】
 *   X（旧Twitter）… setupX でキーを登録済みなら、実際に自動投稿します。
 *   その他の媒体   … 完成した投稿文をメールで届けます（貼り付けるだけの状態）。
 */
function runSchedule() {
  const props = PropertiesService.getScriptProperties();
  const notify = notifyEmail();

  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("投稿キュー");
  const rows = sh.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][7] !== "予約") continue;
    const at = new Date(rows[i][1]);
    if (isNaN(at.getTime()) || at > now) continue;

    const acct = rows[i][2];
    const media = rows[i][3];
    const body = String(rows[i][4]);
    const repeat = String(rows[i][6] || "なし");

    try {
      const posted = postToPlatform(media, acct, body);

      const link = intentUrl(media, body);
      MailApp.sendEmail({
        to: notify,
        subject: "【SASHIWA】投稿の時間です：" + acct + "（" + media + "）",
        body:
          (posted
            ? "自動投稿を実行しました。\n\n"
            : link
            ? "▼ このリンクを開くと、本文が入力された状態で投稿画面が開きます\n" + link + "\n\n"
            : "下記をコピーして投稿してください。\n\n") +
          "───── 投稿本文 ─────\n" +
          body +
          "\n──────────────\n\n" +
          "アカウント：" + acct + "\n" +
          "媒体：" + media + "\n" +
          "予定時刻：" + fmt(at, true) + "\n",
      });

      if (repeat === "なし") {
        sh.getRange(i + 1, 8).setValue(posted ? "投稿済み" : "配信済み");
      } else {
        const next = new Date(at.getTime());
        if (repeat === "毎日") next.setDate(next.getDate() + 1);
        else if (repeat === "平日のみ") {
          do { next.setDate(next.getDate() + 1); } while (next.getDay() === 0 || next.getDay() === 6);
        } else if (repeat === "毎週") next.setDate(next.getDate() + 7);
        sh.getRange(i + 1, 2).setValue(next);
      }
      sh.getRange(i + 1, 9).setValue(new Date());
    } catch (err) {
      sh.getRange(i + 1, 8).setValue("エラー");
      MailApp.sendEmail(notify, "【SASHIWA】予約投稿でエラー", String(err));
    }

    return; // 1回につき1件
  }
}

/**
 * 各SNSへの直接投稿。
 * API申請とトークン取得が済んだら、ここに実装してください。
 * 実装するまでは false を返し、メールでの下書き配信のみになります。
 *
 * 例（Xの場合）：
 *   const token = PropertiesService.getScriptProperties().getProperty("X_BEARER");
 *   UrlFetchApp.fetch("https://api.twitter.com/2/tweets", {
 *     method: "post", contentType: "application/json",
 *     headers: { Authorization: "Bearer " + token },
 *     payload: JSON.stringify({ text: body })
 *   });
 *   return true;
 */
function postToPlatform(media, account, body) {
  const m = String(media || "");
  if (m.indexOf("X") === 0 || m.indexOf("Twitter") >= 0 || m.indexOf("ツイッター") >= 0) {
    return postToX(body);
  }
  // 他の媒体はメールでの下書き配信のみ（API申請が済んだらここに追加します）
  return false;
}

/* ========================= X（旧Twitter）への投稿 ===================== */

/**
 * Xの開発者ポータルで発行した4つの値を使って投稿します。
 * 設定は setupX() を実行してください。
 * キーが未登録の場合は false を返し、メールでの下書き配信になります。
 */
function postToX(text) {
  const c = xCreds();
  if (!c) return false;
  const res = xFetch("POST", "https://api.twitter.com/2/tweets", c, JSON.stringify({ text: String(text) }));
  const code = res.getResponseCode();
  if (code === 200 || code === 201) return true;
  throw new Error(xExplain(code, res.getContentText()));
}

function xCreds() {
  const p = PropertiesService.getScriptProperties();
  const c = {
    ck: p.getProperty("X_CONSUMER_KEY"),
    cs: p.getProperty("X_CONSUMER_SECRET"),
    at: p.getProperty("X_ACCESS_TOKEN"),
    as: p.getProperty("X_ACCESS_SECRET"),
  };
  return c.ck && c.cs && c.at && c.as ? c : null;
}

/** RFC3986のパーセントエンコード（OAuth署名に必要です） */
function enc(v) {
  return encodeURIComponent(String(v))
    .replace(/\!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

/** OAuth 1.0a で署名したリクエストを送ります */
function xFetch(method, url, c, payload) {
  const oauth = {
    oauth_consumer_key: c.ck,
    oauth_nonce: Utilities.getUuid().replace(/-/g, ""),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: c.at,
    oauth_version: "1.0",
  };
  const keys = Object.keys(oauth).sort();
  const paramStr = keys.map(function (k) { return enc(k) + "=" + enc(oauth[k]); }).join("&");
  const baseStr = method + "&" + enc(url) + "&" + enc(paramStr);
  const signKey = enc(c.cs) + "&" + enc(c.as);
  oauth.oauth_signature = Utilities.base64Encode(
    Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_1, baseStr, signKey)
  );
  const header =
    "OAuth " +
    Object.keys(oauth).sort().map(function (k) { return enc(k) + '="' + enc(oauth[k]) + '"'; }).join(", ");

  const opt = { method: method.toLowerCase(), headers: { Authorization: header }, muteHttpExceptions: true };
  if (payload) {
    opt.contentType = "application/json";
    opt.payload = payload;
  }
  return UrlFetchApp.fetch(url, opt);
}

/** エラーコードを日本語で説明します */
function xExplain(code, body) {
  if (code === 401) {
    return "X投稿エラー 401：認証に失敗しました。よくある原因は" +
      "「App permissions を Read and write に変えたあとで、トークンを再発行していない」です。" +
      "開発者ポータルで Access Token を Regenerate して、setupX をやり直してください。";
  }
  if (code === 403) {
    return "X投稿エラー 403：権限が足りないか、同じ文面を重複投稿しています。" +
      "App permissions が Read only のままでないかご確認ください。（詳細：" + String(body).slice(0, 150) + "）";
  }
  if (code === 429) {
    return "X投稿エラー 429：投稿数の上限に達しました。時間をおいて再実行してください。";
  }
  return "X投稿エラー " + code + "：" + String(body).slice(0, 250);
}

/**
 * Xの設定を診断します。投稿はしません。安心して実行できます。
 */
function checkX() {
  const ui = SpreadsheetApp.getUi();
  const c = xCreds();
  if (!c) {
    ui.alert("Xのキーが未登録です。\n\nsetupX を実行して、4つの値を登録してください。");
    return;
  }
  const res = xFetch("GET", "https://api.twitter.com/2/users/me", c, null);
  const code = res.getResponseCode();
  if (code === 200) {
    let name = "";
    try {
      const d = JSON.parse(res.getContentText());
      name = (d.data && (d.data.username || d.data.name)) || "";
    } catch (e) {}
    ui.alert(
      "接続できました。\n\n" +
        "  アカウント：" + (name ? "@" + name : "取得済み") + "\n\n" +
        "投稿できるかどうかは testX で確認できます（実際に投稿されます）。"
    );
  } else {
    ui.alert("接続できませんでした。\n\n" + xExplain(code, res.getContentText()));
  }
}

/**
 * Xへの自動投稿を設定します。開発者ポータルの「Keys and tokens」で
 * 4つの値を発行してから、この関数を実行してください。
 */
function setupX() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt(
    "Xへの自動投稿を設定",
    "X開発者ポータルの「Keys and tokens」で発行した4つの値を、\n" +
      "この順番でカンマ区切りで貼り付けてください。\n\n" +
      "  API Key , API Key Secret , Access Token , Access Token Secret\n\n" +
      "※Access Token には「Read and Write」の権限が必要です。",
    ui.ButtonSet.OK_CANCEL
  );
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const v = r.getResponseText().split(",").map(function (x) { return x.trim(); });
  if (v.length !== 4 || v.some(function (x) { return !x; })) {
    ui.alert("4つの値がそろっていません。カンマで区切って、もう一度実行してください。");
    return;
  }
  const p = PropertiesService.getScriptProperties();
  p.setProperty("X_CONSUMER_KEY", v[0]);
  p.setProperty("X_CONSUMER_SECRET", v[1]);
  p.setProperty("X_ACCESS_TOKEN", v[2]);
  p.setProperty("X_ACCESS_SECRET", v[3]);
  ui.alert(
    "登録しました。\n\n" +
      "testX を実行すると、テスト投稿が実際にXへ送信されます。\n" +
      "投稿されたくない場合は実行しないでください。"
  );
}

/** 実際にテスト投稿します（本当に投稿されます） */
function testX() {
  const ui = SpreadsheetApp.getUi();
  const ok = ui.alert(
    "テスト投稿",
    "実際にXへ投稿します。よろしいですか？",
    ui.ButtonSet.OK_CANCEL
  );
  if (ok !== ui.Button.OK) return;
  try {
    const done = postToX("SASHIWAの自動投稿テストです。" + fmt(new Date(), true));
    ui.alert(done ? "投稿しました。Xでご確認ください。" : "キーが未登録です。setupX を先に実行してください。");
  } catch (e) {
    ui.alert("失敗しました。\n\n" + String(e));
  }
}

/* ========================= ⑤ 補助 ==================================== */

/** その場で投稿画面を開けるリンクを作ります（API設定が不要な投稿手段） */
function intentUrl(media, body) {
  const t = encodeURIComponent(String(body));
  const m = String(media || "");
  if (m.indexOf("X") === 0 || m.indexOf("Twitter") >= 0) return "https://x.com/intent/post?text=" + t;
  if (m.indexOf("Threads") >= 0) return "https://www.threads.net/intent/post?text=" + t;
  return "";
}

function fmt(d, withTime) {
  const p = function (n) { return ("0" + n).slice(-2); };
  const s = d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  return withTime ? s + " " + p(d.getHours()) + ":" + p(d.getMinutes()) : s;
}

/** 動作確認用。手動で実行すると、テストのジョブを1件流します。 */
function testRun() {
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ジョブ").appendRow([
    "TEST" + new Date().getTime(),
    new Date(),
    "コンテンツ",
    "テストアカウント",
    "自社",
    "X（旧Twitter）",
    "受付",
    "【媒体】X（旧Twitter）／【形式】単発投稿／【文字数上限】140／【テーマ】AI社員に問い合わせ対応を任せた結果／【トーン】丁寧・ですます／【案数】3案",
    "", "", "",
  ]);
  processJobs();
  SpreadsheetApp.getUi().alert("テストを実行しました。「ジョブ」シートの状態欄をご確認ください。");
}
