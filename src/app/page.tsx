"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { FAMILY_USER_ID, DEFAULT_CATEGORIES } from "@/lib/config";
import type { Envelope, Transaction, TxType } from "@/lib/types";
import { baht, lastMonths, monthKey, MONTHS_TH } from "@/lib/format";
import { DEFAULT_THEME_ID, themeById } from "@/lib/themes";
import { BarChart, Donut, TrendLine, PALETTE } from "@/components/Charts";
import Chat from "@/components/Chat";
import Envelopes from "@/components/Envelopes";
import ThemePicker from "@/components/ThemePicker";

type Tab = "dashboard" | "budget" | "chat";

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [envs, setEnvs] = useState<Envelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [pickerOpen, setPickerOpen] = useState(false);

  // ---- theme ----
  useEffect(() => {
    try { setThemeId(localStorage.getItem("theme") || DEFAULT_THEME_ID); } catch {}
  }, []);
  useEffect(() => {
    const t = themeById(themeId);
    const root = document.documentElement;
    Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.dataset.scheme = /Light|Pastel/.test(t.name) ? "light" : "dark";
    try { localStorage.setItem("theme", t.id); } catch {}
  }, [themeId]);

  // ---- data ----
  const load = useCallback(async () => {
    try {
      const sb = supabaseBrowser();
      const [t, e] = await Promise.all([
        sb.from("transactions").select("*").eq("user_id", FAMILY_USER_ID)
          .order("created_at", { ascending: false }).limit(5000),
        sb.from("envelopes").select("*").eq("user_id", FAMILY_USER_ID).order("created_at"),
      ]);
      if (t.error) throw t.error;
      if (e.error) throw e.error;
      setTxs((t.data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as Transaction[]);
      setEnvs((e.data ?? []).map((r) => ({ ...r, budget: Number(r.budget) })) as Envelope[]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // ---- derived ----
  const d = useMemo(() => {
    const months = lastMonths(6);
    const byMonth: Record<string, { income: number; expense: number }> = {};
    months.forEach((m) => (byMonth[m.key] = { income: 0, expense: 0 }));
    const cur = monthKey(new Date());
    const catThisMonth: Record<string, number> = {};
    let balance = 0;
    for (const t of txs) {
      balance += t.type === "income" ? t.amount : -t.amount;
      const k = monthKey(new Date(t.created_at));
      if (byMonth[k]) byMonth[k][t.type] += t.amount;
      if (k === cur && t.type === "expense") catThisMonth[t.category] = (catThisMonth[t.category] ?? 0) + t.amount;
    }
    const series = months.map((m) => ({ label: m.label, ...byMonth[m.key] }));
    const now = byMonth[cur];
    const net = now.income - now.expense;
    const rate = now.income > 0 ? (net / now.income) * 100 : 0;
    const cats = Object.entries(catThisMonth).sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({
      label, value, color: PALETTE[i % PALETTE.length],
    }));
    return { series, now, net, rate, cats, balance, catThisMonth };
  }, [txs]);

  const insertTx = async (row: { type: TxType; amount: number; category: string; note: string }) => {
    const { error } = await supabaseBrowser().from("transactions").insert({ user_id: FAMILY_USER_ID, ...row });
    if (error) throw error;
    await load();
  };
  const deleteTx = async (id: string) => {
    await supabaseBrowser().from("transactions").delete().eq("id", id);
    await load();
  };

  return (
    <div className="app" data-tab={tab}>
      <header className="topbar">
        <h1>💬 FinanceChat</h1>
        <button className="btn ghost" onClick={() => setPickerOpen(true)} aria-label="เลือกธีม">🎨 ธีม</button>
      </header>

      {error && (
        <div className="card err-card" role="alert">
          ⚠️ {error}
          <br /><small>ตรวจ .env และว่ารัน supabase/schema.sql แล้วหรือยัง</small>
        </div>
      )}

      <main className="layout">
        <div className="col col-dash">
          <section className="card balance">
            <small>ยอดคงเหลือรวม</small>
            <div className="big">{loading ? "…" : baht(d.balance)}</div>
          </section>

          <QuickEntry onSave={insertTx} />

          <section className="card" aria-label="รายรับเทียบรายจ่าย">
            <div className="card-head">
              <h2>รายรับ vs รายจ่าย</h2><small className="muted">6 เดือนล่าสุด</small>
            </div>
            <div className="legend"><span><i style={{ background: "var(--accent)" }} /> รายรับ</span><span><i style={{ background: "var(--accent2)" }} /> รายจ่าย</span></div>
            <BarChart data={d.series} />
          </section>

          <div className="two">
            <section className="card">
              <h2>สัดส่วนใช้จ่าย</h2>
              <div className="center">
                <Donut size={96} thickness={14}
                  center={d.now.income > 0 ? `${Math.min(999, Math.round((d.now.expense / d.now.income) * 100))}%` : "–"}
                  slices={[{ label: "รายจ่าย", value: d.now.expense, color: "var(--accent2)" },
                           { label: "เหลือ", value: Math.max(0, d.net), color: "var(--accent)" }]} />
              </div>
              <small className="muted center">ของรายรับเดือนนี้</small>
            </section>
            <section className="card net">
              <h2>เงินออมสุทธิ</h2>
              <div className="big">{baht(d.net)}</div>
              <div className={d.net >= 0 ? "pos" : "neg"}>{d.net >= 0 ? "▲" : "▼"} อัตราออม {d.rate.toFixed(1)}%</div>
              <small className="muted">{MONTHS_TH[new Date().getMonth()]} นี้</small>
            </section>
          </div>

          <section className="card" aria-label="หมวดหมู่รายจ่าย">
            <h2>หมวดหมู่รายจ่าย <small className="muted">เดือนนี้</small></h2>
            {d.cats.length === 0 ? <p className="muted">ยังไม่มีรายจ่ายเดือนนี้</p> : (
              <div className="cat-row">
                <Donut slices={d.cats} size={120} thickness={18} center={baht(d.now.expense)} />
                <ul className="cat-list">
                  {d.cats.slice(0, 6).map((c) => (
                    <li key={c.label}><i style={{ background: c.color }} />{c.label}<b>{baht(c.value)}</b></li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="card">
            <h2>แนวโน้มเงินออม</h2>
            <TrendLine points={d.series.map((s) => ({ label: s.label, value: s.income - s.expense }))} />
            <ul className="cat-list">
              <li><i style={{ background: "var(--accent)" }} />รายรับเดือนนี้<b>{baht(d.now.income)}</b></li>
              <li><i style={{ background: "var(--accent2)" }} />รายจ่ายเดือนนี้<b>{baht(d.now.expense)}</b></li>
            </ul>
          </section>

          <section className="card">
            <h2>รายการล่าสุด</h2>
            <ul className="tx-list">
              {txs.slice(0, 12).map((t) => (
                <li key={t.id}>
                  <div>
                    <b>{t.note || t.category}</b>
                    <small className="muted">{t.category} · {new Date(t.created_at).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small>
                  </div>
                  <span className={t.type === "income" ? "pos" : "neg"}>{t.type === "income" ? "+" : "−"}{baht(t.amount)}</span>
                  <button className="icon-btn" onClick={() => confirm("ลบรายการนี้?") && deleteTx(t.id)} aria-label="ลบ">🗑</button>
                </li>
              ))}
              {txs.length === 0 && !loading && <p className="muted">ยังไม่มีรายการ ลองพิมพ์ในแชทดูค่ะ</p>}
            </ul>
          </section>
        </div>

        <div className="col col-budget">
          <Envelopes envelopes={envs} spentByCat={d.catThisMonth} onChanged={load} />
        </div>

        <div className="col col-chat">
          <Chat onSaved={load} />
        </div>
      </main>

      <nav className="tabbar" aria-label="เมนู">
        {([["dashboard", "📊", "Dashboard"], ["budget", "👛", "Budget"], ["chat", "💬", "Chat"]] as const).map(([k, ico, label]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            <span>{ico}</span>{label}
          </button>
        ))}
      </nav>

      {pickerOpen && (
        <ThemePicker current={themeId} onPick={setThemeId} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}

function QuickEntry({ onSave }: { onSave: (r: { type: TxType; amount: number; category: string; note: string }) => Promise<void> }) {
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const a = Number(amount);
    if (!(a > 0)) return;
    setBusy(true);
    try {
      await onSave({ type, amount: a, category, note: note.trim() });
      setAmount(""); setNote("");
    } finally { setBusy(false); }
  }

  return (
    <form className="card quick" onSubmit={submit}>
      <div className="card-head">
        <h2>บันทึกด่วน</h2>
        <div className="seg" role="group" aria-label="ประเภท">
          <button type="button" className={type === "expense" ? "on" : ""} onClick={() => setType("expense")}>รายจ่าย</button>
          <button type="button" className={type === "income" ? "on" : ""} onClick={() => setType("income")}>รายรับ</button>
        </div>
      </div>
      <div className="quick-grid">
        <input type="number" inputMode="decimal" min="0" step="any" placeholder="จำนวนเงิน" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="จำนวนเงิน" />
        <input placeholder="รายละเอียด" value={note} onChange={(e) => setNote(e.target.value)} aria-label="รายละเอียด" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="หมวดหมู่">
          {DEFAULT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className="btn" disabled={busy || !(Number(amount) > 0)}>บันทึก</button>
      </div>
    </form>
  );
}
