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

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  ★ ここにキーを貼り付けてください（これだけで動きます）           ║
   ╚══════════════════════════════════════════════════════════════════╝

   Difyでアプリを開き、左メニュー「アクセスAPI」→「APIキー」で発行できます。
   app- で始まる文字列を、下の "" の中に貼り付けて保存してください。

   ※必須は KEY_CREATIVE の1つだけです。他は空欄のままで動きます。
   ※このコードはご自身のGoogleアカウント内にあり、外部には公開されません。
     ただし、キーを貼ったあとのコードは他人に共有しないでください。
*/

const KEY_CREATIVE = "";  // 【必須】Creative_PR_AI のAPIキー（app-...）
const KEY_QA       = "";  // 【任意】QA_Ethics_AI のAPIキー（検査工程を入れる場合）
const KEY_OPENAI   = "";  // 【任意】OpenAI のAPIキー（画像を作る場合／sk-...）
const KEY_VIDEO    = "";  // 【任意】JSON2Video のAPIキー（動画を作る場合）

/* ══════════════════════════════════════════════════════════════════ */

/* このスクリプトのバージョン。ダッシュボードが古いデプロイを検知するのに使います。 */
const SASHIWA_VERSION = "3.0";

/* 通知先が取得できなかった場合の宛先。必要に応じて書き換えてください。 */
const DEFAULT_NOTIFY = "sashiwa0713naoto@gmail.com";

/**
 * APIキーを取得します。
 * 上の貼り付け欄を最優先し、無ければスクリプトプロパティを見ます。
 */
function getKey(propName, pasted) {
  const v = String(pasted || "").trim();
  if (v) return v;
  return PropertiesService.getScriptProperties().getProperty(propName) || "";
}

function creativeKey() { return getKey("DIFY_CREATIVE_KEY", KEY_CREATIVE); }
function qaKey()       { return getKey("DIFY_QA_KEY", KEY_QA); }
function openaiKey()   { return getKey("OPENAI_KEY", KEY_OPENAI); }
function videoKey()    { return getKey("VIDEO_KEY", KEY_VIDEO); }

/** 通知先メールアドレスを返します（設定 → ログイン中のアカウント → 既定値の順） */
function notifyEmail() {
  const p = PropertiesService.getScriptProperties().getProperty("NOTIFY_EMAIL");
  if (p) return p;
  let me = "";
  try { me = Session.getActiveUser().getEmail() || ""; } catch (e) {}
  return me || DEFAULT_NOTIFY;
}

/** シートが無ければ作ります（doPostからも呼びます） */
/** トリガーが無ければ自動で登録します（設定漏れの自己修復） */
function ensureTriggers() {
  try {
    const has = ScriptApp.getProjectTriggers().some(function (t) {
      return t.getHandlerFunction() === "processJobs";
    });
    if (!has) installTriggers();
  } catch (e) {}
}

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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();

  // 1) シートを用意
  ensureSheets();

  // 2) 貼り付け欄のキーをスクリプトプロパティにも保存します
  if (KEY_CREATIVE) props.setProperty("DIFY_CREATIVE_KEY", KEY_CREATIVE.trim());
  if (KEY_QA) props.setProperty("DIFY_QA_KEY", KEY_QA.trim());
  if (KEY_OPENAI) props.setProperty("OPENAI_KEY", KEY_OPENAI.trim());
  if (KEY_VIDEO) props.setProperty("VIDEO_KEY", KEY_VIDEO.trim());

  // 3) 通知先
  if (!props.getProperty("NOTIFY_EMAIL")) {
    let me = "";
    try { me = Session.getActiveUser().getEmail() || ""; } catch (e) {}
    props.setProperty("NOTIFY_EMAIL", me || DEFAULT_NOTIFY);
  }

  // 4) トリガー
  installTriggers();

  const c = creativeKey();
  let msg = "";
  if (!c) {
    msg =
      "あと1ステップです。\n\n" +
      "このコードの冒頭にある\n" +
      "    const KEY_CREATIVE = \"\";\n" +
      "の \"\" の中に、Dify の Creative_PR_AI のAPIキー\n" +
      "（app- で始まる文字列）を貼り付けて保存してください。\n\n" +
      "キーの場所：Dify → Creative_PR_AI を開く →\n" +
      "        左メニュー「アクセスAPI」→「APIキー」→ 作成\n\n" +
      "貼り付けたら、もう一度 setup を実行してください。";
  } else if (c.indexOf("app-") !== 0) {
    msg =
      "キーの形式が違うようです。\n\n" +
      "Dify のAPIキーは app- で始まります。\n" +
      "アプリ内の「アクセスAPI」から発行したキーを貼り付けてください。\n\n" +
      "（現在の値の先頭：" + c.slice(0, 8) + "...）";
  } else {
    msg =
      "セットアップが完了しました。\n\n" +
      "  制作キー：登録済み\n" +
      "  検査キー：" + (qaKey() ? "登録済み" : "未登録（任意）") + "\n" +
      "  画像キー：" + (openaiKey() ? "登録済み" : "未登録（任意）") + "\n" +
      "  動画キー：" + (videoKey() ? "登録済み" : "未登録（任意）") + "\n" +
      "  通知先：" + notifyEmail() + "\n" +
      "  自動実行：5分ごと（制作）／15分ごと（予約配信）\n\n" +
      "【残り1ステップ】\n" +
      "右上「デプロイ」→「デプロイを管理」→ 鉛筆アイコン →\n" +
      "バージョンを「新バージョン」にして「デプロイ」。\n\n" +
      "そのあと 今すぐ処理 を実行すると、溜まっている依頼が処理されます。";
  }
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    Logger.log(msg);
  }
}

/** キーが正しく読めているかだけを確認します */
function キー確認() {
  const c = creativeKey();
  const msg =
    "APIキーの状態\n────────────────\n" +
    "  制作（必須）：" + (c ? (c.indexOf("app-") === 0 ? "OK（" + c.slice(0, 8) + "...）" : "形式が違います") : "未登録") + "\n" +
    "  検査（任意）：" + (qaKey() ? "OK" : "未登録") + "\n" +
    "  画像（任意）：" + (openaiKey() ? "OK" : "未登録") + "\n" +
    "  動画（任意）：" + (videoKey() ? "OK" : "未登録") + "\n\n" +
    (c ? "設定できています。デプロイを更新してください。" :
      "コード冒頭の KEY_CREATIVE = \"\" にキーを貼って保存してください。");
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
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

/**
 * 失敗した依頼を、もう一度処理できる状態に戻します。
 * キーを入れ直したあとや、一時的な失敗のあとに実行してください。
 */
function 再実行() {
  const n = retryFailed();
  const msg = n > 0
    ? n + " 件を再実行の対象に戻しました。\n\n続けて 今すぐ処理 を実行してください。"
    : "再実行が必要な依頼はありませんでした。";
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
}

function retryFailed() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ジョブ");
  if (!sh || sh.getLastRow() < 2) return 0;
  const rows = sh.getDataRange().getValues();
  let n = 0;
  for (let i = 1; i < rows.length; i++) {
    const st = String(rows[i][6] || "");
    if (st === "エラー" || st === "保留" || st === "制作中") {
      sh.getRange(i + 1, 7).setValue("受付");
      sh.getRange(i + 1, 12).setValue("");
      n++;
    }
  }
  return n;
}

/**
 * Difyに実際につないで、返ってくる内容をそのまま表示します。
 * 生成されない原因を突き止めるときは、まずこれを実行してください。
 */
function Difyテスト() {
  const key = creativeKey();
  if (!key) {
    try { SpreadsheetApp.getUi().alert("KEY_CREATIVE が空です。コード冒頭にキーを貼り付けてください。"); } catch (e) {}
    return;
  }
  const t0 = Date.now();
  let msg = "";
  try {
    const res = UrlFetchApp.fetch("https://api.dify.ai/v1/chat-messages", {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + key },
      payload: JSON.stringify({
        inputs: { task_description: "テストです。「こんにちは」とだけ返してください。" },
        query: "テストです。「こんにちは」とだけ返してください。",
        response_mode: "blocking",
        user: "sashiwa-test",
      }),
      muteHttpExceptions: true,
    });
    const sec = Math.round((Date.now() - t0) / 1000);
    const code = res.getResponseCode();
    const text = res.getContentText();
    let answer = "";
    try { answer = JSON.parse(text).answer || ""; } catch (e) {}
    msg =
      "Difyへの接続テスト\n────────────────\n" +
      "  応答コード：" + code + "\n" +
      "  所要時間：" + sec + " 秒" + (sec > 45 ? "  ← 60秒に近く危険です" : "") + "\n\n" +
      (code === 200
        ? "返ってきた内容：\n" + String(answer || text).slice(0, 400)
        : explainError(String(code) + " " + text));
    if (sec > 45) {
      msg +=
        "\n\n▲ 応答が遅すぎます。Dify で Creative_PR_AI のモデルを" +
        "gpt-4o-mini などの速いものに変えるか、Reasoning Effort を low にしてください。";
    }
  } catch (err) {
    const sec = Math.round((Date.now() - t0) / 1000);
    msg = "接続に失敗しました（" + sec + "秒）\n\n" + explainError(String(err));
  }
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
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

/* ========================= 進捗メール ================================= */

/**
 * 進捗を都度メールでお知らせします。
 * 自分（NOTIFY_EMAIL）には全工程、お客様には節目だけを送ります。
 * お客様への進捗連絡を止めたい場合は、スクリプトプロパティに
 * CLIENT_PROGRESS = off を設定してください。
 */
function notifyStep(step, info) {
  const me = notifyEmail();
  const client = String(info.clientEmail || "").trim();
  const toClient =
    client &&
    client.indexOf("@") > 0 &&
    client !== me &&
    PropertiesService.getScriptProperties().getProperty("CLIENT_PROGRESS") !== "off";

  const acct = info.account || "-";
  const kind = info.kind || "制作物";
  const id = info.jobId || "";

  const T = {
    received: {
      subject: "【SASHIWA】ご依頼を受け付けました（" + kind + "）",
      client:
        "ご依頼を受け付けました。\n\n" +
        "　内容：" + kind + "\n" +
        "　対象：" + acct + "\n" +
        "　受付番号：" + id + "\n\n" +
        "AIエージェントが順に処理いたします。完成しましたら、改めてご連絡いたします。\n",
      own:
        "新しい依頼を受け付けました。\n\n　種別：" + kind + "\n　対象：" + acct +
        "\n　受付番号：" + id + "\n　依頼元：" + (info.owner || "-") + "\n",
      clientOk: true,
    },
    start: {
      subject: "【SASHIWA】制作を開始しました（" + kind + "）",
      client:
        "制作を開始しました。\n\n" +
        "　内容：" + kind + "\n" +
        "　対象：" + acct + "\n" +
        "　受付番号：" + id + "\n\n" +
        "完成まで数分お待ちください。\n",
      own: "制作を開始しました。\n\n　受付番号：" + id + "\n　種別：" + kind + "\n",
      clientOk: true,
    },
    qa: {
      subject: "【SASHIWA】検査工程に入りました（" + id + "）",
      own:
        "本文の生成が完了し、品質・倫理の検査に入りました。\n\n　受付番号：" + id +
        "\n　文字数：" + (info.length || "-") + "\n",
      clientOk: false,
    },
    done: {
      subject: "【SASHIWA】" + kind + "が完成しました（" + acct + "）",
      client:
        "ご依頼の" + kind + "が完成しました。\n\n" +
        "▼ 成果物\n" + (info.url || "") + "\n\n" +
        "　対象：" + acct + "\n" +
        "　受付番号：" + id + "\n\n" +
        "内容をご確認のうえ、ご不明な点がございましたら本メールにご返信ください。\n\n" +
        "──────────────\n株式会社SASHIWA\nhttps://sashiwa-inc.vercel.app\n──────────────\n",
      own:
        "納品しました。\n\n　受付番号：" + id + "\n　種別：" + kind + "\n　対象：" + acct +
        "\n\n▼ 成果物\n" + (info.url || "") + "\n",
      clientOk: true,
    },
    error: {
      subject: "【SASHIWA】処理でエラーが発生しました（" + id + "）",
      own:
        "処理中にエラーが発生しました。\n\n　受付番号：" + id + "\n　種別：" + kind +
        "\n　内容：" + (info.error || "") + "\n\n" +
        "スプレッドシートの「ジョブ」シートで状態をご確認ください。\n",
      clientOk: false,
    },
  };

  const t = T[step];
  if (!t) return;
  try {
    if (t.own) MailApp.sendEmail(me, t.subject, t.own);
    if (t.clientOk && toClient && t.client) MailApp.sendEmail(client, t.subject, t.client);
  } catch (e) {
    /* メール送信に失敗しても処理は続けます */
  }
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
      notifyStep("received", { jobId: jobId, kind: kind, account: acct, owner: owner, clientEmail: String(body.client_email || "") });
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
        "",
      ]);

      // 進捗①：受付のご連絡
      if (kind !== "問い合わせ") {
        notifyProgress("受付", {
          jobId: jobId,
          kind: kind,
          acct: acct,
          media: media,
          to: String(body.client_email || ""),
        });
      }
    }

    // トリガーが無いと永久に処理されないため、その場で用意します
    ensureTriggers();
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
    if (action === "retry") {
      const n = retryFailed();
      processJobs();
      return json({ ok: true, retried: n, diag: diagnose() });
    }
    if (action === "run") {
      // ダッシュボードから「今すぐ処理」を押したとき
      ensureTriggers();
      processJobs();
      return json({ ok: true, ran: true, diag: diagnose() });
    }
    if (action === "retry") {
      const n = retryFailed();
      processJobs();
      return json({ ok: true, retried: n, diag: diagnose() });
    }
    if (action === "run") {
      ensureTriggers();
      const lock = LockService.getScriptLock();
      if (!lock.tryLock(1000)) return json({ ok: true, skipped: "既に処理中です" });
      try {
        processJobs();
      } finally {
        lock.releaseLock();
      }
      return json({ ok: true, ran: true, diag: diagnose() });
    }
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
      if (st === "受付" || st === "制作中" || st === "エラー" || st === "保留") {
        waiting.push({ id: String(rows[i][0]), 状態: st, 備考: String(rows[i][11] || rows[i][8] || "").slice(0, 200) });
      }
    }
  }
  return {
    version: SASHIWA_VERSION,
    シート: { ジョブ: !!jobs, 投稿キュー: !!queue, 件数: jobs ? Math.max(0, jobs.getLastRow() - 1) : 0 },
    キー: {
      制作: !!creativeKey(),
      検査: !!qaKey(),
      画像: !!openaiKey(),
      動画: !!videoKey(),
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

/**
 * 進捗のご連絡を送ります。受付 → 制作中 → 完了 の3段階です。
 * お客様案件（納品先メールあり）は、受付と完了をお客様にもお送りします。
 */
function notifyProgress(stage, o) {
  const notify = notifyEmail();
  const to = String(o.to || "");
  const toClient = to.indexOf("@") > 0 && to.indexOf("sashiwa.local") < 0 ? to : "";
  const label = o.acct && o.acct !== "-" ? "（" + o.acct + "）" : "";
  const foot = "\n──────────────\n株式会社SASHIWA\nhttps://sashiwa-inc.vercel.app\n";

  const M = {};
  M["受付"] = {
    s: "【SASHIWA】ご依頼を受け付けました" + label,
    b:
      "ご依頼を受け付けました。\n\n" +
      "  種別：" + (o.kind || "") + "\n" +
      (o.media && o.media !== "-" ? "  媒体：" + o.media + "\n" : "") +
      "  受付番号：" + o.jobId + "\n\n" +
      "これより担当のAIエージェントが制作に入ります。\n" +
      "完成しましたら、あらためてご連絡いたします。\n",
  };
  M["制作中"] = {
    s: "【SASHIWA】制作を開始しました" + label,
    b:
      "担当のAIエージェントが制作を開始しました。\n\n" +
      "  種別：" + (o.kind || "") + "\n" +
      "  受付番号：" + o.jobId + "\n\n" +
      "制作後、品質・倫理の検査を通してからお届けします。\n",
  };
  M["完了"] = {
    s: "【SASHIWA】" + (o.kind || "成果物") + "が完成しました" + label,
    b:
      (o.kind || "成果物") + "が完成しました。\n\n" +
      "▼ 成果物\n" + (o.url || "") + "\n\n" +
      "  受付番号：" + o.jobId + "\n\n" +
      "内容についてご要望がございましたら、本メールにご返信ください。\n",
  };
  M["エラー"] = {
    s: "【SASHIWA】処理でエラーが発生しました" + label,
    b:
      "処理中にエラーが発生しました。\n\n" +
      "  受付番号：" + o.jobId + "\n" +
      "  内容：" + (o.error || "") + "\n",
  };

  const m = M[stage];
  if (!m) return;

  try {
    MailApp.sendEmail({ to: notify, subject: m.s, body: m.b + foot });
    if (toClient && (stage === "受付" || stage === "完了")) {
      MailApp.sendEmail({ to: toClient, cc: notify, subject: m.s, body: m.b + foot });
    }
  } catch (e) {
    /* メールが送れなくても処理は止めません */
  }
}

/** よくある失敗を、対処法つきの日本語に変換します */
function explainError(raw) {
  const t = String(raw);
  if (/Timeout|timed out|タイムアウト|DEADLINE|Address unavailable|Exceeded maximum execution/i.test(t)) {
    return (
      "Difyの応答が時間内に返りませんでした。Apps Scriptの通信は約60秒で打ち切られます。" +
      "Dify側で Creative_PR_AI のモデルを軽いもの（gpt-4o-mini など）に変えるか、" +
      "Reasoning Effort を low に下げてください。／原文：" + t.slice(0, 150)
    );
  }
  if (/401|Unauthorized|invalid.*key/i.test(t)) {
    return "DifyのAPIキーが正しくありません。アプリの「アクセスAPI」で発行し直して、KEY_CREATIVE に貼り直してください。／原文：" + t.slice(0, 150);
  }
  if (/400/.test(t)) {
    return (
      "Difyが入力を受け付けませんでした。アプリの入力変数名が task_description になっているか、" +
      "必須変数が他にないかをご確認ください。／原文：" + t.slice(0, 200)
    );
  }
  if (/404/.test(t)) {
    return "Difyのアプリが見つかりません。キーが別のアプリのものである可能性があります。／原文：" + t.slice(0, 150);
  }
  if (/429|quota|credit/i.test(t)) {
    return "Difyの利用上限に達しています。Dify側でご自身のモデルAPIキーが設定されているかご確認ください。／原文：" + t.slice(0, 150);
  }
  return t;
}

/* ========================= ③ 制作の実行 =============================== */

function processJobs() {
  const props = PropertiesService.getScriptProperties();
  const cKey = creativeKey();
  const qKey = qaKey();
  const notify = notifyEmail();
  if (!cKey) {
    // キーが未登録のときは「保留」にします。キーを入れれば自動で再開します。
    const sh0 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ジョブ");
    if (sh0) {
      const rr = sh0.getDataRange().getValues();
      for (let k = 1; k < rr.length; k++) {
        if (rr[k][6] === "受付") {
          sh0.getRange(k + 1, 7).setValue("保留");
          sh0.getRange(k + 1, 12).setValue(
            "Difyの制作キーが未登録です。Apps Scriptの冒頭にある KEY_CREATIVE = \"\" の中に、" +
              "Creative_PR_AI のAPIキー（app-...）を貼り付けて保存してください。"
          );
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
    const st0 = String(rows[i][6] || "");
    if (st0 !== "受付" && st0 !== "保留") continue;

    // 同時に走らないよう、先に印を付ける
    sh.getRange(i + 1, 7).setValue("制作中");
    SpreadsheetApp.flush();

    const jobId = rows[i][0];
    const kind = rows[i][2];
    const acct = rows[i][3];
    const instruction = String(rows[i][7]);
    const clientEmail = String(rows[i][10] || "");
    const ctx = { jobId: jobId, kind: kind, account: acct, clientEmail: clientEmail };
    notifyStep("start", ctx);

    try {
      // 種別が「画像」なら、画像生成のルートへ
      if (kind === "画像") {
        const imgKey = openaiKey();
        if (!imgKey) throw new Error("画像生成にはOpenAIのAPIキーが必要です。setup を実行して登録してください。");
        // まず制作担当に、画像生成向けの詳しい英語プロンプトを作らせます
        let imgPrompt = "";
        try {
          imgPrompt = callDify(
            cKey,
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
        notifyStep("done", { jobId: jobId, kind: "画像", account: acct, clientEmail: clientEmail, url: url });
        return;
      }

      // 種別が「動画」なら、台本を作ってからレンダリングへ
      if (kind === "動画") {
        const script = callDify(cKey, instruction);
        const docUrl = makeDoc("SASHIWA_動画台本_" + acct + "_" + fmt(new Date()), acct, script);
        const vKey = videoKey();

        if (!vKey) {
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

        const projectId = submitRender(vKey, instruction, script);
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
          cKey,
          "あなたは構成設計の担当です。以下の条件で作る成果物の【構成案】だけを出してください。" +
            "本文は書かないでください。見出しの並び、各パートで何を言うか、冒頭のフック、" +
            "締めのCTAを箇条書きで示してください。\n\n--- 条件 ---\n" + instruction
        );
      }

      // 2) 制作
      const draft = callDify(
        cKey,
        instruction +
          (outline ? "\n\n--- 先に設計した構成（これに沿って書いてください）---\n" + outline : "") +
          "\n\n--- 出力ルール ---\n" +
          "・前置き、解説、「承知しました」等は一切書かず、成果物の本文だけを出力すること\n" +
          "・JSONやMarkdownの記号で包まず、そのまま貼り付けて使える日本語のテキストで出力すること\n" +
          "・複数案を求められている場合は【案1】【案2】…で区切ること\n" +
          "・指定された文字数上限を絶対に超えないこと"
      );

      // 3) 検査 → 差し戻しがあれば制作担当が修正します
      let checked = draft;
      let qaNote = "";
      if (qKey) {
        const qaPrompt =
          "次の成果物を検査してください。確認する観点は、事実として疑わしい記述、" +
          "薬機法・景品表示法に触れる表現、著作権や商標の侵害、指定文字数の超過です。\n\n" +
          "--- 制作条件 ---\n" + instruction +
          "\n\n--- 成果物 ---\n" + draft;
        let qaRaw = "";
        try { qaRaw = callDify(qKey, qaPrompt); } catch (e) { qaRaw = ""; }

        if (qaRaw) {
          const qa = readQaResult(qaRaw);
          if (qa.rejected && qa.feedback) {
            // 差し戻し。制作担当に直させます（これが最終稿になります）
            qaNote = qa.feedback;
            try {
              const fixed = callDify(
                cKey,
                "あなたが書いた原稿に、検査担当から修正の指示が届きました。\n" +
                  "指示にすべて従って書き直し、修正後の完成原稿だけを出力してください。\n" +
                  "講評、言い訳、前置き、「承知しました」などは一切書かないこと。\n" +
                  "JSONやコードブロックで包まず、そのまま投稿できる日本語のテキストで出力すること。\n" +
                  "複数案がある場合は【案1】【案2】…の区切りを保つこと。\n\n" +
                  "--- 制作条件 ---\n" + instruction +
                  "\n\n--- 検査担当からの指示 ---\n" + qa.feedback +
                  "\n\n--- 修正する原稿 ---\n" + draft
              );
              const f = readQaResult(fixed);
              if (!f.rejected && f.text && f.text.length > 30) checked = f.text;
            } catch (e) {
              /* 修正に失敗した場合は、元の原稿をそのまま使います */
            }
          } else if (qa.text && qa.text.length > 30) {
            checked = qa.text;
          }
        }
      }

      // 4) ドキュメント化（本文が先、制作メモは末尾）
      const url = makeDeliveryDoc(
        "SASHIWA_" + kind + "_" + acct + "_" + fmt(new Date()),
        acct,
        checked,
        { instruction: instruction, qaNote: qaNote }
      );

      // 4) 記録と通知
      sh.getRange(i + 1, 7).setValue("完了");
      sh.getRange(i + 1, 9).setValue(url);
      sh.getRange(i + 1, 10).setValue(new Date());

      notifyStep("done", { jobId: jobId, kind: kind, account: acct, clientEmail: clientEmail, url: url });
    } catch (err) {
      const em = explainError(String(err));
      sh.getRange(i + 1, 7).setValue("エラー");
      sh.getRange(i + 1, 12).setValue(em.slice(0, 400));
      notifyProgress("エラー", { jobId: jobId, kind: kind, acct: acct, error: em, to: "" });
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
    // feedback や status は講評なので、本文としては採用しません
    if (o.feedback && !o.report_body && !o.本文 && !o.output) return t;
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

/**
 * 検査担当の応答が「差し戻しの講評」かどうかを判定します。
 * 講評であれば {rejected:true, feedback:"..."} を返します。
 */
function readQaResult(raw) {
  const t = String(raw || "").trim();
  const m = t.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const o = JSON.parse(m[0]);
      const st = String(o.status || o.judgement || o.result || "").toUpperCase();
      const fb = o.feedback || o.comment || o.reason || o.issues || "";
      if (fb || st.indexOf("REJECT") >= 0 || st.indexOf("NG") >= 0) {
        return { rejected: st.indexOf("APPROV") < 0 && st.indexOf("OK") < 0, feedback: String(fb || t) };
      }
      const body = o.report_body || o.本文 || o.output || o.text || o.content || o.body;
      if (body && String(body).length > 20) return { rejected: false, text: String(body) };
    } catch (e) {
      /* JSONとして読めない場合は、下の判定へ */
    }
  }
  // 講評でよく使われる語が多い場合も、講評とみなします
  if (/修正してください|変更してください|差し戻|抵触|表現のため|へ変更/.test(t) && t.length < 3000) {
    return { rejected: true, feedback: t };
  }
  return { rejected: false, text: t };
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
  const key = videoKey();
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

/**
 * 納品用のドキュメントを作ります。
 * 冒頭に「そのまま投稿できる本文」、末尾に制作メモを置きます。
 */
function makeDeliveryDoc(title, account, body, meta) {
  const doc = DocumentApp.create(title);
  const b = doc.getBody();

  b.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  b.appendParagraph("作成日時：" + fmt(new Date(), true) + "／投稿先：" + account);
  b.appendHorizontalRule();

  b.appendParagraph("■ そのまま投稿できる本文").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  b.appendParagraph("下記をコピーして、そのままご使用いただけます。").setItalic(true);

  // 【案1】などで区切って読みやすくします
  const parts = String(body).split(/(?=【案\s*\d+】)/);
  parts.forEach(function (part, idx) {
    const t = part.trim();
    if (!t) return;
    if (idx > 0) b.appendHorizontalRule();
    t.split("\n").forEach(function (line) {
      const l = line.replace(/^\s*[#*`]+\s*/, "");
      if (/^【案\s*\d+】/.test(l.trim())) {
        b.appendParagraph(l.trim()).setHeading(DocumentApp.ParagraphHeading.HEADING3);
      } else {
        b.appendParagraph(l);
      }
    });
  });

  if (meta && (meta.qaNote || meta.instruction)) {
    b.appendPageBreak();
    b.appendParagraph("── 以下は制作メモです（投稿には使いません）──")
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    if (meta.qaNote) {
      b.appendParagraph("【検査担当からの指摘と、反映した内容】");
      String(meta.qaNote).split("\n").forEach(function (l) { b.appendParagraph(l); });
      b.appendParagraph("");
    }
    if (meta.instruction) {
      b.appendParagraph("【制作条件】");
      String(meta.instruction).split("／").forEach(function (l) { b.appendParagraph(l); });
    }
  }

  b.appendHorizontalRule();
  b.appendParagraph(
    "※本成果物はAIが生成したものです。内容の正確性を保証するものではありません。公開前に必ずご確認ください。"
  ).setItalic(true);

  doc.saveAndClose();
  DriveApp.getFileById(doc.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return doc.getUrl();
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
