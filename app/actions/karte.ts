"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, saveDb, uid, machineCode, UPLOAD_DIR } from "@/lib/karte/db";
import { createSession, destroySession, getCurrentUser } from "@/lib/karte/session";
import { classifyMemo, suggestTitleEn } from "@/lib/karte/classify";
import { computeGrade } from "@/lib/karte/grade";
import { detectAnomalies } from "@/lib/karte/anomaly";
import { addMonthsIso, todayIso } from "@/lib/karte/format";
import type {
  ChecklistItem,
  Machine,
  MachineCategory,
  MaintRecord,
  RecordType,
  SaleStatus,
} from "@/lib/karte/types";

// ---------------- 認証 ----------------

export async function login(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const loginId = String(formData.get("loginId") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const dest = String(formData.get("dest") ?? "console");
  const next = String(formData.get("next") ?? "");
  const db = getDb();
  const user = db.users.find((u) => u.loginId === loginId && u.password === password);
  if (!user) {
    return { error: "IDまたはパスワードが正しくありません。" };
  }
  await createSession(user.id);
  if (next.startsWith("/") && !next.startsWith("//")) redirect(next);
  redirect(dest === "m" ? "/m" : "/console");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

// ---------------- 機械 ----------------

export async function createMachine(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const maker = String(formData.get("maker") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  if (!name || !maker || !model) throw new Error("必須項目が未入力です。");

  const legalKind = String(formData.get("legalKind") ?? "");
  const machine: Machine = {
    id: uid("m"),
    companyId: user.companyId,
    code: machineCode(),
    name,
    nameEn: String(formData.get("nameEn") ?? "").trim() || name,
    category: (String(formData.get("category") ?? "その他") as MachineCategory),
    machineType: String(formData.get("machineType") ?? "").trim() || undefined,
    maker,
    makerEn: String(formData.get("makerEn") ?? "").trim() || maker,
    model,
    serialNo: String(formData.get("serialNo") ?? "").trim(),
    yearMade: Number(formData.get("yearMade") ?? new Date().getFullYear()),
    purchasedAt: String(formData.get("purchasedAt") ?? todayIso()),
    acquisition: formData.get("acquisition") === "used" ? "used" : "new",
    location: String(formData.get("location") ?? "").trim(),
    status: "active",
    ratedPower: String(formData.get("ratedPower") ?? "").trim() || undefined,
    legalPlan:
      legalKind === "press"
        ? { kind: "プレス機 定期自主検査", intervalMonths: 12, note: "労働安全衛生法第45条・年次。" }
        : legalKind === "haccp"
          ? { kind: "食品機械 衛生管理(HACCP)", intervalMonths: 1, note: "HACCPに基づく衛生管理計画。週次の洗浄・殺菌記録。" }
          : legalKind === "forklift"
            ? { kind: "フォークリフト 特定自主検査", intervalMonths: 12, note: "労働安全衛生法・年次。" }
            : undefined,
    docs: [],
    registeredAt: todayIso(),
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  };

  const db = getDb();
  db.machines.push(machine);
  saveDb();
  revalidatePath("/", "layout");
  redirect(`/console/machines/${machine.id}`);
}

// ---------------- 記録 ----------------

async function savePhotos(formData: FormData): Promise<string[]> {
  const db = getDb();
  const ids: string[] = [];
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files.slice(0, 6)) {
    if (file.size > 10 * 1024 * 1024) continue;
    const id = uid("f");
    const buf = Buffer.from(await file.arrayBuffer());
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOAD_DIR, id), buf);
    db.files.push({
      id,
      name: file.name,
      mime: file.type || "application/octet-stream",
      size: file.size,
      createdAt: new Date().toISOString(),
    });
    ids.push(id);
  }
  return ids;
}

export async function createRecord(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const machineId = String(formData.get("machineId") ?? "");
  const db = getDb();
  const machine = db.machines.find((m) => m.id === machineId && m.companyId === user.companyId);
  if (!machine) throw new Error("機械が見つかりません。");

  const memo = String(formData.get("memo") ?? "").trim();
  const typeInput = String(formData.get("type") ?? "auto");
  const auto = classifyMemo(memo);
  const type: RecordType = typeInput === "auto" ? auto.type : (typeInput as RecordType);
  const titleInput = String(formData.get("title") ?? "").trim();
  const title = titleInput || auto.title;
  const titleEn = suggestTitleEn(titleInput || memo, type);

  const checklist: ChecklistItem[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("check_")) {
      checklist.push({
        label: key.slice(6),
        result: value === "ok" ? "ok" : value === "ng" ? "ng" : "na",
      });
    }
  }

  // 訂正記録(追記専用設計): 訂正対象は自社の同一機械の記録に限る
  const correctionOfRaw = String(formData.get("correctionOf") ?? "");
  const correctionOf = db.records.some(
    (r) => r.id === correctionOfRaw && r.machineId === machine.id && r.companyId === user.companyId,
  )
    ? correctionOfRaw
    : undefined;

  // 撮影メタデータ(写真の真正性確保)
  const photoFileIds = await savePhotos(formData);
  const capturedAt = String(formData.get("capturedAt") ?? "");
  const geo = String(formData.get("geo") ?? "");
  const viaQr = formData.get("viaQr") === "1";
  const capture =
    photoFileIds.length > 0 && capturedAt
      ? { capturedAt, geo: geo || undefined, viaQr }
      : undefined;

  const costRaw = String(formData.get("cost") ?? "").replace(/[,¥\s]/g, "");
  // 記録日時はユーザー入力ではなくサーバー側で自動付与する(遡及登録の防止)
  const record: MaintRecord = {
    id: uid("r"),
    machineId: machine.id,
    companyId: user.companyId,
    userId: user.id,
    type,
    title,
    titleEn,
    memo,
    checklist: checklist.length > 0 ? checklist : undefined,
    photoFileIds,
    capture,
    cost: costRaw ? Number(costRaw) : undefined,
    vendor: String(formData.get("vendor") ?? "").trim() || undefined,
    workDate: todayIso(),
    createdAt: new Date().toISOString(),
    autoClassified: typeInput === "auto",
    correctionOf,
  };
  db.records.push(record);
  saveDb();
  revalidatePath("/", "layout");

  const from = String(formData.get("from") ?? "console");
  redirect(from === "m" ? `/m/machines/${machine.id}?recorded=1` : `/console/machines/${machine.id}`);
}

// ---------------- 履歴証明書 ----------------

export async function issueCertificate(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") throw new Error("証明書の発行は管理者のみ可能です。");

  const machineId = String(formData.get("machineId") ?? "");
  const withEnglish = formData.get("withEnglish") === "on";
  const db = getDb();
  const machine = db.machines.find((m) => m.id === machineId && m.companyId === user.companyId);
  if (!machine) throw new Error("機械が見つかりません。");

  const records = db.records
    .filter((r) => r.machineId === machine.id && r.companyId === user.companyId)
    .sort((a, b) => (a.workDate < b.workDate ? 1 : -1));

  const { grade, summary } = computeGrade(machine, records);
  const auditFlags = detectAnomalies(
    machine,
    records,
    db.sales.filter((s) => s.companyId === user.companyId),
  );
  const issuedAt = todayIso();
  const seq = db.counters.cert++;
  const certNo = `MC-${issuedAt.slice(0, 4)}-${String(seq).padStart(4, "0")}`;

  const cert = {
    id: uid("cert"),
    certNo,
    machineId: machine.id,
    companyId: user.companyId,
    grade,
    issuedAt,
    expiresAt: addMonthsIso(issuedAt, 6),
    summary,
    machineSnapshot: {
      name: machine.name,
      nameEn: machine.nameEn,
      category: machine.category,
      maker: machine.maker,
      makerEn: machine.makerEn,
      model: machine.model,
      serialNo: machine.serialNo,
      yearMade: machine.yearMade,
      location: machine.location,
    },
    recordIds: records.map((r) => r.id),
    auditFlags,
    withEnglish,
    fee: withEnglish ? 30000 : 20000,
    revoked: false,
  };
  db.certificates.push(cert);
  saveDb();
  revalidatePath("/", "layout");
  redirect(`/console/certificates/${cert.id}`);
}

// ---------------- 売却・送客 ----------------

export async function createSaleCase(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") throw new Error("売却相談の登録は管理者のみ可能です。");

  const machineId = String(formData.get("machineId") ?? "");
  const db = getDb();
  const machine = db.machines.find((m) => m.id === machineId && m.companyId === user.companyId);
  if (!machine) throw new Error("機械が見つかりません。");
  if (db.sales.some((s) => s.machineId === machine.id && !["closed", "cancelled"].includes(s.status))) {
    throw new Error("この機械には進行中の売却案件があります。");
  }

  const priceRaw = String(formData.get("askingPrice") ?? "").replace(/[,¥\s]/g, "");
  const seq = db.counters.sale++;
  const nowIso = new Date().toISOString();
  const caseNo = `SL-${nowIso.slice(0, 4)}-${String(seq).padStart(4, "0")}`;
  db.sales.push({
    id: uid("sale"),
    caseNo,
    machineId: machine.id,
    companyId: user.companyId,
    status: "consulting",
    askingPrice: priceRaw ? Number(priceRaw) : undefined,
    feeRate: 0.05,
    timeline: [{ at: todayIso(), label: "売却相談を受付" }],
    createdAt: nowIso,
    updatedAt: nowIso,
  });
  machine.status = "listed";
  saveDb();
  revalidatePath("/", "layout");
  redirect("/console/sales");
}

export async function advanceSale(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") throw new Error("売却案件の更新は管理者のみ可能です。");

  const saleId = String(formData.get("saleId") ?? "");
  const action = String(formData.get("action") ?? "");
  const db = getDb();
  const sale = db.sales.find((s) => s.id === saleId && s.companyId === user.companyId);
  if (!sale) throw new Error("案件が見つかりません。");
  const machine = db.machines.find((m) => m.id === sale.machineId);
  const nowIso = new Date().toISOString();
  const today = todayIso();

  const transitions: Record<string, () => void> = {
    assess: () => {
      sale.status = "assessing" as SaleStatus;
      sale.timeline.push({ at: today, label: "査定資料の準備を開始" });
    },
    refer: () => {
      const partnerId = String(formData.get("partnerId") ?? "");
      const partner = db.partners.find((p) => p.id === partnerId);
      if (!partner) throw new Error("紹介先を選択してください。");
      sale.status = "referred";
      sale.partnerId = partner.id;
      const cert = db.certificates
        .filter((c) => c.machineId === sale.machineId && !c.revoked && c.expiresAt >= today)
        .sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1))[0];
      if (cert) sale.certificateId = cert.id;
      sale.timeline.push({ at: today, label: `${partner.name}へ履歴情報とともに紹介` });
    },
    negotiate: () => {
      sale.status = "negotiating";
      sale.timeline.push({ at: today, label: "商談開始" });
    },
    close: () => {
      const priceRaw = String(formData.get("agreedPrice") ?? "").replace(/[,¥\s]/g, "");
      const agreed = priceRaw ? Number(priceRaw) : sale.askingPrice;
      sale.status = "closed";
      sale.agreedPrice = agreed;
      const fee = agreed ? Math.round(agreed * sale.feeRate) : 0;
      sale.timeline.push({
        at: today,
        label: agreed
          ? `成約(${(agreed / 10000).toLocaleString("ja-JP")}万円)・紹介手数料${fee.toLocaleString("ja-JP")}円`
          : "成約",
      });
      if (machine) machine.status = "sold";
    },
    cancel: () => {
      sale.status = "cancelled";
      sale.timeline.push({ at: today, label: "取り下げ" });
      if (machine && machine.status === "listed") machine.status = "idle";
    },
  };

  const fn = transitions[action];
  if (!fn) throw new Error("不正な操作です。");
  fn();
  sale.updatedAt = nowIso;
  saveDb();
  revalidatePath("/", "layout");
}
